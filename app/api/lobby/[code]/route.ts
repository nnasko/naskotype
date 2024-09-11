// app/api/lobby/[code]/route.ts
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import jwt from "jsonwebtoken";

interface Participant {
  id: number;
  user: {
    username: string;
  };
  isReady: boolean;
}

export async function GET(
  request: Request,
  { params }: { params: { code: string } }
) {
  const { code } = params;
  const authorization = request.headers.get("authorization");

  if (!authorization || !authorization.startsWith("Bearer ")) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const token = authorization.split(" ")[1];

  try {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
      userId: number;
    };

    const lobby = await prisma.lobby.findUnique({
      where: { code },
      include: { participants: { include: { user: true } } },
    });

    if (!lobby) {
      return NextResponse.json({ message: "Lobby not found" }, { status: 404 });
    }

    return NextResponse.json({
      code: lobby.code,
      participants: lobby.participants.map((p: Participant) => ({
        id: p.id,
        username: p.user.username,
        isReady: p.isReady,
      })),
    });
  } catch (error) {
    return NextResponse.json(
      { message: "Error processing request" },
      { status: 400 }
    );
  }
}
