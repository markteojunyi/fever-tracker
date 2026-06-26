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
