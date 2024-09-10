// pages/create-lobby.tsx
"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const CreateLobby: React.FC = () => {
  const [lobbyName, setLobbyName] = useState("");
  const router = useRouter();

  const handleCreateLobby = async () => {
    const token = localStorage.getItem("token");
    const response = await fetch("/api/lobby/create", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ name: lobbyName }),
    });

    if (response.ok) {
      const { lobbyCode } = await response.json();
      router.push(`/lobby/${lobbyCode}`);
    } else {
      // Handle error
    }
  };

  return (
    <div className="min-h-screen bg-neutral-900 text-white flex flex-col items-center justify-center p-8">
      <h1 className="text-4xl font-bold mb-8">Create a Lobby</h1>
      <Input
        type="text"
        placeholder="Lobby Name"
        value={lobbyName}
        onChange={(e) => setLobbyName(e.target.value)}
        className="mb-4 w-64"
      />
      <Button onClick={handleCreateLobby}>Create Lobby</Button>
    </div>
  );
};

export default CreateLobby;
