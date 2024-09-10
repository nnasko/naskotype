import { Server, Socket } from "socket.io";
import { createServer } from "http";
import express from "express";
import next from "next";
import jwt from "jsonwebtoken";
import { PrismaClient } from "@prisma/client";
import { words } from "./lib/words";

const dev = process.env.NODE_ENV !== "production";
const nextApp = next({ dev });
const nextHandler = nextApp.getRequestHandler();
const prisma = new PrismaClient();

interface Participant {
  userId: number;
  username: string;
  finished: boolean;
  wpm: number | null;
  score: number | null;
  socketId: string | null;
}

interface LobbyParticipant {
  userId: number;
  user: {
    username: string;
  };
}

interface GameState {
  wordList: string[];
  startTime: number;
  participants: Participant[];
}

const activeGames = new Map<string, GameState>();
const gameTimeouts = new Map<string, NodeJS.Timeout>();

function generateLobbyCode(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

function generateWordList(): string[] {
  return Array.from(
    { length: 100 },
    () => words[Math.floor(Math.random() * words.length)]
  );
}

function createGameState(participants: LobbyParticipant[]): GameState {
  return {
    wordList: generateWordList(),
    startTime: Date.now() + 3000, // Start in 3 seconds
    participants: participants.map((p) => ({
      userId: p.userId,
      username: p.user.username,
      finished: false,
      wpm: null,
      score: null,
      socketId: null,
    })),
  };
}

nextApp.prepare().then(() => {
  const app = express();
  const server = createServer(app);
  const io = new Server(server);

  io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) {
      console.log("Authentication error: No token provided");
      return next(new Error("Authentication error"));
    }
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
        userId: number;
      };
      socket.data.userId = decoded.userId;
      console.log(`User authenticated: ${decoded.userId}`);
      next();
    } catch (error) {
      console.error("Authentication error:", error);
      return next(new Error("Authentication error"));
    }
  });

  io.on("connection", async (socket: Socket) => {
    console.log("A user connected:", socket.id);

    socket.on("createLobby", async () => {
      const userId = socket.data.userId;
      console.log(`User ${userId} is creating a lobby`);
      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (!user) {
        console.log(`User not found for ID: ${userId}`);
        socket.emit("error", "User not found");
        return;
      }

      const lobbyCode = generateLobbyCode();
      const lobby = await prisma.lobby.create({
        data: {
          code: lobbyCode,
          creatorId: userId,
          participants: { create: { userId: userId } },
        },
        include: { participants: { include: { user: true } } },
      });

      console.log(`Lobby created: ${lobbyCode}`);
      socket.join(lobbyCode);
      socket.emit("lobbyCreated", lobbyCode);
      io.to(lobbyCode).emit(
        "lobbyUpdate",
        lobby.participants.map((p) => ({
          id: p.id,
          username: p.user.username,
          isReady: p.isReady,
        }))
      );
    });

    socket.on("joinLobby", async ({ lobbyCode }) => {
      console.log(`User ${socket.data.userId} is joining lobby ${lobbyCode}`);
      const userId = socket.data.userId;
      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (!user) {
        console.log(`User not found for ID: ${userId}`);
        socket.emit("error", "User not found");
        return;
      }

      const lobby = await prisma.lobby.findUnique({
        where: { code: lobbyCode },
        include: { participants: { include: { user: true } } },
      });

      if (!lobby) {
        console.log(`Lobby not found: ${lobbyCode}`);
        socket.emit("error", "Lobby not found");
        return;
      }

      const existingParticipant = lobby.participants.find(
        (p) => p.userId === userId
      );
      if (!existingParticipant) {
        await prisma.participant.create({
          data: { userId: user.id, lobbyId: lobby.id },
        });
      }

      console.log(`User ${userId} joined lobby ${lobbyCode}`);
      socket.join(lobbyCode);

      const updatedLobby = await prisma.lobby.findUnique({
        where: { code: lobbyCode },
        include: { participants: { include: { user: true } } },
      });

      if (updatedLobby) {
        io.to(lobbyCode).emit(
          "lobbyUpdate",
          updatedLobby.participants.map((p) => ({
            id: p.id,
            username: p.user.username,
            isReady: p.isReady,
          }))
        );
      }
    });

    socket.on("playerReady", async ({ lobbyCode, isReady }) => {
      console.log(
        `Player ${socket.id} ready status: ${isReady} in lobby ${lobbyCode}`
      );
      const userId = socket.data.userId;
      const lobby = await prisma.lobby.findUnique({
        where: { code: lobbyCode },
        include: { participants: { include: { user: true } } },
      });

      if (!lobby) {
        console.log(`Lobby not found: ${lobbyCode}`);
        socket.emit("error", "Lobby not found");
        return;
      }

      await prisma.participant.updateMany({
        where: { lobbyId: lobby.id, userId: userId },
        data: { isReady: isReady },
      });

      const updatedLobby = await prisma.lobby.findUnique({
        where: { code: lobbyCode },
        include: { participants: { include: { user: true } } },
      });

      if (updatedLobby) {
        io.to(lobbyCode).emit(
          "lobbyUpdate",
          updatedLobby.participants.map((p) => ({
            id: p.id,
            username: p.user.username,
            isReady: p.isReady,
          }))
        );

        if (
          updatedLobby.participants.length >= 2 &&
          updatedLobby.participants.every((p) => p.isReady)
        ) {
          console.log(
            `All players ready in lobby ${lobbyCode}. Starting game.`
          );
          const gameState = createGameState(updatedLobby.participants);
          activeGames.set(lobbyCode, gameState);
          io.to(lobbyCode).emit("gameStarting", lobbyCode);
          setTimeout(() => {
            io.to(lobbyCode).emit("startCountdown");
          }, 100);
        }
      }
    });

    socket.on("joinGame", async ({ lobbyCode }) => {
      console.log(`User ${socket.data.userId} is joining game ${lobbyCode}`);
      const gameState = activeGames.get(lobbyCode);
      if (gameState) {
        socket.join(lobbyCode);

        const participant = gameState.participants.find(
          (p) => p.userId === socket.data.userId
        );
        if (participant) {
          participant.socketId = socket.id;
        }

        socket.emit("gameState", gameState);
        console.log(`Emitted gameState to user ${socket.data.userId}`);
      } else {
        console.log(`Game not found for lobby: ${lobbyCode}`);
        socket.emit("error", "Game not found");
      }
    });

    socket.on("gameFinished", async ({ lobbyCode, wpm, score }) => {
      console.log(
        `Game finished for user ${socket.data.userId} in lobby ${lobbyCode} with WPM: ${wpm}, Score: ${score}`
      );
      const userId = socket.data.userId;
      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (!user) {
        console.log(`User not found for ID: ${userId}`);
        socket.emit("error", "User not found");
        return;
      }

      const gameState = activeGames.get(lobbyCode);
      if (!gameState) {
        console.log(`Game not found for lobby: ${lobbyCode}`);
        socket.emit("error", "Game not found");
        return;
      }

      const participant = gameState.participants.find(
        (p) => p.userId === userId
      );
      if (participant) {
        participant.finished = true;
        participant.wpm = wpm;
        participant.score = score;
        console.log(`Updated participant: ${JSON.stringify(participant)}`);
      }

      const playerResult = { username: user.username, wpm, score };
      io.to(lobbyCode).emit("playerFinished", playerResult);
      console.log(
        `Emitted playerFinished event: ${JSON.stringify(playerResult)}`
      );

      checkGameEnd(lobbyCode);
    });

    socket.on("rematchRequest", async ({ lobbyCode }) => {
      console.log(`Rematch requested in lobby ${lobbyCode}`);
      io.to(lobbyCode).emit("rematchRequested");
    });

    socket.on("rematchAccept", async ({ lobbyCode }) => {
      console.log(`Rematch accepted in lobby ${lobbyCode}`);
      const lobby = await prisma.lobby.findUnique({
        where: { code: lobbyCode },
        include: { participants: { include: { user: true } } },
      });

      if (!lobby) {
        console.log(`Lobby not found: ${lobbyCode}`);
        socket.emit("error", "Lobby not found");
        return;
      }

      await prisma.participant.updateMany({
        where: { lobbyId: lobby.id },
        data: { isReady: false },
      });

      const updatedLobby = await prisma.lobby.findUnique({
        where: { code: lobbyCode },
        include: { participants: { include: { user: true } } },
      });

      if (updatedLobby) {
        io.to(lobbyCode).emit(
          "lobbyUpdate",
          updatedLobby.participants.map((p) => ({
            id: p.id,
            username: p.user.username,
            isReady: false,
          }))
        );
      }

      io.to(lobbyCode).emit("rematchAccepted");
    });

    socket.on("disconnect", async () => {
      console.log("A user disconnected:", socket.id);
      const userId = socket.data.userId;

      if (typeof userId === "number") {
        for (const [lobbyCode, gameState] of Object.entries(activeGames)) {
          const participant = gameState.participants.find(
            (p: { userId: number }) => p.userId === userId
          );
          if (participant) {
            participant.socketId = null;
            console.log(
              `User ${userId} disconnected from game in lobby ${lobbyCode}`
            );
            checkGameEnd(lobbyCode);
            break;
          }
        }

        const participant = await prisma.participant.findFirst({
          where: { userId: userId },
          include: { lobby: true },
        });

        if (participant) {
          await prisma.participant.delete({ where: { id: participant.id } });
          const updatedLobby = await prisma.lobby.findUnique({
            where: { id: participant.lobby.id },
            include: { participants: { include: { user: true } } },
          });

          if (updatedLobby) {
            io.to(updatedLobby.code).emit(
              "lobbyUpdate",
              updatedLobby.participants.map(
                (p: {
                  id: number;
                  user: { username: string };
                  isReady: boolean;
                }) => ({
                  id: p.id,
                  username: p.user.username,
                  isReady: p.isReady,
                })
              )
            );
          }
        }
      } else {
        console.error("Invalid userId in socket data");
      }
    });
  });

  function checkGameEnd(lobbyCode: string) {
    const gameState = activeGames.get(lobbyCode);
    if (!gameState) return;

    const allFinished = gameState.participants.every((p) => p.finished);
    console.log(`All participants finished: ${allFinished}`);

    if (allFinished) {
      console.log("All participants finished, ending game immediately");
      endGame(lobbyCode);
    } else if (!gameTimeouts.has(lobbyCode)) {
      console.log("Setting timeout to end game");
      const timeout = setTimeout(() => endGame(lobbyCode), 5000); // 5 seconds grace period
      gameTimeouts.set(lobbyCode, timeout);
    }
  }

  function endGame(lobbyCode: string) {
    console.log(`Ending game for lobby ${lobbyCode}`);
    const gameState = activeGames.get(lobbyCode);
    if (!gameState) {
      console.log(`No game state found for lobby ${lobbyCode}`);
      return;
    }

    const sortedResults = gameState.participants
      .map((p) => ({
        username: p.username,
        wpm: p.wpm || 0,
        score: p.score || 0,
      }))
      .sort((a, b) => b.wpm - a.wpm);

    console.log(`Final results: ${JSON.stringify(sortedResults)}`);
    io.to(lobbyCode).emit("gameOver", sortedResults);
    console.log(`Emitted gameOver event to lobby ${lobbyCode}`);

    activeGames.delete(lobbyCode);
    console.log(`Deleted game state for lobby ${lobbyCode}`);

    const timeout = gameTimeouts.get(lobbyCode);
    if (timeout) {
      clearTimeout(timeout);
      gameTimeouts.delete(lobbyCode);
      console.log(`Cleared timeout for lobby ${lobbyCode}`);
    }

    resetLobby(lobbyCode);
  }

  async function resetLobby(lobbyCode: string) {
    try {
      await prisma.participant.updateMany({
        where: { lobbyId: lobbyCode },
        data: { isReady: false },
      });

      const updatedLobby = await prisma.lobby.findUnique({
        where: { code: lobbyCode },
        include: { participants: { include: { user: true } } },
      });

      if (updatedLobby) {
        io.to(lobbyCode).emit(
          "lobbyUpdate",
          updatedLobby.participants.map((p) => ({
            id: p.id,
            username: p.user.username,
            isReady: false,
          }))
        );
        console.log(`Emitted lobbyUpdate event for lobby ${lobbyCode}`);
      }
    } catch (error) {
      console.error("Error resetting lobby:", error);
    }
  }

  app.all("*", (req: express.Request, res: express.Response) =>
    nextHandler(req, res)
  );

  const PORT = process.env.PORT || 3000;
  server.listen(PORT, () => {
    console.log(`> Ready on http://localhost:${PORT}`);
  });
});
