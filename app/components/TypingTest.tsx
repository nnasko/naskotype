"use client";
import React, { useState, useEffect, useCallback, useRef } from "react";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
	LineChart,
	Line,
	XAxis,
	YAxis,
	CartesianGrid,
	Tooltip,
	Legend,
	ResponsiveContainer,
} from "recharts";

const words = [
	"the",
	"be",
	"to",
	"of",
	"and",
	"a",
	"in",
	"that",
	"have",
	"it",
	"for",
	"not",
	"on",
	"with",
	"he",
	"as",
	"you",
	"do",
	"at",
	"this",
	"but",
	"his",
	"by",
	"from",
	"they",
	"we",
	"say",
	"her",
	"she",
	"or",
	"an",
	"will",
	"my",
	"one",
	"all",
	"would",
	"there",
	"their",
	"what",
	"so",
	"up",
	"out",
	"if",
	"about",
	"who",
	"get",
	"which",
	"go",
	"me",
	// Add more words here to increase variety
];

interface LeaderboardEntry {
	name: string;
	score: number;
}

const TypingTest: React.FC = () => {
	const [isTyping, setIsTyping] = useState(false);
	const [wordList, setWordList] = useState<string[]>([]);
	const [currentWordIndex, setCurrentWordIndex] = useState(0);
	const [userInput, setUserInput] = useState("");
	const [score, setScore] = useState(0);
	const [timeLeft, setTimeLeft] = useState(30);
	const [typingSpeed, setTypingSpeed] = useState<
		{ time: number; speed: number }[]
	>([]);
	const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
	const [playerName, setPlayerName] = useState("");
	const textAreaRef = useRef<HTMLTextAreaElement>(null);
	const timerRef = useRef<NodeJS.Timeout | null>(null);

	const generateWordList = useCallback(() => {
		return Array.from(
			{ length: 100 },
			() => words[Math.floor(Math.random() * words.length)]
		);
	}, []);

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
				setTypingSpeed((prevSpeed) => [
					...prevSpeed,
					{
						time: 30 - newTime,
						speed: Math.round((score / (30 - newTime)) * 60),
					},
				]);
				return newTime;
			});
		}, 1000);
	}, [score]);

	useEffect(() => {
		return () => {
			if (timerRef.current) clearInterval(timerRef.current);
		};
	}, []);

	useEffect(() => {
		if (timeLeft === 0) {
			setIsTyping(false);
			if (timerRef.current) {
				clearInterval(timerRef.current);
				timerRef.current = null;
			}
			updateLeaderboard();
		}
	}, [timeLeft]);

	useEffect(() => {
		if (wordList.length - currentWordIndex <= 20) {
			setWordList((prevList) => [...prevList, ...generateWordList()]);
		}
	}, [currentWordIndex, wordList, generateWordList]);

	const startTyping = () => {
		setIsTyping(true);
		setScore(0);
		setTimeLeft(30);
		setWordList(generateWordList());
		setCurrentWordIndex(0);
		setUserInput("");
		setTypingSpeed([]);
		if (textAreaRef.current) textAreaRef.current.focus();
		startTimer();
	};

	const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
		const inputValue = e.target.value;
		setUserInput(inputValue);

		if (inputValue.endsWith(" ")) {
			const typedWord = inputValue.trim();
			if (typedWord === wordList[currentWordIndex]) {
				setScore((prevScore) => prevScore + 2);
				setCurrentWordIndex((prevIndex) => prevIndex + 1);
				setUserInput("");
			}
		}
	};

	const renderWord = (word: string, index: number) => {
		if (index < currentWordIndex) {
			return (
				<span key={`word-${index}`} className="text-gray-500">
					{word}{" "}
				</span>
			);
		}
		if (index === currentWordIndex) {
			return (
				<span key={`word-${index}`} className="text-white">
					{word.split("").map((char, charIndex) => {
						const userChar = userInput[charIndex];
						let className = "text-white";
						if (userChar !== undefined) {
							className = userChar === char ? "text-green-500" : "text-red-500";
						}
						return (
							<span key={`char-${index}-${charIndex}`} className={className}>
								{char}
							</span>
						);
					})}{" "}
				</span>
			);
		}
		return (
			<span key={`word-${index}`} className="text-gray-700">
				{word}{" "}
			</span>
		);
	};

	const updateLeaderboard = () => {
		const newEntry: LeaderboardEntry = {
			name: playerName || "Anonymous",
			score,
		};
		setLeaderboard((prev) =>
			[...prev, newEntry].sort((a, b) => b.score - a.score).slice(0, 10)
		);
	};

	const averageSpeed = score; // Since the test is 30 seconds, multiply by 2 to get WPM
	const maxSpeed = Math.max(...typingSpeed.map((data) => data.speed), 0);

	return (
		<div className="min-h-screen bg-gray-900 text-white flex flex-col items-center justify-center p-8">
			<h1 className="text-5xl font-bold mb-8">Naskos Typing Tester 😈</h1>

			{!isTyping && timeLeft === 30 ? (
				<div className="flex flex-col items-center gap-4">
					<input
						type="text"
						placeholder="Enter your name"
						value={playerName}
						onChange={(e) => setPlayerName(e.target.value)}
						className="bg-gray-800 text-white p-2 rounded"
					/>
					<button
						onClick={startTyping}
						className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg text-xl transition duration-300 ease-in-out transform hover:scale-105"
					>
						Start 30-Second Typing Test
					</button>
				</div>
			) : (
				isTyping && (
					<div className="flex flex-col items-center gap-6 w-full max-w-3xl">
						<div className="relative bg-gray-800 p-6 rounded-lg w-full h-48 overflow-hidden shadow-lg">
							<div className="absolute top-0 left-0 right-0 bottom-0 p-6 text-2xl leading-relaxed">
								{wordList
									.slice(currentWordIndex, currentWordIndex + 15)
									.map((word, index) =>
										renderWord(word, currentWordIndex + index)
									)}
							</div>
							<textarea
								ref={textAreaRef}
								value={userInput}
								onChange={handleInputChange}
								className="absolute top-0 left-0 right-0 bottom-0 bg-transparent text-transparent caret-white resize-none p-6 outline-none text-2xl"
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
				)
			)}

			{timeLeft === 0 && (
				<div className="mt-8 w-full max-w-3xl">
					<Alert variant="default" className="mb-6 bg-blue-900 border-blue-700">
						<AlertCircle className="h-5 w-5 text-blue-400" />
						<AlertTitle className="text-xl font-bold">Times up!</AlertTitle>
						<AlertDescription className="text-lg">
							Final score:{" "}
							<span className="font-bold text-green-400">{score}</span> words
							per minute
							<br />
							Average speed:{" "}
							<span className="font-bold text-blue-400">
								{averageSpeed}
							</span>{" "}
							WPM
							<br />
							Max speed:{" "}
							<span className="font-bold text-purple-400">{maxSpeed}</span> WPM
						</AlertDescription>
					</Alert>
					<div className="h-64 bg-gray-800 p-4 rounded-lg shadow-lg mb-8">
						<ResponsiveContainer width="100%" height="100%">
							<LineChart data={typingSpeed}>
								<CartesianGrid strokeDasharray="3 3" stroke="#444" />
								<XAxis
									dataKey="time"
									stroke="#888"
									label={{
										value: "Time (s)",
										position: "insideBottom",
										offset: -5,
										fill: "#888",
									}}
								/>
								<YAxis
									stroke="#888"
									label={{
										value: "WPM",
										angle: -90,
										position: "insideLeft",
										fill: "#888",
									}}
								/>
								<Tooltip
									contentStyle={{ backgroundColor: "#1f2937", border: "none" }}
								/>
								<Legend />
								<Line
									type="monotone"
									dataKey="speed"
									stroke="#8884d8"
									strokeWidth={2}
									dot={false}
								/>
							</LineChart>
						</ResponsiveContainer>
					</div>
					<div className="bg-gray-800 p-4 rounded-lg shadow-lg">
						<h2 className="text-2xl font-bold mb-4">Leaderboard</h2>
						<ul>
							{leaderboard.map((entry, index) => (
								<li key={index} className="flex justify-between mb-2">
									<span>{entry.name}</span>
									<span>{entry.score} WPM</span>
								</li>
							))}
						</ul>
					</div>
				</div>
			)}
		</div>
	);
};

export default TypingTest;
