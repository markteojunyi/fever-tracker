// ============================================
// FILE: app/api/reminders/route.ts
// GET reminders, POST generate reminders
// ============================================

import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import MedicationReminder from "@/lib/models/MedicationReminder";
import MedicationDefinition from "@/lib/models/MedicationDefinition";

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    const childId = request.nextUrl.searchParams.get("childId");
    const isCompleted = request.nextUrl.searchParams.get("isCompleted");

    const query: any = {};
    if (childId) query.childId = childId;
    if (isCompleted === "true") query.isCompleted = true;
    if (isCompleted === "false") query.isCompleted = false;

    const reminders = await MedicationReminder.find(query).sort({
      scheduledTime: 1,
    });
    return NextResponse.json(reminders);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch reminders" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const body = await request.json();

    // Get medication definition
    const med = await MedicationDefinition.findById(
      body.medicationDefinitionId
    );
    if (!med) {
      return NextResponse.json(
        { error: "Medication not found" },
        { status: 404 }
      );
    }

    // Generate reminders
    const reminders = [];
    const startDate = new Date(med.startDate);
    const endDate = med.endDate
      ? new Date(med.endDate)
      : new Date(startDate.getTime() + 30 * 24 * 60 * 60 * 1000);

    let currentTime = new Date(startDate);
    while (currentTime <= endDate) {
      reminders.push({
        medicationDefinitionId: med._id,
        childId: med.childId,
        scheduledTime: new Date(currentTime),
        isCompleted: false,
      });

      currentTime = new Date(
        currentTime.getTime() + med.frequency * 60 * 60 * 1000
      );
    }

    await MedicationReminder.insertMany(reminders);
    return NextResponse.json(
      { success: true, count: reminders.length },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to generate reminders" },
      { status: 500 }
    );
  }
}
