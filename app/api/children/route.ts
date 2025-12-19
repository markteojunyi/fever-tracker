// ============================================
// FILE: app/api/children/route.ts
// GET all children, POST new child
// ============================================

import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Child from "@/lib/models/Child";

export async function GET() {
  try {
    console.log("Connecting to MongoDB...");
    await connectDB();
    console.log("Connected! Fetching children...");

    const children = await Child.find().sort({ createdAt: -1 });
    console.log("Children found:", children);

    return NextResponse.json(children);
  } catch (error) {
    console.error("Error in GET /api/children:", error);
    return NextResponse.json(
      { error: "Failed to fetch children" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const body = await request.json();

    const child = await Child.create({
      name: body.name,
      dateOfBirth: body.dateOfBirth,
      weight: body.weight,
    });

    return NextResponse.json(child, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to create child" },
      { status: 500 }
    );
  }
}
