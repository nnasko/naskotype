// components/Lobby.tsx
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

const Lobby: React.FC = () => {
  const [lobbyCode, setLobbyCode] = useState<string | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [isReady, setIsReady] = useState(false);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [error, setError] = useState<string | null>(null);

  const router = useRouter();

  useEffect(() => {
    const code = window.location.pathname.split("/").pop();
    setLobbyCode(code || null);

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

    newSocket.on("lobbyUpdate", (updatedParticipants: Participant[]) => {
      console.log("Lobby updated:", updatedParticipants);
      setParticipants(updatedParticipants);
    });

    newSocket.on("error", (errorMessage: string) => {
      console.error("Socket error:", errorMessage);
      setError(errorMessage);
    });

    newSocket.on("startGame", (wordList: string[]) => {
      router.push(`/game/${code}?words=${wordList.join(",")}`);
    });

    return () => {
      newSocket.disconnect();
    };
  }, [router]);

  const handleReadyClick = () => {
    setIsReady(!isReady);
    socket?.emit("playerReady", { lobbyCode, isReady: !isReady });
  };

  if (error) {
    return <div className="text-red-500">{error}</div>;
  }

  return (
    <div className="min-h-screen bg-neutral-900 text-white flex flex-col items-center justify-center p-8 relative overflow-hidden">
      <BackgroundStars />
      <div className="z-10 w-full max-w-md">
        <h1 className="text-5xl font-bold text-center mb-8">Lobby</h1>
        <div className="bg-blue-600 text-white py-2 px-4 rounded-md mb-4 text-center">
          Lobby Code: <span className="font-bold">{lobbyCode}</span>
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
      </div>
    </div>
  );
};

export default Lobby;
