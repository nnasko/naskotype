"use client";
import React, { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { io, Socket } from "socket.io-client";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Home, Trophy, Award } from "lucide-react";

interface GameResult {
  username: string;
  wpm: number | null;
}

interface GameState {
  wordList: string[];
  startTime: number;
  participants: GameResult[];
}

const Game: React.FC = () => {
  const [isTyping, setIsTyping] = useState(false);
  const [wordList, setWordList] = useState<string[]>([]);
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [userInput, setUserInput] = useState("");
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(30);
  const [totalMistakes, setTotalMistakes] = useState(0);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [results, setResults] = useState<GameResult[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [isGameOver, setIsGameOver] = useState(false);

  const textAreaRef = useRef<HTMLTextAreaElement>(null);
  const textContainerRef = useRef<HTMLDivElement>(null);
  const caretRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const router = useRouter();

  const startTyping = useCallback(() => {
    console.log("Starting typing test");
    setIsTyping(true);
    setScore(0);
    setTimeLeft(30);
    setCurrentWordIndex(0);
    setUserInput("");
    setTotalMistakes(0);
    if (textAreaRef.current) textAreaRef.current.focus();
    startTimer();
  }, []);

  const startTimer = useCallback(() => {
    console.log("Starting timer");
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          setIsTyping(false);
          finishGame();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, []);

  const finishGame = useCallback(() => {
    console.log("Finishing game");
    const wpm = Math.round(score / 0.5);
    const lobbyCode = window.location.pathname.split("/").pop();
    socket?.emit("gameFinished", { lobbyCode, wpm });
  }, [score, socket]);

  useEffect(() => {
    console.log("Setting up socket connection");
    const token = localStorage.getItem("token");
    const newSocket = io("http://localhost:3000", {
      transports: ["websocket"],
      auth: { token },
    });

    setSocket(newSocket);

    newSocket.on("connect", () => {
      console.log("Connected to game socket");
      const lobbyCode = window.location.pathname.split("/").pop();
      newSocket.emit("requestGameState", { lobbyCode });
    });

    newSocket.on("gameState", (state: GameState) => {
      console.log("Received game state", state);
      setGameState(state);
      const now = Date.now();
      if (state.startTime > now) {
        setCountdown(Math.ceil((state.startTime - now) / 1000));
      } else {
        setWordList(state.wordList);
        startTyping();
      }
    });

    newSocket.on("gameStarting", (state: GameState) => {
      console.log("Game starting", state);
      setGameState(state);
      setCountdown(3);
    });

    newSocket.on("playerFinished", (result: GameResult) => {
      console.log("Player finished", result);
      setResults((prevResults) => [...prevResults, result]);
    });

    newSocket.on("gameOver", (finalResults: GameResult[]) => {
      console.log("Game over", finalResults);
      setResults(finalResults);
      setIsTyping(false);
      setIsGameOver(true);
    });

    newSocket.on("error", (errorMessage: string) => {
      console.error("Socket error:", errorMessage);
      setError(errorMessage);
    });

    return () => {
      console.log("Cleaning up socket connection");
      newSocket.disconnect();
    };
  }, [startTyping]);

  useEffect(() => {
    if (countdown === null) return;

    console.log("Starting countdown", countdown);
    const countdownInterval = setInterval(() => {
      setCountdown((prev) => {
        if (prev === 1) {
          clearInterval(countdownInterval);
          console.log("Countdown finished");
          if (gameState) {
            setWordList(gameState.wordList);
            startTyping();
          }
          return null;
        }
        return prev! - 1;
      });
    }, 1000);

    return () => clearInterval(countdownInterval);
  }, [countdown, gameState, startTyping]);

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const inputValue = e.target.value;
    setUserInput(inputValue);

    if (inputValue.endsWith(" ")) {
      const typedWord = inputValue.trim();
      if (typedWord === wordList[currentWordIndex]) {
        setScore((prevScore) => prevScore + 1);
        setCurrentWordIndex((prevIndex) => prevIndex + 1);
        setUserInput("");

        if (currentWordIndex === wordList.length - 1) {
          console.log("Requesting more words");
          socket?.emit("requestMoreWords");
        }
      } else {
        setTotalMistakes((prev) => prev + 1);
      }
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

  const renderGameOver = () => (
    <div className="mt-8 w-full max-w-2xl mx-auto">
      <Alert
        variant="default"
        className="mb-6 bg-blue-900 border-blue-700 shadow-lg"
      >
        <Trophy className="h-6 w-6 text-yellow-400 mr-2" />
        <AlertTitle className="text-2xl font-bold mb-2">Game Over!</AlertTitle>
        <AlertDescription className="text-lg">
          <div className="flex justify-between items-center">
            <span>
              Your score:{" "}
              <span className="font-bold text-green-400">{score}</span> words
            </span>
            <span>
              WPM:{" "}
              <span className="font-bold text-blue-400">
                {Math.round(score / 0.5)}
              </span>
            </span>
          </div>
          <div className="mt-2">
            Total mistakes:{" "}
            <span className="font-bold text-red-400">{totalMistakes}</span>
          </div>
        </AlertDescription>
      </Alert>
      <div className="bg-neutral-800 rounded-lg p-6 shadow-lg">
        <h3 className="text-2xl font-bold mb-4 text-center">Leaderboard</h3>
        <ul className="space-y-4">
          {results.map((result, index) => (
            <li
              key={index}
              className="flex items-center justify-between p-3 bg-neutral-700 rounded-lg"
            >
              <div className="flex items-center">
                {index === 0 && (
                  <Trophy className="h-6 w-6 text-yellow-400 mr-2" />
                )}
                {index === 1 && (
                  <Award className="h-6 w-6 text-gray-400 mr-2" />
                )}
                {index === 2 && (
                  <Award className="h-6 w-6 text-yellow-700 mr-2" />
                )}
                <span className="text-lg">{result.username}</span>
              </div>
              <span className="text-lg font-bold">
                {result.wpm}{" "}
                <span className="text-sm text-neutral-400">WPM</span>
              </span>
            </li>
          ))}
        </ul>
      </div>
      <Button
        onClick={() => router.push("/")}
        className="mt-8 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-full text-xl transition duration-300 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 w-full"
      >
        Back to Home
      </Button>
    </div>
  );

  if (error) {
    return <div className="text-red-500">{error}</div>;
  }

  return (
    <div className="min-h-screen bg-neutral-900 text-white flex flex-col items-center justify-center p-8">
      <div className="w-full max-w-4xl">
        <div className="flex justify-between items-center mb-8">
          <Button
            onClick={() => router.push("/")}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-full transition duration-300 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
          >
            <Home className="mr-2 h-4 w-4 inline" /> Home
          </Button>
          <h1 className="text-5xl font-bold text-center">naskotype</h1>
          <div className="w-24"></div>
        </div>
        {countdown !== null ? (
          <div className="text-center">
            <h2 className="text-4xl font-bold mb-4">
              Game starts in: {countdown}
            </h2>
          </div>
        ) : isTyping ? (
          <div className="flex flex-col items-center gap-6 w-full">
            <div className="relative bg-neutral-800 p-6 rounded-lg w-full h-64 overflow-hidden shadow-lg">
              <div
                ref={textContainerRef}
                className="absolute top-0 left-0 right-0 bottom-0 p-6 text-2xl leading-relaxed overflow-y-auto"
              >
                {wordList.map((word, index) => renderWord(word, index))}
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
                <span className="font-bold text-blue-400">{timeLeft}s</span>
              </div>
              <div>
                Score: <span className="font-bold text-green-400">{score}</span>
              </div>
            </div>
          </div>
        ) : isGameOver ? (
          renderGameOver()
        ) : (
          <div className="text-center">
            <h2 className="text-2xl mb-4">Waiting for the game to start...</h2>
          </div>
        )}
      </div>
    </div>
  );
};

export default Game;
