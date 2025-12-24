// ============================================
// FILE: app/api/medications/route.ts
// GET medications, POST new medication
// ============================================

import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import MedicationDefinition from "@/lib/models/MedicationDefinition";

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    const childId = request.nextUrl.searchParams.get("childId");
    const isActive = request.nextUrl.searchParams.get("isActive");

    const query: {
      childId?: string;
      isActive?: boolean;
    } = {};
    if (childId) query.childId = childId;
    if (isActive === "true") query.isActive = true;
    if (isActive === "false") query.isActive = false;

    const medications = await MedicationDefinition.find(query).sort({
      createdAt: -1,
    });
    return NextResponse.json(medications);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch medications" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const body = await request.json();

    console.log("Received medication data:", body);

    const medication = await MedicationDefinition.create({
      childId: body.childId,
      name: body.name,
      dosage: body.dosage,
      dosageUnit: body.dosageUnit,
      frequency: body.frequency,
      maxDosesPerDay: body.maxDosesPerDay,
      maxTotalDailyDosage: body.maxTotalDailyDosage,
      startDate: body.startDate,
      endDate: body.endDate,
      isActive: true,
    });

    console.log("Created medication:", medication);

    return NextResponse.json(medication, { status: 201 });
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    console.error("Error creating medication:", error);
    return NextResponse.json(
      {
        error: "Failed to create medication",
        details: errorMessage,
      },
      { status: 500 }
    );
  }
}
