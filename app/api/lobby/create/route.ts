import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import jwt from "jsonwebtoken";

function generateLobbyCode(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

export async function POST(request: Request) {
  const authorization = request.headers.get("authorization");
  if (!authorization || !authorization.startsWith("Bearer ")) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const token = authorization.split(" ")[1];

  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) {
    console.error("JWT_SECRET is not set in the environment variables");
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }

  try {
    const decoded = jwt.verify(token, jwtSecret) as { userId: number };
    const lobbyCode = generateLobbyCode();

    // Parse the request body
    const { name, isPublic = true } = await request.json();

    if (!name) {
      return NextResponse.json(
        { message: "Lobby name is required" },
        { status: 400 }
      );
    }

    const lobby = await prisma.lobby.create({
      data: {
        code: lobbyCode,
        name,
        isPublic,
        creatorId: decoded.userId,
        participants: {
          create: {
            userId: decoded.userId,
          },
        },
      },
    });

    return NextResponse.json({ lobbyCode: lobby.code }, { status: 201 });
  } catch (error) {
    console.error("Error creating lobby:", error);
    return NextResponse.json(
      { message: "Error creating lobby" },
      { status: 400 }
    );
  }
}
