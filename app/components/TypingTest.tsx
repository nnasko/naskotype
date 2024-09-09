/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";
import React, { useState, useEffect, useCallback, useRef } from "react";
import { AlertCircle, Home } from "lucide-react";
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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import Cookies from "js-cookie";

const words = [
  "a",
  "abandon",
  "ability",
  "able",
  "about",
  "above",
  "abroad",
  "absence",
  "absorb",
  "abuse",
  "accept",
  "access",
  "account",
  "accuse",
  "achieve",
  "acid",
  "acquire",
  "across",
  "act",
  "action",
  "active",
  "actor",
  "actress",
  "actual",
  "ad",
  "adapt",
  "add",
  "address",
  "adjust",
  "admire",
  "admit",
  "adopt",
  "adult",
  "advance",
  "advice",
  "advise",
  "adviser",
  "affair",
  "affect",
  "afford",
  "afraid",
  "african",
  "after",
  "again",
  "against",
  "age",
  "agency",
  "agenda",
  "agent",
  "ago",
  "agree",
  "ah",
  "ahead",
  "aid",
  "aide",
  "aids",
  "aim",
  "air",
  "airline",
  "airport",
  "album",
  "alcohol",
  "alive",
  "all",
  "allow",
  "ally",
  "almost",
  "alone",
  "along",
  "already",
  "also",
  "alter",
  "always",
  "am",
  "amazing",
  "among",
  "amount",
  "analyst",
  "analyze",
  "ancient",
  "and",
  "anger",
  "angle",
  "angry",
  "animal",
  "annual",
  "another",
  "answer",
  "anxiety",
  "any",
  "anybody",
  "anymore",
  "anyone",
  "anyway",
  "apart",
  "appeal",
  "appear",
  "apple",
  "apply",
  "appoint",
  "approve",
  "arab",
  "area",
  "argue",
  "arise",
  "arm",
  "armed",
  "army",
  "around",
  "arrange",
  "arrest",
  "arrival",
  "arrive",
  "art",
  "article",
  "artist",
  "as",
  "asian",
  "aside",
  "ask",
  "asleep",
  "aspect",
  "assault",
  "assert",
  "assess",
  "asset",
  "assign",
  "assist",
  "assume",
  "assure",
  "at",
  "athlete",
  "attach",
  "attack",
  "attempt",
  "attend",
  "attract",
  "author",
  "auto",
  "average",
  "avoid",
  "award",
  "aware",
  "away",
  "awful",
  "baby",
  "back",
  "bad",
  "badly",
  "bag",
  "bake",
  "balance",
  "ball",
  "ban",
  "band",
  "bank",
  "bar",
  "barely",
  "barrel",
  "barrier",
  "base",
  "basic",
  "basis",
  "basket",
  "battery",
  "battle",
  "be",
  "beach",
  "bean",
  "bear",
  "beat",
  "beauty",
  "because",
  "become",
  "bed",
  "bedroom",
  "beer",
  "before",
  "begin",
  "behind",
  "being",
  "belief",
  "believe",
  "bell",
  "belong",
  "below",
  "belt",
  "bench",
  "bend",
  "beneath",
  "benefit",
  "beside",
  "besides",
  "best",
  "bet",
  "better",
  "between",
  "beyond",
  "bible",
  "big",
  "bike",
  "bill",
  "billion",
  "bind",
  "bird",
  "birth",
  "bit",
  "bite",
  "black",
  "blade",
  "blame",
  "blanket",
  "blind",
  "block",
  "blood",
  "blow",
  "blue",
  "board",
  "boat",
  "body",
  "bomb",
  "bombing",
  "bond",
  "bone",
  "book",
  "boom",
  "boot",
  "border",
  "born",
  "borrow",
  "boss",
  "both",
  "bother",
  "bottle",
  "bottom",
  "bowl",
  "box",
  "boy",
  "brain",
  "branch",
  "brand",
  "bread",
  "break",
  "breast",
  "breath",
  "breathe",
  "brick",
  "bridge",
  "brief",
  "briefly",
  "bright",
  "bring",
  "british",
  "broad",
  "broken",
  "brother",
  "brown",
  "brush",
  "buck",
  "budget",
  "build",
  "bullet",
  "bunch",
  "burden",
  "burn",
  "bury",
  "bus",
  "busy",
  "but",
  "butter",
  "button",
  "buy",
  "buyer",
  "by",
  "cabin",
  "cabinet",
  "cable",
  "cake",
  "call",
  "camera",
  "camp",
  "campus",
  "can",
  "cancer",
  "cap",
  "capable",
  "capital",
  "captain",
  "capture",
  "car",
  "carbon",
  "card",
  "care",
  "career",
  "careful",
  "carrier",
  "carry",
  "case",
  "cash",
  "cast",
  "cat",
  "catch",
  "cause",
  "ceiling",
  "cell",
  "center",
  "central",
  "century",
  "ceo",
  "certain",
  "chain",
  "chair",
  "chamber",
  "chance",
  "change",
  "channel",
  "chapter",
  "charge",
  "charity",
  "chart",
  "chase",
  "cheap",
  "check",
  "cheek",
  "cheese",
  "chef",
  "chest",
  "chicken",
  "chief",
  "child",
  "chinese",
  "chip",
  "choice",
  "choose",
  "church",
  "circle",
  "cite",
  "citizen",
  "city",
  "civil",
  "claim",
  "class",
  "classic",
  "clean",
  "clear",
  "clearly",
  "client",
  "climate",
  "climb",
  "clinic",
  "clock",
  "close",
  "closely",
  "closer",
  "clothes",
  "cloud",
  "club",
  "clue",
  "cluster",
  "coach",
  "coal",
  "coast",
  "coat",
  "code",
  "coffee",
  "cold",
  "collect",
  "college",
  "color",
  "column",
  "combine",
  "come",
  "comedy",
  "comfort",
  "command",
  "comment",
  "commit",
  "common",
  "company",
  "compare",
  "compete",
  "complex",
  "compose",
  "concept",
  "concern",
  "concert",
  "conduct",
  "confirm",
  "connect",
  "consist",
  "consume",
  "contact",
  "contain",
  "content",
  "contest",
  "context",
  "control",
  "convert",
  "cook",
  "cookie",
  "cooking",
  "cool",
  "cop",
  "cope",
  "copy",
  "core",
  "corn",
  "corner",
  "correct",
  "cost",
  "cotton",
  "couch",
  "could",
  "council",
  "count",
  "counter",
  "country",
  "county",
  "couple",
  "courage",
  "course",
  "court",
  "cousin",
  "cover",
  "cow",
  "crack",
  "craft",
  "crash",
  "crazy",
  "cream",
  "create",
  "credit",
  "crew",
  "crime",
  "crisis",
  "critic",
  "crop",
  "cross",
  "crowd",
  "crucial",
  "cry",
  "culture",
  "cup",
  "curious",
  "current",
  "custom",
  "cut",
  "cycle",
  "dad",
  "daily",
  "damage",
  "dance",
  "danger",
  "dare",
  "dark",
  "data",
  "date",
  "day",
  "dead",
  "deal",
  "dealer",
  "dear",
  "death",
  "debate",
  "debt",
  "decade",
  "decide",
  "deck",
  "declare",
  "decline",
  "deep",
  "deeply",
  "deer",
  "defeat",
  "defend",
  "defense",
  "deficit",
  "define",
  "degree",
  "delay",
  "deliver",
  "demand",
  "deny",
  "depend",
  "depict",
  "depth",
  "deputy",
  "derive",
  "desert",
  "deserve",
  "design",
  "desire",
  "desk",
  "despite",
  "destroy",
  "detail",
  "detect",
  "develop",
  "device",
  "devote",
  "die",
  "diet",
  "differ",
  "dig",
  "digital",
  "dining",
  "dinner",
  "direct",
  "dirt",
  "dirty",
  "discuss",
  "disease",
  "dish",
  "dismiss",
  "display",
  "dispute",
  "distant",
  "diverse",
  "divide",
  "divorce",
  "dna",
  "do",
  "doctor",
  "dog",
  "door",
  "double",
  "doubt",
  "down",
  "dozen",
  "draft",
  "drag",
  "drama",
  "draw",
  "drawing",
  "dream",
  "dress",
  "drink",
  "drive",
  "driver",
  "drop",
  "drug",
  "dry",
  "due",
  "during",
  "dust",
  "duty",
  "each",
  "eager",
  "ear",
  "early",
  "earn",
  "earth",
  "ease",
  "easily",
  "east",
  "eastern",
  "easy",
  "eat",
  "economy",
  "edge",
  "edition",
  "editor",
  "educate",
  "effect",
  "effort",
  "egg",
  "eight",
  "either",
  "elderly",
  "elect",
  "element",
  "elite",
  "else",
  "email",
  "embrace",
  "emerge",
  "emotion",
  "employ",
  "empty",
  "enable",
  "end",
  "enemy",
  "energy",
  "engage",
  "engine",
  "english",
  "enhance",
  "enjoy",
  "enough",
  "ensure",
  "enter",
  "entire",
  "entry",
  "episode",
  "equal",
  "equally",
  "era",
  "error",
  "escape",
  "essay",
  "estate",
  "etc",
  "ethics",
  "ethnic",
  "even",
  "evening",
  "event",
  "ever",
  "every",
  "evolve",
  "exact",
  "exactly",
  "examine",
  "example",
  "exceed",
  "except",
  "exhibit",
  "exist",
  "expand",
  "expect",
  "expense",
  "expert",
  "explain",
  "explode",
  "explore",
  "expose",
  "express",
  "extend",
  "extent",
  "extra",
  "extreme",
  "eye",
  "fabric",
  "face",
  "fact",
  "factor",
  "factory",
  "faculty",
  "fade",
  "fail",
  "failure",
  "fair",
  "fairly",
  "faith",
  "fall",
  "false",
  "family",
  "famous",
  "fan",
  "fantasy",
  "far",
  "farm",
  "farmer",
  "fashion",
  "fast",
  "fat",
  "fate",
  "father",
  "fault",
  "favor",
  "fear",
  "feature",
  "federal",
  "fee",
  "feed",
  "feel",
  "feeling",
  "fellow",
  "female",
  "fence",
  "few",
  "fewer",
  "fiber",
  "fiction",
  "field",
  "fifteen",
  "fifth",
  "fifty",
  "fight",
  "fighter",
  "figure",
  "file",
  "fill",
  "film",
  "final",
  "finally",
  "finance",
  "find",
  "finding",
  "fine",
  "finger",
  "finish",
  "fire",
  "firm",
  "first",
  "fish",
  "fishing",
  "fit",
  "fitness",
  "five",
  "fix",
  "flag",
  "flame",
  "flat",
  "flavor",
  "flee",
  "flesh",
  "flight",
  "float",
  "floor",
  "flow",
  "flower",
  "fly",
  "focus",
  "folk",
  "follow",
  "food",
  "foot",
  "for",
  "force",
  "foreign",
  "forest",
  "forever",
  "forget",
  "form",
  "formal",
  "former",
  "formula",
  "forth",
  "fortune",
  "forward",
  "found",
  "founder",
  "four",
  "fourth",
  "frame",
  "free",
  "freedom",
  "freeze",
  "french",
  "fresh",
  "friend",
  "from",
  "front",
  "fruit",
  "fuel",
  "full",
  "fully",
  "fun",
  "fund",
  "funding",
  "funeral",
  "funny",
  "future",
  "gain",
  "galaxy",
  "gallery",
  "game",
  "gang",
  "gap",
  "garage",
  "garden",
  "garlic",
  "gas",
  "gate",
  "gather",
  "gay",
  "gaze",
  "gear",
  "gender",
  "gene",
  "general",
  "genetic",
  "gently",
  "german",
  "gesture",
  "get",
  "ghost",
  "giant",
  "gift",
  "gifted",
  "girl",
  "give",
  "given",
  "glad",
  "glance",
  "glass",
  "global",
  "glove",
  "go",
  "goal",
  "god",
  "gold",
  "golden",
  "golf",
  "good",
  "grab",
  "grade",
  "grain",
  "grand",
  "grant",
  "grass",
  "grave",
  "gray",
  "great",
  "green",
  "grocery",
  "ground",
  "group",
  "grow",
  "growing",
  "growth",
  "guard",
  "guess",
  "guest",
  "guide",
  "guilty",
  "gun",
  "guy",
  "habit",
  "habitat",
  "hair",
  "half",
  "hall",
  "hand",
  "handful",
  "handle",
  "hang",
  "happen",
  "happy",
  "hard",
  "hardly",
  "hat",
  "hate",
  "have",
  "he",
  "head",
  "health",
  "healthy",
  "hear",
  "hearing",
  "heart",
  "heat",
  "heaven",
  "heavily",
  "heavy",
  "heel",
  "height",
  "hell",
  "hello",
  "help",
  "helpful",
  "her",
  "here",
  "hero",
  "herself",
  "hey",
  "hi",
  "hide",
  "high",
  "highly",
  "highway",
  "hill",
  "him",
  "himself",
  "hip",
  "hire",
  "his",
  "history",
  "hit",
  "hold",
  "hole",
  "holiday",
  "holy",
  "home",
  "honest",
  "honey",
  "honor",
  "hope",
  "horizon",
  "horror",
  "horse",
  "host",
  "hot",
  "hotel",
  "hour",
  "house",
  "housing",
  "how",
  "however",
  "huge",
  "human",
  "humor",
  "hundred",
  "hungry",
  "hunter",
  "hunting",
  "hurt",
  "husband",
  "i",
  "ice",
  "idea",
  "ideal",
  "ie",
  "if",
  "ignore",
  "ill",
  "illegal",
  "illness",
  "image",
  "imagine",
  "impact",
  "imply",
  "impose",
  "impress",
  "improve",
  "in",
  "include",
  "income",
  "indeed",
  "index",
  "indian",
  "infant",
  "inform",
  "initial",
  "injury",
  "inner",
  "inquiry",
  "inside",
  "insight",
  "insist",
  "inspire",
  "install",
  "instead",
  "intend",
  "intense",
  "into",
  "invest",
  "invite",
  "involve",
  "iraqi",
  "irish",
  "iron",
  "islamic",
  "island",
  "israeli",
  "issue",
  "it",
  "italian",
  "item",
  "its",
  "itself",
  "jacket",
  "jail",
  "jet",
  "jew",
  "jewish",
  "job",
  "join",
  "joint",
  "joke",
  "journal",
  "journey",
  "joy",
  "judge",
  "juice",
  "jump",
  "junior",
  "jury",
  "just",
  "justice",
  "justify",
  "keep",
  "key",
  "kick",
  "kid",
  "kill",
  "killer",
  "killing",
  "kind",
  "king",
  "kiss",
  "kitchen",
  "knee",
  "knife",
  "knock",
  "know",
  "lab",
  "label",
  "labor",
  "lack",
  "lady",
  "lake",
  "land",
  "lap",
  "large",
  "largely",
  "last",
  "late",
  "later",
  "latin",
  "latter",
  "laugh",
  "launch",
  "law",
  "lawn",
  "lawsuit",
  "lawyer",
  "lay",
  "layer",
  "lead",
  "leader",
  "leading",
  "leaf",
  "league",
  "lean",
  "learn",
  "least",
  "leather",
  "leave",
  "left",
  "leg",
  "legacy",
  "legal",
  "legend",
  "lemon",
  "length",
  "less",
  "lesson",
  "let",
  "letter",
  "level",
  "liberal",
  "library",
  "license",
  "lie",
  "life",
  "lift",
  "light",
  "like",
  "likely",
  "limit",
  "limited",
  "line",
  "link",
  "lip",
  "list",
  "listen",
  "little",
  "live",
  "living",
  "load",
  "loan",
  "local",
  "locate",
  "lock",
  "long",
  "look",
  "loose",
  "lose",
  "loss",
  "lost",
  "lot",
  "lots",
  "loud",
  "love",
  "lovely",
  "lover",
  "low",
  "lower",
  "luck",
  "lucky",
  "lunch",
  "lung",
  "machine",
  "mad",
  "mail",
  "main",
  "mainly",
  "major",
  "make",
  "maker",
  "makeup",
  "male",
  "mall",
  "man",
  "manage",
  "manager",
  "manner",
  "many",
  "map",
  "margin",
  "mark",
  "market",
  "married",
  "marry",
  "mask",
  "mass",
  "massive",
  "master",
  "match",
  "math",
  "matter",
  "may",
  "maybe",
  "mayor",
  "me",
  "meal",
  "mean",
  "meaning",
  "measure",
  "meat",
  "media",
  "medical",
  "medium",
  "meet",
  "meeting",
  "member",
  "memory",
  "mental",
  "mention",
  "menu",
  "mere",
  "merely",
  "mess",
  "message",
  "metal",
  "meter",
  "method",
  "mexican",
  "middle",
  "might",
  "milk",
  "million",
  "mind",
  "mine",
  "minor",
  "minute",
  "miracle",
  "mirror",
  "miss",
  "missile",
  "mission",
  "mistake",
  "mix",
  "mixture",
  "mmhmm",
  "mode",
  "model",
  "modern",
  "modest",
  "mom",
  "moment",
  "money",
  "monitor",
  "month",
  "mood",
  "moon",
  "moral",
  "more",
  "morning",
  "most",
  "mostly",
  "mother",
  "motion",
  "motor",
  "mount",
  "mouse",
  "mouth",
  "move",
  "movie",
  "mr",
  "mrs",
  "ms",
  "much",
  "murder",
  "muscle",
  "museum",
  "music",
  "musical",
  "muslim",
  "must",
  "mutual",
  "my",
  "myself",
  "mystery",
  "myth",
  "naked",
  "name",
  "narrow",
  "nation",
  "native",
  "natural",
  "nature",
  "near",
  "nearby",
  "nearly",
  "neck",
  "need",
  "neither",
  "nerve",
  "nervous",
  "net",
  "network",
  "never",
  "new",
  "newly",
  "news",
  "next",
  "nice",
  "night",
  "nine",
  "no",
  "nobody",
  "nod",
  "noise",
  "none",
  "nor",
  "normal",
  "north",
  "nose",
  "not",
  "note",
  "nothing",
  "notice",
  "notion",
  "novel",
  "now",
  "nowhere",
  "nt",
  "nuclear",
  "number",
  "nurse",
  "nut",
  "object",
  "observe",
  "obtain",
  "obvious",
  "occupy",
  "occur",
  "ocean",
  "odd",
  "odds",
  "of",
  "off",
  "offense",
  "offer",
  "office",
  "officer",
  "often",
  "oh",
  "oil",
  "ok",
  "okay",
  "old",
  "olympic",
  "on",
  "once",
  "one",
  "ongoing",
  "onion",
  "online",
  "only",
  "onto",
  "open",
  "opening",
  "operate",
  "opinion",
  "oppose",
  "option",
  "or",
  "orange",
  "order",
  "organic",
  "origin",
  "other",
  "others",
  "ought",
  "our",
  "out",
  "outcome",
  "outside",
  "oven",
  "over",
  "overall",
  "owe",
  "own",
  "owner",
  "pace",
  "pack",
  "package",
  "page",
  "pain",
  "painful",
  "paint",
  "painter",
  "pair",
  "pale",
  "palm",
  "pan",
  "panel",
  "pant",
  "paper",
  "parent",
  "park",
  "parking",
  "part",
  "partly",
  "partner",
  "party",
  "pass",
  "passage",
  "passion",
  "past",
  "patch",
  "path",
  "patient",
  "pattern",
  "pause",
  "pay",
  "payment",
  "pc",
  "peace",
  "peak",
  "peer",
  "penalty",
  "people",
  "pepper",
  "per",
  "perfect",
  "perform",
  "perhaps",
  "period",
  "permit",
  "person",
  "pet",
  "phase",
  "phone",
  "photo",
  "phrase",
  "piano",
  "pick",
  "picture",
  "pie",
  "piece",
  "pile",
  "pilot",
  "pine",
  "pink",
  "pipe",
  "pitch",
  "place",
  "plan",
  "plane",
  "planet",
  "plant",
  "plastic",
  "plate",
  "play",
  "player",
  "please",
  "plenty",
  "plot",
  "plus",
  "pm",
  "pocket",
  "poem",
  "poet",
  "poetry",
  "point",
  "pole",
  "police",
  "policy",
  "poll",
  "pool",
  "poor",
  "pop",
  "popular",
  "porch",
  "port",
  "portion",
  "portray",
  "pose",
  "possess",
  "post",
  "pot",
  "potato",
  "pound",
  "pour",
  "poverty",
  "powder",
  "power",
  "pray",
  "prayer",
  "predict",
  "prefer",
  "prepare",
  "present",
  "press",
  "pretend",
  "pretty",
  "prevent",
  "price",
  "pride",
  "priest",
  "primary",
  "prime",
  "print",
  "prior",
  "prison",
  "privacy",
  "private",
  "problem",
  "proceed",
  "process",
  "produce",
  "product",
  "profile",
  "profit",
  "program",
  "project",
  "promise",
  "promote",
  "prompt",
  "proof",
  "proper",
  "propose",
  "protect",
  "protein",
  "protest",
  "proud",
  "prove",
  "provide",
  "public",
  "publish",
  "pull",
  "pure",
  "purpose",
  "pursue",
  "push",
  "put",
  "qualify",
  "quality",
  "quarter",
  "quick",
  "quickly",
  "quiet",
  "quietly",
  "quit",
  "quite",
  "quote",
  "race",
  "racial",
  "radical",
  "radio",
  "rail",
  "rain",
  "raise",
  "range",
  "rank",
  "rapid",
  "rapidly",
  "rare",
  "rarely",
  "rate",
  "rather",
  "rating",
  "ratio",
  "raw",
  "reach",
  "react",
  "read",
  "reader",
  "reading",
  "ready",
  "real",
  "reality",
  "realize",
  "really",
  "reason",
  "recall",
  "receive",
  "recent",
  "recipe",
  "record",
  "recover",
  "recruit",
  "red",
  "reduce",
  "refer",
  "reflect",
  "reform",
  "refugee",
  "refuse",
  "regard",
  "regime",
  "region",
  "regular",
  "reject",
  "relate",
  "relax",
  "release",
  "relief",
  "rely",
  "remain",
  "remind",
  "remote",
  "remove",
  "repeat",
  "replace",
  "reply",
  "report",
  "request",
  "require",
  "resist",
  "resolve",
  "resort",
  "respect",
  "respond",
  "rest",
  "restore",
  "result",
  "retain",
  "retire",
  "return",
  "reveal",
  "revenue",
  "review",
  "rhythm",
  "rice",
  "rich",
  "rid",
  "ride",
  "rifle",
  "right",
  "ring",
  "rise",
  "risk",
  "river",
  "road",
  "rock",
  "role",
  "roll",
  "roof",
  "room",
  "root",
  "rope",
  "rose",
  "rough",
  "roughly",
  "round",
  "route",
  "routine",
  "row",
  "rub",
  "rule",
  "run",
  "running",
  "rural",
  "rush",
  "russian",
  "sacred",
  "sad",
  "safe",
  "safety",
  "sake",
  "salad",
  "salary",
  "sale",
  "sales",
  "salt",
  "same",
  "sample",
  "sand",
  "satisfy",
  "sauce",
  "save",
  "saving",
  "say",
  "scale",
  "scandal",
  "scared",
  "scene",
  "scheme",
  "scholar",
  "school",
  "science",
  "scope",
  "score",
  "scream",
  "screen",
  "script",
  "sea",
  "search",
  "season",
  "seat",
  "second",
  "secret",
  "section",
  "sector",
  "secure",
  "see",
  "seed",
  "seek",
  "seem",
  "segment",
  "seize",
  "select",
  "self",
  "sell",
  "senate",
  "senator",
  "send",
  "senior",
  "sense",
  "series",
  "serious",
  "serve",
  "service",
  "session",
  "set",
  "setting",
  "settle",
  "seven",
  "several",
  "severe",
  "sex",
  "sexual",
  "shade",
  "shadow",
  "shake",
  "shall",
  "shape",
  "share",
  "sharp",
  "she",
  "sheet",
  "shelf",
  "shell",
  "shelter",
  "shift",
  "shine",
  "ship",
  "shirt",
  "shit",
  "shock",
  "shoe",
  "shoot",
  "shop",
  "shore",
  "short",
  "shortly",
  "shot",
  "should",
  "shout",
  "show",
  "shower",
  "shrug",
  "shut",
  "sick",
  "side",
  "sigh",
  "sight",
  "sign",
  "signal",
  "silence",
  "silent",
  "silver",
  "similar",
  "simple",
  "simply",
  "sin",
  "since",
  "sing",
  "singer",
  "single",
  "sink",
  "sir",
  "sister",
  "sit",
  "site",
  "six",
  "size",
  "ski",
  "skill",
  "skin",
  "sky",
  "slave",
  "sleep",
  "slice",
  "slide",
  "slight",
  "slip",
  "slow",
  "slowly",
  "small",
  "smart",
  "smell",
  "smile",
  "smoke",
  "smooth",
  "snap",
  "snow",
  "so",
  "soccer",
  "social",
  "society",
  "soft",
  "soil",
  "solar",
  "soldier",
  "solid",
  "solve",
  "some",
  "somehow",
  "someone",
  "son",
  "song",
  "soon",
  "sorry",
  "sort",
  "soul",
  "sound",
  "soup",
  "source",
  "south",
  "soviet",
  "space",
  "spanish",
  "speak",
  "speaker",
  "special",
  "species",
  "speech",
  "speed",
  "spend",
  "spin",
  "spirit",
  "split",
  "sport",
  "spot",
  "spread",
  "spring",
  "square",
  "squeeze",
  "stable",
  "staff",
  "stage",
  "stair",
  "stake",
  "stand",
  "star",
  "stare",
  "start",
  "state",
  "station",
  "status",
  "stay",
  "steady",
  "steal",
  "steel",
  "step",
  "stick",
  "still",
  "stir",
  "stock",
  "stomach",
  "stone",
  "stop",
  "storage",
  "store",
  "storm",
  "story",
  "strange",
  "stream",
  "street",
  "stress",
  "stretch",
  "strike",
  "string",
  "strip",
  "stroke",
  "strong",
  "student",
  "studio",
  "study",
  "stuff",
  "stupid",
  "style",
  "subject",
  "submit",
  "succeed",
  "success",
  "such",
  "sudden",
  "sue",
  "suffer",
  "sugar",
  "suggest",
  "suicide",
  "suit",
  "summer",
  "summit",
  "sun",
  "super",
  "supply",
  "support",
  "suppose",
  "supreme",
  "sure",
  "surely",
  "surface",
  "surgery",
  "survey",
  "survive",
  "suspect",
  "sustain",
  "swear",
  "sweep",
  "sweet",
  "swim",
  "swing",
  "switch",
  "symbol",
  "symptom",
  "system",
  "table",
  "tactic",
  "tail",
  "take",
  "tale",
  "talent",
  "talk",
  "tall",
  "tank",
  "tap",
  "tape",
  "target",
  "task",
  "taste",
  "tax",
  "tea",
  "teach",
  "teacher",
  "team",
  "tear",
  "teen",
  "tell",
  "ten",
  "tend",
  "tennis",
  "tension",
  "tent",
  "term",
  "terms",
  "terror",
  "test",
  "testify",
  "testing",
  "text",
  "than",
  "thank",
  "thanks",
  "that",
  "the",
  "theater",
  "their",
  "them",
  "theme",
  "then",
  "theory",
  "therapy",
  "there",
  "these",
  "they",
  "thick",
  "thin",
  "thing",
  "think",
  "third",
  "thirty",
  "this",
  "those",
  "though",
  "thought",
  "threat",
  "three",
  "throat",
  "through",
  "throw",
  "thus",
  "ticket",
  "tie",
  "tight",
  "time",
  "tiny",
  "tip",
  "tire",
  "tired",
  "tissue",
  "title",
  "to",
  "tobacco",
  "today",
  "toe",
  "tomato",
  "tone",
  "tongue",
  "tonight",
  "too",
  "tool",
  "tooth",
  "top",
  "topic",
  "toss",
  "total",
  "totally",
  "touch",
  "tough",
  "tour",
  "tourist",
  "toward",
  "towards",
  "tower",
  "town",
  "toy",
  "trace",
  "track",
  "trade",
  "traffic",
  "tragedy",
  "trail",
  "train",
  "travel",
  "treat",
  "treaty",
  "tree",
  "trend",
  "trial",
  "tribe",
  "trick",
  "trip",
  "troop",
  "trouble",
  "truck",
  "true",
  "truly",
  "trust",
  "truth",
  "try",
  "tube",
  "tunnel",
  "turn",
  "tv",
  "twelve",
  "twenty",
  "twice",
  "twin",
  "two",
  "type",
  "typical",
  "ugly",
  "unable",
  "uncle",
  "under",
  "undergo",
  "uniform",
  "union",
  "unique",
  "unit",
  "united",
  "unknown",
  "unless",
  "unlike",
  "until",
  "unusual",
  "up",
  "upon",
  "upper",
  "urban",
  "urge",
  "us",
  "use",
  "used",
  "useful",
  "user",
  "usual",
  "usually",
  "utility",
  "valley",
  "value",
  "variety",
  "various",
  "vary",
  "vast",
  "vehicle",
  "venture",
  "version",
  "versus",
  "very",
  "vessel",
  "veteran",
  "via",
  "victim",
  "victory",
  "video",
  "view",
  "viewer",
  "village",
  "violate",
  "violent",
  "virtue",
  "virus",
  "visible",
  "vision",
  "visit",
  "visitor",
  "visual",
  "vital",
  "voice",
  "volume",
  "vote",
  "voter",
  "vs",
  "wage",
  "wait",
  "wake",
  "walk",
  "wall",
  "wander",
  "want",
  "war",
  "warm",
  "warn",
  "warning",
  "wash",
  "waste",
  "watch",
  "water",
  "wave",
  "way",
  "we",
  "weak",
  "wealth",
  "wealthy",
  "weapon",
  "wear",
  "weather",
  "wedding",
  "week",
  "weekend",
  "weekly",
  "weigh",
  "weight",
  "welcome",
  "welfare",
  "well",
  "west",
  "western",
  "wet",
  "what",
  "wheel",
  "when",
  "where",
  "whereas",
  "whether",
  "which",
  "while",
  "whisper",
  "white",
  "who",
  "whole",
  "whom",
  "whose",
  "why",
  "wide",
  "widely",
  "wife",
  "wild",
  "will",
  "willing",
  "win",
  "wind",
  "window",
  "wine",
  "wing",
  "winner",
  "winter",
  "wipe",
  "wire",
  "wisdom",
  "wise",
  "wish",
  "with",
  "within",
  "without",
  "witness",
  "woman",
  "wonder",
  "wood",
  "wooden",
  "word",
  "work",
  "worker",
  "working",
  "works",
  "world",
  "worried",
  "worry",
  "worth",
  "would",
  "wound",
  "wrap",
  "write",
  "writer",
  "writing",
  "wrong",
  "yard",
  "yeah",
  "year",
  "yell",
  "yellow",
  "yes",
  "yet",
  "yield",
  "you",
  "young",
  "your",
  "yours",
  "youth",
  "zone",
];
interface LeaderboardEntry {
  id: number;
  name: string;
  score: number;
  date: string;
}

