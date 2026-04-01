import { NextRequest, NextResponse } from "next/server";
import { withHandler } from "@/lib/api/withHandler";
import MedicationDefinition from "@/lib/models/MedicationDefinition";

export const GET = withHandler(async (req: NextRequest) => {
  const childId = req.nextUrl.searchParams.get("childId");
  const isActive = req.nextUrl.searchParams.get("isActive");

  const query: { childId?: string; isActive?: boolean } = {};
  if (childId) query.childId = childId;
  if (isActive === "true") query.isActive = true;
  if (isActive === "false") query.isActive = false;

  const medications = await MedicationDefinition.find(query).sort({
    createdAt: -1,
  });
  return NextResponse.json(medications);
});

export const POST = withHandler(async (req: NextRequest) => {
  const body = await req.json();

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

  return NextResponse.json(medication, { status: 201 });
});
