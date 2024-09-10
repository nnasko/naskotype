import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import jwt from "jsonwebtoken";

const prisma = new PrismaClient();

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

    const lobby = await prisma.lobby.create({
      data: {
        code: lobbyCode,
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
