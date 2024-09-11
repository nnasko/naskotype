import { Server, Socket } from "socket.io";
import { createServer } from "http";
import next from "next";
import jwt from "jsonwebtoken";
import { PrismaClient } from "@prisma/client";
import { words } from "./lib/words";

const dev = process.env.NODE_ENV !== "production";
const nextApp = next({ dev });
const nextHandler = nextApp.getRequestHandler();
const prisma = new PrismaClient();

interface PrismaParticipant {
  id: number;
  userId: number;
  lobbyId: string;
  isReady: boolean;
  user: {
    id: number;
    username: string;
    password: string;
  };
}

interface GameParticipant {
  userId: number;
  username: string;
  finished: boolean;
  wpm: number | null;
  score: number | null;
  socketId: string | null;
}

interface GameState {
  wordList: string[];
  startTime: number;
  endTime: number;
  participants: GameParticipant[];
}

interface LobbyParticipant {
  userId: number;
  user: {
    username: string;
  };
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
  const gameState = {
    wordList: generateWordList(),
    startTime: Date.now() + 5000, // Start in 5 seconds
    endTime: Date.now() + 35000, // End after 35 seconds (5s countdown + 30s game)
    participants: participants.map((p) => ({
      userId: p.userId,
      username: p.user.username,
      finished: false,
      wpm: 0,
      score: 0,
      socketId: null,
    })),
  };

  return gameState;
}

function updateLobbyParticipants(participants: PrismaParticipant[]) {
  return participants.map((p) => ({
    id: p.id,
    username: p.user.username,
    isReady: p.isReady,
  }));
}

