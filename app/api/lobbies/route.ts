import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET() {
  try {
    const lobbies = await prisma.lobby.findMany({
      where: {
        participants: {
          some: {},
        },
        isPublic: true, // Only fetch public lobbies
      },
      include: {
        participants: {
          include: {
            user: true,
          },
        },
      },
    });

    const activeLobbies = lobbies.map((lobby) => ({
      id: lobby.id,
      code: lobby.code,
      name: lobby.name, // Include the lobby name
      players: lobby.participants.length,
      isPublic: lobby.isPublic,
      creatorName: lobby.participants.find((p) => p.userId === lobby.creatorId)
        ?.user.username,
    }));

    return NextResponse.json(activeLobbies);
  } catch (error) {
    console.error("Error fetching active lobbies:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
