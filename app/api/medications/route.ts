import { NextRequest, NextResponse } from "next/server";
import { withHandler } from "@/lib/api/withHandler";
import {
  getOwnedChildIds,
  isOwnershipError,
  requireOwnedChild,
} from "@/lib/api/ownership";
import MedicationDefinition from "@/lib/models/MedicationDefinition";

export const GET = withHandler(async (req: NextRequest, userId: string) => {
  const childId = req.nextUrl.searchParams.get("childId");
  const isActive = req.nextUrl.searchParams.get("isActive");

  const query: { childId?: string | { $in: unknown[] }; isActive?: boolean } =
    {};
  if (childId) {
    const child = await requireOwnedChild(childId, userId);
    if (isOwnershipError(child)) return child;

    query.childId = childId;
  } else {
    query.childId = { $in: await getOwnedChildIds(userId) };
  }
  if (isActive === "true") query.isActive = true;
  if (isActive === "false") query.isActive = false;

  const medications = await MedicationDefinition.find(query).sort({
    createdAt: -1,
  });
  return NextResponse.json(medications);
});

export const POST = withHandler(async (req: NextRequest, userId: string) => {
  const body = await req.json();
  const child = await requireOwnedChild(body.childId, userId);
  if (isOwnershipError(child)) return child;

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

export const PATCH = withHandler(async (req: NextRequest, userId: string) => {
  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  const medication = await MedicationDefinition.findById(id);
  if (!medication)
    return NextResponse.json(
      { error: "Medication not found" },
      { status: 404 }
    );

  const child = await requireOwnedChild(medication.childId?.toString(), userId);
  if (isOwnershipError(child)) return child;

  const body = await req.json();
  const update: {
    name?: string;
    dosage?: number;
    dosageUnit?: "pills" | "ml";
    frequency?: number;
    maxDosesPerDay?: number;
    maxTotalDailyDosage?: number | null;
    startDate?: string;
    endDate?: string | null;
    isActive?: boolean;
  } = {};
  if (body.name !== undefined) update.name = body.name;
  if (body.dosage !== undefined) update.dosage = body.dosage;
  if (body.dosageUnit !== undefined) update.dosageUnit = body.dosageUnit;
  if (body.frequency !== undefined) update.frequency = body.frequency;
  if (body.maxDosesPerDay !== undefined)
    update.maxDosesPerDay = body.maxDosesPerDay;
  if (body.maxTotalDailyDosage !== undefined)
    update.maxTotalDailyDosage = body.maxTotalDailyDosage;
  if (body.startDate !== undefined) update.startDate = body.startDate;
  if (body.endDate !== undefined) update.endDate = body.endDate || null;
  if (body.isActive !== undefined) update.isActive = body.isActive;

  const updated = await MedicationDefinition.findByIdAndUpdate(id, update, {
    new: true,
    runValidators: true,
  });
  return NextResponse.json(updated);
});
