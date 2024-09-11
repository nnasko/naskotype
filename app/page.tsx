"use client";
import React, { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import BackgroundStars from "./components/BackgroundStars";
import LobbyCreation from "./components/LobbyCreation";
import { words } from "@/lib/words";

interface ActiveLobby {
  id: string;
  code: string;
  name: string;
  players: number;
  isPublic: boolean;
}

interface TypingData {
  time: number;
  rawSpeed: number;
  mistakes: number;
  wpm: number;
}

const HomePage: React.FC = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [lobbyCode, setLobbyCode] = useState("");
  const [activeLobbies, setActiveLobbies] = useState<ActiveLobby[]>([]);
  const router = useRouter();

  // TypingTest state
  const [isTyping, setIsTyping] = useState(false);
  const [wordList, setWordList] = useState<string[]>([]);
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [userInput, setUserInput] = useState("");
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(30);
  const [typingData, setTypingData] = useState<TypingData[]>([]);
  const [totalMistakes, setTotalMistakes] = useState(0);
  const [typedWords, setTypedWords] = useState<string[]>([]);

  const textAreaRef = useRef<HTMLTextAreaElement>(null);
  const textContainerRef = useRef<HTMLDivElement>(null);
  const caretRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const storedUsername = localStorage.getItem("username");
    if (token && storedUsername) {
      setIsLoggedIn(true);
      setUsername(storedUsername);
    }
    fetchActiveLobbies();
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
    typingData;
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
      console.error("Registration failed");
    }
  };

  const fetchActiveLobbies = async () => {
    try {
      const response = await fetch("/api/lobbies");
      if (response.ok) {
        const lobbies = await response.json();
        setActiveLobbies(lobbies);
      } else {
        console.error("Failed to fetch active lobbies");
      }
    } catch (error) {
      console.error("Error fetching active lobbies:", error);
    }
  };

  const handleJoinLobby = (code: string) => {
    router.push(`/lobby/${code}`);
  };

  // TypingTest functions
  const generateWordList = useCallback(() => {
    return Array.from(
      { length: 100 },
      () => words[Math.floor(Math.random() * words.length)]
    );
  }, []);

  useEffect(() => {
    setWordList(generateWordList());
  }, [generateWordList]);

  const startTimer = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          setIsTyping(false);
          return 0;
        }
        const newTime = prev - 1;
        const elapsedTime = 30 - newTime;
        const rawSpeed = (typedWords.join(" ").length / elapsedTime) * 60;
        const wpm = Math.round((score / elapsedTime) * 60);
        setTypingData((prevData) => [
          ...prevData,
          {
            time: elapsedTime,
            rawSpeed: Math.round(rawSpeed),
            mistakes: totalMistakes,
            wpm: wpm,
          },
        ]);
        return newTime;
      });
    }, 1000);
  }, [score, totalMistakes, typedWords]);

  const startTyping = useCallback(() => {
    setIsTyping(true);
    setScore(0);
    setTimeLeft(30);
    setCurrentWordIndex(0);
    setUserInput("");
    setTypingData([]);
    setTypedWords([]);
    setTotalMistakes(0);
    if (textAreaRef.current) textAreaRef.current.focus();
    startTimer();
  }, [startTimer]);

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const inputValue = e.target.value;
    if (!isTyping && inputValue.trim() !== "") {
      startTyping();
    }
    const currentWord = wordList[currentWordIndex];

    if (inputValue.endsWith(" ")) {
      const typedWord = inputValue.trim();
      if (typedWord === currentWord) {
        setScore((prevScore) => prevScore + 1);
        setCurrentWordIndex((prevIndex) => prevIndex + 1);
        setTypedWords((prev) => [...prev, typedWord]);
        setUserInput("");
      } else {
        setTotalMistakes((prev) => prev + 1);
        setUserInput(inputValue);
      }
    } else {
      setUserInput(inputValue);
    }
    updateCaretPosition();
  };

  const updateCaretPosition = useCallback(() => {
    if (caretRef.current && textContainerRef.current) {
      const currentWordElement =
        textContainerRef.current.children[currentWordIndex];
      if (currentWordElement) {
        const wordRect = currentWordElement.getBoundingClientRect();
        const containerRect = textContainerRef.current.getBoundingClientRect();

        const typedText =
          currentWordElement.textContent?.slice(0, userInput.length) || "";
        const tempSpan = document.createElement("span");
        tempSpan.style.visibility = "hidden";
        tempSpan.style.position = "absolute";
        tempSpan.style.fontSize = getComputedStyle(currentWordElement).fontSize;
        tempSpan.style.fontFamily =
          getComputedStyle(currentWordElement).fontFamily;
        tempSpan.textContent = typedText;
        document.body.appendChild(tempSpan);
        const typedWidth = tempSpan.getBoundingClientRect().width;
        document.body.removeChild(tempSpan);

        const leftOffset = wordRect.left - containerRect.left + typedWidth;
        const topOffset = wordRect.top - containerRect.top;

        caretRef.current.style.left = `${leftOffset}px`;
        caretRef.current.style.top = `${topOffset}px`;
      }
    }
  }, [currentWordIndex, userInput]);

  useEffect(() => {
    updateCaretPosition();
  }, [currentWordIndex, userInput, updateCaretPosition]);

  const renderWord = (word: string, index: number) => {
    const isCurrentWord = index === currentWordIndex;
    const isPastWord = index < currentWordIndex;
    const className = isPastWord
      ? "text-green-200"
      : isCurrentWord
      ? "text-white"
      : "text-neutral-500";

    if (isCurrentWord) {
      const userChars = userInput.split("");
      return (
        <span key={`word-${index}`} className={className}>
          {word.split("").map((char, charIndex) => {
            const userChar = userChars[charIndex];
            let charClassName = "text-white";
            if (userChar !== undefined) {
              charClassName =
                userChar === char ? "text-green-500" : "text-red-500";
            }
            return (
              <span
                key={`char-${index}-${charIndex}`}
                className={charClassName}
              >
                {char}
              </span>
            );
          })}
          {userChars.slice(word.length).map((char, charIndex) => (
            <span
              key={`extra-char-${index}-${charIndex}`}
              className="text-red-500"
            >
              {char}
            </span>
          ))}{" "}
        </span>
      );
    } else {
      return (
        <span key={`word-${index}`} className={className}>
          {word}{" "}
        </span>
      );
    }
  };

  return (
    <div className="min-h-screen bg-neutral-900 text-white">
      <BackgroundStars />
      <div className="z-10 relative">
        <header className="flex justify-between items-center p-4">
          <Link
            href="/"
            className="text-2xl font-bold hover:text-blue-400 transition-colors"
          >
            naskotype
          </Link>
          {isLoggedIn && (
            <div className="flex items-center gap-4">
              <span className="text-neutral-500">
                Logged in as: <span className="font-bold">{username}</span>
              </span>
              <Button
                onClick={handleLogout}
                className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
              >
                Logout
              </Button>
            </div>
          )}
        </header>

        <main className="flex p-8 gap-8">
          {isLoggedIn ? (
            <>
              <div className="w-1/4">
                <h2 className="text-2xl font-bold mb-4">Lobby System</h2>
                <LobbyCreation />
                <div className="flex gap-2 mb-4">
                  <Input
                    type="text"
                    placeholder="Enter lobby code"
                    className="bg-neutral-800 text-white p-2 rounded w-full"
                    value={lobbyCode}
                    onChange={(e) => setLobbyCode(e.target.value)}
                  />
                  <Button
                    onClick={() => handleJoinLobby(lobbyCode)}
                    className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
                  >
                    Join
                  </Button>
                </div>
                <div>
                  <h3 className="text-xl font-bold mb-2">Active Lobbies</h3>
                  <div className="bg-neutral-800 rounded p-4 max-h-64 overflow-y-auto">
                    {activeLobbies.map((lobby) => (
                      <div
                        key={lobby.id}
                        className="mb-2 p-2 bg-neutral-700 rounded flex justify-between items-center"
                      >
                        <span className="text-white">{lobby.name}</span>
                        <div>
                          <span className="mr-2">{lobby.players} players</span>
                          <Button
                            onClick={() => handleJoinLobby(lobby.code)}
                            className="bg-green-600 hover:bg-green-700 text-white font-bold py-1 px-2 rounded text-sm"
                          >
                            Join
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div className="w-3/4">
                <div className="flex flex-col items-center gap-6 w-full">
                  {timeLeft > 0 ? (
                    <>
                      <div className="relative bg-neutral-800 p-6 rounded-lg w-full h-64 overflow-hidden shadow-lg">
                        <div
                          ref={textContainerRef}
                          className="absolute top-0 left-0 right-0 bottom-0 p-6 text-2xl leading-relaxed overflow-y-auto"
                        >
                          {wordList.map((word, index) =>
                            renderWord(word, index)
                          )}
                        </div>
                        <div
                          ref={caretRef}
                          className="absolute w-0.5 h-8 bg-white animate-blink"
                          style={{ transition: "left 0.1s, top 0.1s" }}
                        ></div>
                        <textarea
                          ref={textAreaRef}
                          value={userInput}
                          onChange={handleInputChange}
                          className="absolute top-0 left-0 right-0 bottom-0 bg-transparent text-transparent caret-transparent resize-none p-6 outline-none text-2xl"
                          autoFocus
                        />
                      </div>
                      <div className="flex justify-between w-full text-xl">
                        <div>
                          Time left:{" "}
                          <span className="font-bold text-blue-400">
                            {timeLeft}s
                          </span>
                        </div>
                        <div>
                          Score:{" "}
                          <span className="font-bold text-green-400">
                            {score}
                          </span>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="w-full">
                      <Alert
                        variant="default"
                        className="mb-6 bg-blue-900 border-blue-700"
                      >
                        <AlertCircle className="h-5 w-5 text-blue-400" />
                        <AlertTitle className="text-xl font-bold">
                          Times up!
                        </AlertTitle>
                        <AlertDescription className="text-lg">
                          Final score:{" "}
                          <span className="font-bold text-green-400">
                            {score}
                          </span>{" "}
                          words
                          <br />
                          WPM:{" "}
                          <span className="font-bold text-blue-400">
                            {Math.round(score / 0.5)}
                          </span>
                          <br />
                          Total mistakes:{" "}
                          <span className="font-bold text-red-400">
                            {totalMistakes}
                          </span>
                        </AlertDescription>
                      </Alert>
                      <Button
                        onClick={startTyping}
                        className="mt-4 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-full text-xl transition duration-300 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 w-full"
                      >
                        Try Again
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </>
          ) : (
            <div className="w-full flex justify-center items-center min-h-[calc(100vh-96px)]">
              <div className="bg-neutral-800 p-8 rounded-lg shadow-lg w-full max-w-md">
                <h1 className="text-3xl font-bold text-center mb-6">
                  Welcome to naskotype
                </h1>
                <div className="flex flex-col gap-4">
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
                  <Button
                    onClick={handleLogin}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-md text-xl transition duration-300 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
                  >
                    Login
                  </Button>
                  <Button
                    onClick={handleRegister}
                    className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-md text-xl transition duration-300 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-opacity-50"
                  >
                    Register
                  </Button>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default HomePage;
