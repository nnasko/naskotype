"use client";
import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { io, Socket } from "socket.io-client";

const LobbyPage: React.FC = () => {
  const router = useRouter();
  const [lobbyCode, setLobbyCode] = useState<string | null>(null);
  const [playerName, setPlayerName] = useState("");
  const [participants, setParticipants] = useState<
    { id: string; name: string; isReady: boolean }[]
  >([]);
  const [isReady, setIsReady] = useState(false);
  const [socket, setSocket] = useState<Socket | null>(null);

  const connectSocket = useCallback(() => {
    const newSocket = io("http://localhost:3000", {
      transports: ["websocket"],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });
    setSocket(newSocket);
    return newSocket;
  }, []);

  const joinOrCreateLobby = useCallback(
    (socket: Socket, code: string | null, name: string | null) => {
      if (code === "create") {
        socket.emit("createLobby", name);
      } else if (code) {
        socket.emit("joinLobby", { lobbyCode: code, playerName: name });
      }
    },
    []
  );

  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const name = searchParams.get("name");
    const code = window.location.pathname.split("/").pop();

    if (name) setPlayerName(name);
    if (code) setLobbyCode(code);

    const newSocket = io("http://localhost:3000", {
      transports: ["websocket"],
    });
    setSocket(newSocket);

    newSocket.on("connect", () => {
      console.log("Connected to Socket.IO server");
      if (code === "create") {
        newSocket.emit("createLobby", name);
      } else if (code) {
        newSocket.emit("joinLobby", { lobbyCode: code, playerName: name });
      }
    });

    newSocket.on("reconnect", () => {
      console.log("Reconnected to Socket.IO server");
      joinOrCreateLobby(newSocket, lobbyCode, playerName);
    });

    newSocket.on("lobbyCreated", (code: string) => {
      console.log("Lobby created:", code);
      setLobbyCode(code);
      router.replace(`/lobby/${code}?name=${encodeURIComponent(name || "")}`);
    });

    newSocket.on(
      "lobbyUpdate",
      (
        updatedParticipants: { id: string; name: string; isReady: boolean }[]
      ) => {
        console.log("Lobby updated:", updatedParticipants);
        setParticipants(updatedParticipants);
      }
    );

    newSocket.on("startGame", () => {
      router.push(`/game/${lobbyCode}`);
    });

    newSocket.on("connect_error", (error) => {
      console.error("Connection error:", error);
    });

    return () => {
      newSocket.disconnect();
    };
  }, [router, connectSocket, joinOrCreateLobby, lobbyCode, playerName]);

  const handleReadyClick = () => {
    setIsReady(!isReady);
    socket?.emit("playerReady", { lobbyCode, isReady: !isReady });
  };

  return (
    <div className="min-h-screen bg-neutral-900 text-white flex flex-col p-8">
      <h1 className="text-5xl font-bold text-center mb-8">Lobby</h1>
      <div className="text-3xl font-semibold text-center mb-8">
        Lobby Code: {lobbyCode}
      </div>
      <div className="bg-neutral-800 p-6 rounded-lg shadow-lg mb-8">
        <h2 className="text-2xl font-bold mb-4">Participants</h2>
        <ul>
          {participants.map((participant, index) => (
            <li key={index} className="text-xl mb-2">
              {participant.name} {participant.isReady ? "(Ready)" : ""}
            </li>
          ))}
        </ul>
      </div>
      <Button
        onClick={handleReadyClick}
        className={`text-white font-bold py-3 px-6 rounded-lg text-xl transition duration-300 ease-in-out transform hover:scale-105 w-full ${
          isReady
            ? "bg-green-600 hover:bg-green-700"
            : "bg-blue-600 hover:bg-blue-700"
        }`}
      >
        {isReady ? "Ready!" : "Ready Up"}
      </Button>
    </div>
  );
};

export default LobbyPage;
