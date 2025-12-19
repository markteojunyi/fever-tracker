// ============================================
// FILE: app/api/temperatures/route.ts
// GET temps for a child, POST new temperature
// ============================================

import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import TemperatureReading from "@/lib/models/TemperatureReading";

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    const childId = request.nextUrl.searchParams.get("childId");

    if (!childId) {
      return NextResponse.json({ error: "childId required" }, { status: 400 });
    }

    const readings = await TemperatureReading.find({ childId }).sort({
      timestamp: 1,
    });

    return NextResponse.json(readings);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch temperatures" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const body = await request.json();

    const reading = await TemperatureReading.create({
      childId: body.childId,
      temperature: body.temperature,
      temperatureUnit: body.temperatureUnit,
      timestamp: body.timestamp,
      notes: body.notes,
    });

    return NextResponse.json(reading, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to create temperature reading" },
      { status: 500 }
    );
  }
}