nextApp.prepare().then(() => {
  const server = createServer(nextHandler);
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

    socket.on("createLobby", async ({ name, isPublic }) => {
      const userId = socket.data.userId;
      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (!user) {
        socket.emit("error", "User not found");
        return;
      }

      const lobbyCode = generateLobbyCode();
      const lobby = await prisma.lobby.create({
        data: {
          code: lobbyCode,
          name,
          isPublic,
          creatorId: userId,
          participants: { create: { userId: userId } },
        },
        include: { participants: { include: { user: true } } },
      });

      socket.join(lobbyCode);
      socket.emit("lobbyCreated", lobbyCode);
      io.to(lobbyCode).emit("lobbyInfo", {
        code: lobby.code,
        name: lobby.name,
        isPublic: lobby.isPublic,
      });
      io.to(lobbyCode).emit(
        "lobbyUpdate",
        updateLobbyParticipants(lobby.participants)
      );
    });

    socket.on("joinLobby", async ({ lobbyCode }) => {
      const userId = socket.data.userId;
      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (!user) {
        socket.emit("error", "User not found");
        return;
      }

      const lobby = await prisma.lobby.findUnique({
        where: { code: lobbyCode },
        include: { participants: { include: { user: true } } },
      });

      if (!lobby) {
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

      socket.join(lobbyCode);
      socket.emit("lobbyInfo", {
        code: lobby.code,
        name: lobby.name,
        isPublic: lobby.isPublic,
      });

      const updatedLobby = await prisma.lobby.findUnique({
        where: { code: lobbyCode },
        include: { participants: { include: { user: true } } },
      });

      if (updatedLobby) {
        io.to(lobbyCode).emit(
          "lobbyUpdate",
          updateLobbyParticipants(updatedLobby.participants)
        );
      }
    });

    socket.on("playerReady", async ({ lobbyCode, isReady }) => {
      const userId = socket.data.userId;
      const lobby = await prisma.lobby.findUnique({
        where: { code: lobbyCode },
        include: { participants: { include: { user: true } } },
      });

      if (!lobby) {
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
          updateLobbyParticipants(updatedLobby.participants)
        );

        if (
          updatedLobby.participants.length >= 2 &&
          updatedLobby.participants.every((p) => p.isReady)
        ) {
          const gameState = createGameState(updatedLobby.participants);
          activeGames.set(lobbyCode, gameState);
          io.to(lobbyCode).emit("gameStarting", lobbyCode);
          setTimeout(() => {
            io.to(lobbyCode).emit("startCountdown");
          }, 100);

          // Set a timeout to end the game after 35 seconds (5s countdown + 30s game)
          setTimeout(() => {
            endGame(lobbyCode);
          }, 35000);
        }
      }
    });

    socket.on("joinGame", async ({ lobbyCode }) => {
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
      } else {
        socket.emit("error", "Game not found");
      }
    });

    socket.on("gameFinished", async ({ lobbyCode }) => {
      const userId = socket.data.userId;
      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (!user) {
        socket.emit("error", "User not found");
        return;
      }

      const gameState = activeGames.get(lobbyCode);
      if (!gameState) {
        socket.emit("error", "Game not found");
        return;
      }

      const participant = gameState.participants.find(
        (p) => p.userId === userId
      );
      if (participant) {
        participant.finished = true;
        const score = participant.score || 0;
        const wpm = score * 2;
        const playerResult = { username: user.username, wpm, score };
        console.log("Broadcasting playerFinished event:", playerResult);
        io.to(lobbyCode).emit("playerFinished", playerResult);
      }
    });

    socket.on("rematchRequest", async ({ lobbyCode }) => {
      io.to(lobbyCode).emit("rematchRequested");
    });

    socket.on("rematchAccept", async ({ lobbyCode }) => {
      const lobby = await prisma.lobby.findUnique({
        where: { code: lobbyCode },
        include: { participants: { include: { user: true } } },
      });

      if (!lobby) {
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
          updateLobbyParticipants(updatedLobby.participants)
        );
      }

      io.to(lobbyCode).emit("rematchAccepted");
    });

    socket.on("updateScore", async ({ lobbyCode, score }) => {
      const gameState = activeGames.get(lobbyCode);
      if (gameState) {
        const participant = gameState.participants.find(
          (p) => p.userId === socket.data.userId
        );
        if (participant) {
          participant.score = score;
          participant.wpm = score * 2; // Update WPM as well
        }
      }
    });

    socket.on("disconnect", async () => {
      const userId = socket.data.userId;

      if (typeof userId === "number") {
        for (const [lobbyCode, gameState] of Array.from(
          activeGames.entries()
        )) {
          const participant = gameState.participants.find(
            (p) => p.userId === userId
          );
          if (participant) {
            participant.socketId = null;
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
              updateLobbyParticipants(updatedLobby.participants)
            );
          }
        }
      } else {
        console.error("Invalid userId in socket data");
      }
    });
  });

  function endGame(lobbyCode: string) {
    const gameState = activeGames.get(lobbyCode);
    if (!gameState) return;

    const sortedResults = gameState.participants
      .map((p) => {
        const score = p.score || 0;
        const wpm = score * 2;
        return { username: p.username, wpm, score };
      })
      .sort((a, b) => b.wpm - a.wpm);

    console.log("Emitting gameOver event with results:", sortedResults);
    io.to(lobbyCode).emit("gameOver", sortedResults);

    activeGames.delete(lobbyCode);

    const timeout = gameTimeouts.get(lobbyCode);
    if (timeout) {
      clearTimeout(timeout);
      gameTimeouts.delete(lobbyCode);
    }

    resetLobby(lobbyCode);
  }

  async function resetLobby(lobbyCode: string) {
    try {
      await prisma.participant.updateMany({
        where: { lobby: { code: lobbyCode } },
        data: { isReady: false },
      });

      const updatedLobby = await prisma.lobby.findUnique({
        where: { code: lobbyCode },
        include: { participants: { include: { user: true } } },
      });

      if (updatedLobby) {
        io.to(lobbyCode).emit(
          "lobbyUpdate",
          updateLobbyParticipants(updatedLobby.participants)
        );
      }
    } catch (error) {
      console.error("Error resetting lobby:", error);
    }
  }

  const PORT = process.env.PORT || 3000;
  server.listen(PORT, () => {
    console.log(`> Ready on http://localhost:${PORT}`);
  });
});
