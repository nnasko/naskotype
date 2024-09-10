import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const prisma = new PrismaClient();

export async function POST(request: Request) {
  const body = await request.json();
  const { username, password } = body;

  const user = await prisma.user.findUnique({ where: { username } });

  if (user && (await bcrypt.compare(password, user.password))) {
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      console.error("JWT_SECRET is not set in the environment variables");
      return NextResponse.json(
        { message: "Internal server error" },
        { status: 500 }
      );
    }

    try {
      const token = jwt.sign({ userId: user.id }, jwtSecret, {
        expiresIn: "1h",
      });
      return NextResponse.json({ token });
    } catch (error) {
      console.error("Error signing JWT:", error);
      return NextResponse.json(
        { message: "Error creating authentication token" },
        { status: 500 }
      );
    }
  } else {
    return NextResponse.json(
      { message: "Invalid credentials" },
      { status: 401 }
    );
  }
}
