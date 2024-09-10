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
      return next(new Error("Authentication error"));
    }
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
        userId: number;
      };
      socket.data.userId = decoded.userId;
      next();
    } catch (error) {
      return next(new Error("Authentication error"));
    }
  });

  io.on("connection", async (socket: Socket) => {
    console.log("A user connected:", socket.id);

    socket.on("createLobby", async () => {
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
          creatorId: userId,
          participants: {
            create: {
              userId: userId,
            },
          },
        },
        include: { participants: { include: { user: true } } },
      });

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
      if (existingParticipant) {
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
          io.to(lobbyCode).emit("redirectToGame");
          
          setTimeout(() => {
            io.to(lobbyCode).emit("startCountdown");
          }, 1000);

          setTimeout(() => {
            const wordList = generateWordList();
            io.to(lobbyCode).emit("startGame", wordList);
            console.log(`Game started in lobby ${lobbyCode}`);
          }, 4000);
        }
      }
    });

    socket.on("requestMoreWords", async () => {
      const additionalWords = generateWordList();
      socket.emit("additionalWords", additionalWords);
    });

    socket.on("gameFinished", async ({ lobbyCode, wpm }) => {
      const userId = socket.data.userId;
      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (!user) {
        socket.emit("error", "User not found");
        return;
      }

      io.to(lobbyCode).emit("playerFinished", { username: user.username, wpm });

      const lobby = await prisma.lobby.findUnique({
        where: { code: lobbyCode },
        include: { participants: true },
      });

      if (lobby) {
        const allFinished = lobby.participants.every(
          (p) => p.isReady === false
        );
        if (allFinished) {
          await prisma.participant.updateMany({
            where: { lobbyId: lobby.id },
            data: { isReady: false },
          });
          io.to(lobbyCode).emit("gameOver");
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