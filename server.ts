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

interface GameState {
  wordList: string[];
  startTime: number;
  participants: {
    userId: number;
    username: string;
    finished: boolean;
    wpm: number | null;
  }[];
}

const activeGames = new Map<string, GameState>();

function generateLobbyCode(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

function generateWordList(): string[] {
  return Array.from(
    { length: 100 },
    () => words[Math.floor(Math.random() * words.length)]
  );
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
          participants: {
            create: {
              userId: userId,
            },
          },
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
      if (existingParticipant) {
        console.log(`User ${userId} is already in lobby ${lobbyCode}`);
        socket.join(lobbyCode);
        socket.emit(
          "lobbyUpdate",
          lobby.participants.map((p) => ({
            id: p.id,
            username: p.user.username,
            isReady: p.isReady,
          }))
        );
        return;
      }

      await prisma.participant.create({
        data: {
          userId: user.id,
          lobbyId: lobby.id,
        },
      });

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
          const wordList = generateWordList();
          const gameState: GameState = {
            wordList,
            startTime: Date.now() + 3000, // Start in 3 seconds
            participants: updatedLobby.participants.map((p) => ({
              userId: p.userId,
              username: p.user.username,
              finished: false,
              wpm: null,
            })),
          };
          activeGames.set(lobbyCode, gameState);
          io.to(lobbyCode).emit("redirectToGame", lobbyCode);
          setTimeout(() => {
            io.to(lobbyCode).emit("gameStarting", gameState);
          }, 100);
        }
      }
    });

    socket.on("requestGameState", async ({ lobbyCode }) => {
      console.log(`Game state requested for lobby: ${lobbyCode}`);
      const gameState = activeGames.get(lobbyCode);
      if (gameState) {
        socket.emit("gameState", gameState);
      } else {
        console.log(`Game not found for lobby: ${lobbyCode}`);
        socket.emit("error", "Game not found");
      }
    });

    socket.on("gameFinished", async ({ lobbyCode, wpm }) => {
      console.log(
        `Game finished for user ${socket.data.userId} in lobby ${lobbyCode} with WPM: ${wpm}`
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
      }

      const playerResult = { username: user.username, wpm };
      io.to(lobbyCode).emit("playerFinished", playerResult);
      console.log(
        `Emitted playerFinished event for ${user.username} with WPM ${wpm}`
      );

      // Check if all participants have finished OR the game time has elapsed
      const allFinishedOrTimeUp =
        gameState.participants.every((p) => p.finished) ||
        (Date.now() - gameState.startTime) / 1000 >= 30; // 30 seconds

      if (allFinishedOrTimeUp) {
        console.log(`Game over for lobby ${lobbyCode}`);
        // If all finished or time's up, mark remaining participants as finished
        gameState.participants.forEach((p) => {
          if (!p.finished) {
            p.finished = true;
            p.wpm = 0; // Set default WPM for unfinished participants
          }
        });

        const sortedParticipants = gameState.participants
          .map((p) => ({ username: p.username, wpm: p.wpm }))
          .sort((a, b) => (b.wpm || 0) - (a.wpm || 0));

        console.log(
          `Emitting gameOver event with results:`,
          sortedParticipants
        );
        io.to(lobbyCode).emit("gameOver", sortedParticipants);
        activeGames.delete(lobbyCode);

        // Reset lobby
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
        }
      }
    });

    socket.on("disconnect", async () => {
      console.log("A user disconnected:", socket.id);
      const userId = socket.data.userId;
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
            updatedLobby.participants.map((p) => ({
              id: p.id,
              username: p.user.username,
              isReady: p.isReady,
            }))
          );
        }
      }
    });
  });

  app.all("*", (req: express.Request, res: express.Response) =>
    nextHandler(req, res)
  );

  const PORT = process.env.PORT || 3000;
  server.listen(PORT, () => {
    console.log(`> Ready on http://localhost:${PORT}`);
  });
});
