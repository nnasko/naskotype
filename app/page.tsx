// app/page.tsx
"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import BackgroundStars from "./components/BackgroundStars";

const HomePage: React.FC = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [lobbyCode, setLobbyCode] = useState("");
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem("token");
    const storedUsername = localStorage.getItem("username");
    if (token && storedUsername) {
      setIsLoggedIn(true);
      setUsername(storedUsername);
    }
  }, []);

  const handleLogin = async () => {
    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });

    if (response.ok) {
      const { token } = await response.json();
      localStorage.setItem("token", token);
      localStorage.setItem("username", username);
      setIsLoggedIn(true);
    } else {
      console.error("Login failed");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("username");
    setIsLoggedIn(false);
    setUsername("");
  };

  const handleRegister = async () => {
    const response = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });

    if (response.ok) {
      await handleLogin();
    } else {
      // Handle registration error
      console.error("Registration failed");
    }
  };

  const handleCreateLobby = async () => {
    const token = localStorage.getItem("token");
    const response = await fetch("/api/lobby/create", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    if (response.ok) {
      const { lobbyCode } = await response.json();
      router.push(`/lobby/${lobbyCode}`);
    } else {
      // Handle error
      console.error("Failed to create lobby");
    }
  };

  const handleJoinLobby = () => {
    if (lobbyCode) {
      router.push(`/lobby/${lobbyCode}`);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-900 text-white flex flex-col items-center justify-center p-8">
      <BackgroundStars />
      <div className="z-10">
        <h1 className="text-5xl font-bold text-center mb-8">naskotype</h1>
        {!isLoggedIn ? (
          <div className="flex flex-col items-center gap-4">
            <Input
              type="text"
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
            <Input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <Button onClick={handleLogin}>Login</Button>
            <Button onClick={handleRegister}>Register</Button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-4">
            <p>logged in as: {username}</p>
            <Button
              onClick={handleCreateLobby}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-md text-xl transition duration-300 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 w-full"
            >
              Create a Lobby
            </Button>
            <div className="flex gap-2">
              <Input
                type="text"
                placeholder="Enter lobby code"
                className="bg-neutral-800 text-white p-2 rounded w-full"
                value={lobbyCode}
                onChange={(e) => setLobbyCode(e.target.value)}
              />
              <Button
                onClick={handleJoinLobby}
                className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-md text-lg transition duration-300 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-opacity-50"
              >
                Join Lobby
              </Button>
            </div>
            <Button
              onClick={() => router.push("/typing-test")}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-md text-xl transition duration-300 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 w-full"
            >
              Start Typing Test
            </Button>
            <Button
              onClick={handleLogout}
              className="bg-red-600 hover:bg-red-700 py-2 px-6 rounded-md w-full text-white font-bold transition duration-300 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-50"
            >
              Logout
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default HomePage;
