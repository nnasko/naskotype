"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";

const LobbyCreation: React.FC = () => {
  const [lobbyName, setLobbyName] = useState("");
  const [isPublic, setIsPublic] = useState(true);
  const router = useRouter();

  const handleCreateLobby = async () => {
    if (!lobbyName.trim()) {
      alert("Please enter a lobby name");
      return;
    }

    const token = localStorage.getItem("token");
    const response = await fetch("/api/lobby/create", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ name: lobbyName, isPublic }),
    });

    if (response.ok) {
      const { lobbyCode } = await response.json();
      router.push(`/lobby/${lobbyCode}`);
    } else {
      const errorData = await response.json();
      alert(`Failed to create lobby: ${errorData.message}`);
    }
  };

  return (
    <div className="bg-neutral-800 p-6 rounded-lg shadow-lg mb-8">
      <h2 className="text-2xl font-bold mb-4">Create a Lobby</h2>
      <div className="mb-4">
        <label htmlFor="lobbyName" className="block text-sm font-medium mb-1">
          Lobby Name
        </label>
        <Input
          id="lobbyName"
          type="text"
          value={lobbyName}
          onChange={(e) => setLobbyName(e.target.value)}
          placeholder="Enter lobby name"
          className="w-full"
        />
      </div>
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm font-medium">Public Lobby</span>
        <Switch checked={isPublic} onCheckedChange={setIsPublic} />
      </div>
      <Button
        onClick={handleCreateLobby}
        className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded w-full"
      >
        Create Lobby
      </Button>
    </div>
  );
};

export default LobbyCreation;
