import { Server, Socket } from "socket.io";
import { createServer } from "http";
import express, { Request, Response } from "express";
import next from "next";

const dev = process.env.NODE_ENV !== "production";
const nextApp = next({ dev });
const nextHandler = nextApp.getRequestHandler();

nextApp.prepare().then(() => {
  const app = express();
  const server = createServer(app);
  const io = new Server(server, {
    cors: {
      origin: "http://localhost:3000",
      methods: ["GET", "POST"],
    },
  });

  interface Participant {
    id: string;
    name: string;
    isReady: boolean;
  }

  interface Lobby {
    code: string;
    participants: Participant[];
  }

  const lobbies: Record<string, Lobby> = {};
  const userLobbyMap: Record<string, string> = {};

  function generateLobbyCode(): string {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  }

  function updateLobby(lobbyCode: string) {
    if (lobbies[lobbyCode]) {
      io.to(lobbyCode).emit("lobbyUpdate", lobbies[lobbyCode].participants);
      console.log(
        `Lobby ${lobbyCode} updated:`,
        lobbies[lobbyCode].participants
      );
    }
  }

  function removeUserFromLobby(socketId: string) {
    const lobbyCode = userLobbyMap[socketId];
    if (lobbyCode && lobbies[lobbyCode]) {
      lobbies[lobbyCode].participants = lobbies[lobbyCode].participants.filter(
        (p) => p.id !== socketId
      );
      delete userLobbyMap[socketId];
      if (lobbies[lobbyCode].participants.length === 0) {
        delete lobbies[lobbyCode];
        console.log(`Lobby ${lobbyCode} deleted (empty)`);
      } else {
        updateLobby(lobbyCode);
      }
    }
  }

  io.on("connection", (socket: Socket) => {
    console.log("A user connected:", socket.id);

    socket.on("createLobby", (creatorName: string) => {
      removeUserFromLobby(socket.id); // Remove from any existing lobby
      const lobbyCode = generateLobbyCode();
      lobbies[lobbyCode] = {
        code: lobbyCode,
        participants: [{ id: socket.id, name: creatorName, isReady: false }],
      };
      userLobbyMap[socket.id] = lobbyCode;
      socket.join(lobbyCode);
      socket.emit("lobbyCreated", lobbyCode);
      updateLobby(lobbyCode);
      console.log(`Lobby ${lobbyCode} created by ${creatorName}`);
    });

    socket.on(
      "joinLobby",
      ({
        lobbyCode,
        playerName,
      }: {
        lobbyCode: string;
        playerName: string;
      }) => {
        console.log(
          `Player ${playerName} attempting to join lobby ${lobbyCode}`
        );
        removeUserFromLobby(socket.id); // Remove from any existing lobby
        if (lobbies[lobbyCode]) {
          lobbies[lobbyCode].participants.push({
            id: socket.id,
            name: playerName,
            isReady: false,
          });
          userLobbyMap[socket.id] = lobbyCode;
          socket.join(lobbyCode);
          updateLobby(lobbyCode);
          console.log(`Player ${playerName} joined lobby ${lobbyCode}`);
        } else {
          socket.emit("error", "Lobby not found");
          console.log(`Lobby ${lobbyCode} not found for player ${playerName}`);
        }
      }
    );

    socket.on(
      "playerReady",
      ({ lobbyCode, isReady }: { lobbyCode: string; isReady: boolean }) => {
        if (lobbies[lobbyCode]) {
          const participant = lobbies[lobbyCode].participants.find(
            (p) => p.id === socket.id
          );
          if (participant) {
            participant.isReady = isReady;
            updateLobby(lobbyCode);
            console.log(`Player ${participant.name} ready status: ${isReady}`);

            if (lobbies[lobbyCode].participants.every((p) => p.isReady)) {
              io.to(lobbyCode).emit("startGame");
              console.log(`Game started in lobby ${lobbyCode}`);
            }
          }
        }
      }
    );

    socket.on("disconnect", () => {
      console.log("A user disconnected:", socket.id);
      removeUserFromLobby(socket.id);
    });
  });

  app.all("*", (req: Request, res: Response) => nextHandler(req, res));

  const PORT = process.env.PORT || 3000;
  server.listen(PORT, () => {
    console.log(`> Ready on http://localhost:${PORT}`);
  });
});