const ITEMS_PER_PAGE = 10;

const ShootingStar: React.FC = () => {
  const style = {
    left: `${Math.random() * 100}%`,
    top: `${Math.random() * 100}%`,
    animationDelay: `${Math.random() * 5}s`,
  };

  return (
    <div
      className="absolute w-0.5 h-0.5 bg-white rounded-full animate-shoot"
      style={style}
    >
      <div className="absolute top-1/2 -translate-y-1/2 w-12 h-px bg-gradient-to-r from-white to-transparent"></div>
    </div>
  );
};

const TypingTest: React.FC = () => {
  const [isTyping, setIsTyping] = useState(false);
  const [wordList, setWordList] = useState<string[]>([]);
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const textContainerRef = useRef<HTMLDivElement>(null);
  const [userInput, setUserInput] = useState("");
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(30);
  const [typingData, setTypingData] = useState<
    {
      time: number;
      rawSpeed: number;
      mistakes: number;
      wpm: number;
    }[]
  >([]);
  const [totalMistakes, setTotalMistakes] = useState(0);
  const [globalLeaderboard, setGlobalLeaderboard] = useState<
    LeaderboardEntry[]
  >([]);
  const [personalLeaderboard, setPersonalLeaderboard] = useState<
    LeaderboardEntry[]
  >([]);
  const [playerName, setPlayerName] = useState("");
  const [typedWords, setTypedWords] = useState<string[]>([]);
  const textAreaRef = useRef<HTMLTextAreaElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const caretRef = useRef<HTMLDivElement>(null);
  const [showHome, setShowHome] = useState(true);

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

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const calculateWPM = useCallback(() => {
    return score * 2;
  }, [score]);

  useEffect(() => {
    if (timeLeft === 0) {
      setIsTyping(false);
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      updateLeaderboard();
    }
  }, [timeLeft, calculateWPM]);

  useEffect(() => {
    if (wordList.length - currentWordIndex <= 20) {
      setWordList((prevList) => [...prevList, ...generateWordList()]);
    }
  }, [currentWordIndex, wordList, generateWordList]);

  useEffect(() => {
    fetchLeaderboard();
    loadPersonalLeaderboard();
  }, []);

  const startTyping = () => {
    setIsTyping(true);
    setShowHome(false);
    setScore(0);
    setTimeLeft(30);
    setWordList(generateWordList());
    setCurrentWordIndex(0);
    setUserInput("");
    setTypingData([]);
    setTypedWords([]);
    setTotalMistakes(0);
    if (textAreaRef.current) textAreaRef.current.focus();
    startTimer();
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const inputValue = e.target.value;
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

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
    }
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
      ? "text-gray-500"
      : isCurrentWord
      ? "text-white"
      : "text-gray-700";

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

  const updateLeaderboard = async () => {
    const newEntry: Omit<LeaderboardEntry, "id" | "date"> = {
      name: playerName || "Anonymous",
      score: calculateWPM(),
    };

    try {
      const response = await fetch("/api/leaderboard", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newEntry),
      });

      if (response.ok) {
        const updatedEntry = await response.json();
        fetchLeaderboard();
        updatePersonalLeaderboard(updatedEntry);
      }
    } catch (error) {
      console.error("Error updating leaderboard:", error);
    }
  };

  const fetchLeaderboard = async () => {
    try {
      const response = await fetch("/api/leaderboard");
      if (response.ok) {
        const data = await response.json();
        setGlobalLeaderboard(data);
      }
    } catch (error) {
      console.error("Error fetching leaderboard:", error);
    }
  };

  const updatePersonalLeaderboard = (
    entry: Omit<LeaderboardEntry, "id" | "date">
  ) => {
    const newEntry: LeaderboardEntry = {
      ...entry,
      id: Date.now(),
      date: new Date().toISOString(),
    };
    const updatedLeaderboard = [...personalLeaderboard, newEntry]
      .sort((a, b) => b.score - a.score)
      .slice(0, 10);
    setPersonalLeaderboard(updatedLeaderboard);
    Cookies.set("personalLeaderboard", JSON.stringify(updatedLeaderboard), {
      expires: 365,
    });
  };

  const loadPersonalLeaderboard = () => {
    const savedLeaderboard = Cookies.get("personalLeaderboard");
    if (savedLeaderboard) {
      setPersonalLeaderboard(JSON.parse(savedLeaderboard));
    }
  };

  const renderLeaderboard = (
    leaderboard: LeaderboardEntry[],
    title: string,
    isGlobal: boolean
  ) => {
    const paginatedLeaderboard = leaderboard.slice(
      (currentPage - 1) * ITEMS_PER_PAGE,
      currentPage * ITEMS_PER_PAGE
    );
    const totalPages = Math.ceil(leaderboard.length / ITEMS_PER_PAGE);

    return (
      <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
        <h2 className="text-2xl font-bold mb-4">{title}</h2>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Rank</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>WPM</TableHead>
              {!isGlobal && <TableHead>Date</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedLeaderboard.map((entry, index) => (
              <TableRow key={entry.id}>
                <TableCell>
                  {(currentPage - 1) * ITEMS_PER_PAGE + index + 1}
                </TableCell>
                <TableCell>{entry.name}</TableCell>
                <TableCell>{entry.score}</TableCell>
                {!isGlobal && (
                  <TableCell>
                    {new Date(entry.date).toLocaleDateString()}
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <Pagination className="mt-4">
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              />
            </PaginationItem>
            {[...Array(totalPages)].map((_, i) => (
              <PaginationItem key={i}>
                <PaginationLink
                  onClick={() => setCurrentPage(i + 1)}
                  isActive={currentPage === i + 1}
                >
                  {i + 1}
                </PaginationLink>
              </PaginationItem>
            ))}
            <PaginationItem>
              <PaginationNext
                onClick={() =>
                  setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                }
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col p-8 relative overflow-hidden">
      {[...Array(20)].map((_, i) => (
        <ShootingStar key={i} />
      ))}
      <div className="flex justify-between items-start mb-8 z-20">
        <Button
          onClick={() => setShowHome(true)}
          className="bg-blue-600 hover:bg-blue-700 transition duration-300"
        >
          <Home className="mr-2 h-4 w-4" /> Home
        </Button>
        <h1 className="text-5xl font-bold text-center">naskotype</h1>
        <div className="w-24"></div> {/* Spacer for alignment */}
      </div>
      <div className="flex-grow flex justify-between items-start z-10">
        <div className="w-1/4 overflow-y-auto max-h-[calc(100vh-12rem)]">
          {renderLeaderboard(globalLeaderboard, "Global Leaderboard", true)}
        </div>
        <div className="flex-grow flex flex-col items-center justify-center px-8">
          {showHome ? (
            <div className="flex flex-col items-center gap-4 w-full max-w-3xl">
              <Input
                type="text"
                placeholder="Enter your name"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                className="bg-gray-800 text-white p-2 rounded w-full"
              />
              <Button
                onClick={startTyping}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg text-xl transition duration-300 ease-in-out transform hover:scale-105 w-full"
              >
                Start 30-Second Typing Test
              </Button>
            </div>
          ) : isTyping ? (
            <div className="flex flex-col items-center gap-6 w-full max-w-3xl">
              <div className="relative bg-gray-800 p-6 rounded-lg w-full h-48 overflow-hidden shadow-lg">
                <div
                  ref={textContainerRef}
                  className="absolute top-0 left-0 right-0 bottom-0 p-6 text-2xl leading-relaxed overflow-y-auto"
                >
                  {wordList.map((word, index) => renderWord(word, index))}
                </div>
                <div
                  ref={caretRef}
                  className="absolute w-0.5 h-6 bg-white animate-blink"
                  style={{ transition: "left 0.1s, top 0.1s" }}
                ></div>
                <textarea
                  ref={textAreaRef}
                  value={userInput}
                  onChange={handleInputChange}
                  onKeyDown={handleKeyDown}
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
                  Score:{" "}
                  <span className="font-bold text-green-400">{score}</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="mt-8 w-full max-w-3xl">
              <Alert
                variant="default"
                className="mb-6 bg-blue-900 border-blue-700"
              >
                <AlertCircle className="h-5 w-5 text-blue-400" />
                <AlertTitle className="text-xl font-bold">Times up!</AlertTitle>
                <AlertDescription className="text-lg">
                  Final score:{" "}
                  <span className="font-bold text-green-400">{score}</span>{" "}
                  words
                  <br />
                  WPM:{" "}
                  <span className="font-bold text-blue-400">
                    {calculateWPM()}
                  </span>
                  <br />
                  Total mistakes:{" "}
                  <span className="font-bold text-red-400">
                    {totalMistakes}
                  </span>
                  <br />
                  Max speed:{" "}
                  <span className="font-bold text-purple-400">
                    {Math.max(...typingData.map((data) => data.wpm), 0)}
                  </span>{" "}
                  WPM
                </AlertDescription>
              </Alert>
              <div className="h-64 bg-gray-800 p-4 rounded-lg shadow-lg mb-8">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={typingData}>
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
                      yAxisId="left"
                      stroke="#888"
                      label={{
                        value: "Speed",
                        angle: -90,
                        position: "insideLeft",
                        fill: "#888",
                      }}
                    />
                    <YAxis
                      yAxisId="right"
                      orientation="right"
                      stroke="#888"
                      label={{
                        value: "Mistakes",
                        angle: 90,
                        position: "insideRight",
                        fill: "#888",
                      }}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#1f2937",
                        border: "none",
                      }}
                    />
                    <Legend />
                    <Line
                      yAxisId="left"
                      type="monotone"
                      dataKey="rawSpeed"
                      name="Raw Speed (CPM)"
                      stroke="#8884d8"
                      strokeWidth={2}
                      dot={false}
                    />
                    <Line
                      yAxisId="left"
                      type="monotone"
                      dataKey="wpm"
                      name="WPM"
                      stroke="#82ca9d"
                      strokeWidth={2}
                      dot={false}
                    />
                    <Line
                      yAxisId="right"
                      type="monotone"
                      dataKey="mistakes"
                      name="Mistakes"
                      stroke="#ffc658"
                      strokeWidth={2}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <Button
                onClick={startTyping}
                className="mt-8 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg text-xl transition duration-300 ease-in-out transform hover:scale-105 w-full"
              >
                Try Again
              </Button>
            </div>
          )}
        </div>
        <div className="w-1/4 overflow-y-auto max-h-[calc(100vh-12rem)]">
          {renderLeaderboard(
            personalLeaderboard,
            "Personal Leaderboard",
            false
          )}
        </div>
      </div>
    </div>
  );
};

export default TypingTest;
