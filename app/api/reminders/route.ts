import { NextRequest, NextResponse } from "next/server";
import { withHandler } from "@/lib/api/withHandler";
import {
  getOwnedChildIds,
  isOwnershipError,
  requireOwnedChild,
} from "@/lib/api/ownership";
import MedicationReminder from "@/lib/models/MedicationReminder";
import MedicationDefinition from "@/lib/models/MedicationDefinition";

export const GET = withHandler(async (req: NextRequest, userId: string) => {
  const childId = req.nextUrl.searchParams.get("childId");
  const isCompleted = req.nextUrl.searchParams.get("isCompleted");

  const query: {
    childId?: string | { $in: unknown[] };
    isCompleted?: boolean;
  } = {};
  if (childId) {
    const child = await requireOwnedChild(childId, userId);
    if (isOwnershipError(child)) return child;

    query.childId = childId;
  } else {
    query.childId = { $in: await getOwnedChildIds(userId) };
  }
  if (isCompleted === "true") query.isCompleted = true;
  if (isCompleted === "false") query.isCompleted = false;

  const reminders = await MedicationReminder.find(query).sort({
    scheduledTime: 1,
  });
  return NextResponse.json(reminders);
});

export const POST = withHandler(async (req: NextRequest, userId: string) => {
  const body = await req.json();

  const med = await MedicationDefinition.findById(body.medicationDefinitionId);
  if (!med)
    return NextResponse.json(
      { error: "Medication not found" },
      { status: 404 }
    );

  const child = await requireOwnedChild(med.childId?.toString(), userId);
  if (isOwnershipError(child)) return child;

  const startDate = new Date(med.startDate);
  const endDate = med.endDate
    ? new Date(med.endDate)
    : new Date(startDate.getTime() + 30 * 24 * 60 * 60 * 1000);

  const reminders = [];
  let current = new Date(startDate);
  while (current <= endDate) {
    reminders.push({
      medicationDefinitionId: med._id,
      childId: med.childId,
      scheduledTime: new Date(current),
      isCompleted: false,
    });
    current = new Date(current.getTime() + med.frequency * 60 * 60 * 1000);
  }

  await MedicationReminder.insertMany(reminders);
  return NextResponse.json(
    { success: true, count: reminders.length },
    { status: 201 }
  );
});
