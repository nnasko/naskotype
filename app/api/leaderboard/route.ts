// app/api/leaderboard/route.ts
import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET() {
  try {
    const leaderboard = await prisma.leaderboardEntry.findMany({
      orderBy: {
        score: "desc",
      },
      take: 10,
    });
    return NextResponse.json(leaderboard);
  } catch (error) {
    return NextResponse.json(
      { error: "Error fetching leaderboard" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const { name, score } = await request.json();

    // Check if the user already has an entry
    const existingEntry = await prisma.leaderboardEntry.findFirst({
      where: { name },
    });

    if (existingEntry) {
      // If the new score is higher, update the entry
      if (score > existingEntry.score) {
        const updatedEntry = await prisma.leaderboardEntry.update({
          where: { id: existingEntry.id },
          data: { score, date: new Date() },
        });
        return NextResponse.json(updatedEntry, { status: 200 });
      } else {
        // If the new score is not higher, don't update
        return NextResponse.json(existingEntry, { status: 200 });
      }
    } else {
      // If no existing entry, create a new one
      const newEntry = await prisma.leaderboardEntry.create({
        data: {
          name,
          score,
          date: new Date(),
        },
      });
      return NextResponse.json(newEntry, { status: 201 });
    }
  } catch (error) {
    return NextResponse.json(
      { error: "Error updating leaderboard entry" },
      { status: 500 }
    );
  }
}
