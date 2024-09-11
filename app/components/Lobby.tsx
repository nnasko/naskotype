"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { io, Socket } from "socket.io-client";
import { Button } from "@/components/ui/button";
import BackgroundStars from "./BackgroundStars";

interface Participant {
  id: string;
  username: string;
  isReady: boolean;
}

interface LobbyInfo {
  code: string;
  name: string;
  isPublic: boolean;
}

const Lobby: React.FC = () => {
  const [lobbyInfo, setLobbyInfo] = useState<LobbyInfo | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [isReady, setIsReady] = useState(false);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [error, setError] = useState<string | null>(null);

  const router = useRouter();

  useEffect(() => {
    const code = window.location.pathname.split("/").pop();
    const token = localStorage.getItem("token");
    const newSocket = io("http://localhost:3000", {
      transports: ["websocket"],
      auth: { token },
    });

    setSocket(newSocket);

    newSocket.on("connect", () => {
      console.log("Connected to Socket.IO server");
      if (code) {
        newSocket.emit("joinLobby", { lobbyCode: code });
      }
    });

    newSocket.on("lobbyInfo", (info: LobbyInfo) => {
      console.log("Lobby info received:", info);
      setLobbyInfo(info);
    });

    newSocket.on("lobbyUpdate", (updatedParticipants: Participant[]) => {
      console.log("Lobby updated:", updatedParticipants);
      setParticipants(updatedParticipants);
    });

    newSocket.on("error", (errorMessage: string) => {
      console.error("Socket error:", errorMessage);
      setError(errorMessage);
    });

    newSocket.on("gameStarting", (lobbyCode: string) => {
      console.log("Game starting, redirecting to game:", lobbyCode);
      router.push(`/game/${lobbyCode}`);
    });

    return () => {
      newSocket.disconnect();
    };
  }, [router]);

  const handleReadyClick = () => {
    setIsReady(!isReady);
    socket?.emit("playerReady", {
      lobbyCode: lobbyInfo?.code,
      isReady: !isReady,
    });
  };

  if (error) {
    return <div className="text-red-500">{error}</div>;
  }

  const allReady =
    participants.length >= 2 && participants.every((p) => p.isReady);

  return (
    <div className="min-h-screen bg-neutral-900 text-white flex flex-col items-center p-8 relative overflow-hidden">
      <BackgroundStars />
      <div className="z-10 w-full max-w-md">
        <header className="flex justify-center items-center mb-8">
          <a
            href="/"
            className="text-4xl font-bold hover:text-blue-400 transition-colors"
          >
            naskotype
          </a>
        </header>
        <h1 className="text-3xl font-bold text-center mb-8">
          {lobbyInfo?.name || "Loading..."}
        </h1>
        <div className="bg-blue-600 text-white py-2 px-4 rounded-md mb-4 text-center">
          Lobby Code:{" "}
          <span className="font-bold">{lobbyInfo?.code || "Loading..."}</span>
        </div>
        <div className="bg-neutral-700 text-white py-2 px-4 rounded-md mb-4 text-center">
          {lobbyInfo?.isPublic ? "Public Lobby" : "Private Lobby"}
        </div>
        <div className="bg-neutral-800 p-6 rounded-lg shadow-lg mb-8">
          <h2 className="text-2xl font-bold mb-4">Participants</h2>
          <ul>
            {participants.map((participant) => (
              <li
                key={participant.id}
                className="text-xl mb-2 flex justify-between items-center"
              >
                <span>{participant.username}</span>
                <span
                  className={
                    participant.isReady ? "text-green-500" : "text-red-500"
                  }
                >
                  {participant.isReady ? "Ready" : "Not Ready"}
                </span>
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
        {allReady && (
          <p className="text-green-500 mt-4 text-center">
            All players are ready. The game will start shortly!
          </p>
        )}
      </div>
    </div>
  );
};

export default Lobby;
