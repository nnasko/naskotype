"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const Lobby: React.FC = () => {
  const router = useRouter();
  const [playerName, setPlayerName] = useState("");
  const [lobbyCode, setLobbyCode] = useState("");

  const handleCreateLobby = () => {
    if (playerName) {
      router.push(`/lobby/create?name=${encodeURIComponent(playerName)}`);
    }
  };

  const handleJoinLobby = () => {
    if (playerName && lobbyCode) {
      router.push(`/lobby/${lobbyCode}?name=${encodeURIComponent(playerName)}`);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-900 text-white flex flex-col items-center justify-center p-8">
      <h1 className="text-5xl font-bold text-center mb-8">
        Create or Join Lobby
      </h1>
      <Input
        type="text"
        placeholder="Enter your name"
        value={playerName}
        onChange={(e) => setPlayerName(e.target.value)}
        className="mb-4 w-64"
      />
      <Button onClick={handleCreateLobby} className="mb-4 w-64">
        Create Lobby
      </Button>
      <Input
        type="text"
        placeholder="Enter lobby code"
        value={lobbyCode}
        onChange={(e) => setLobbyCode(e.target.value)}
        className="mb-4 w-64"
      />
      <Button onClick={handleJoinLobby} className="w-64">
        Join Lobby
      </Button>
    </div>
  );
};

export default Lobby;
