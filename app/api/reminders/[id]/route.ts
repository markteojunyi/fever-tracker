import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import connectDB from "@/lib/mongodb";
import { isOwnershipError, requireOwnedChild } from "@/lib/api/ownership";
import MedicationReminder from "@/lib/models/MedicationReminder";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    await connectDB();

    const { id } = await params;
    const body = await request.json();
    const existingReminder = await MedicationReminder.findById(id);

    if (!existingReminder) {
      return NextResponse.json(
        { error: "Reminder not found" },
        { status: 404 }
      );
    }

    const child = await requireOwnedChild(
      existingReminder.childId?.toString(),
      session.user.id
    );
    if (isOwnershipError(child)) return child;

    const reminder = await MedicationReminder.findByIdAndUpdate(
      id,
      {
        isCompleted: body.isCompleted,
        completedAt: body.isCompleted ? new Date() : null,
      },
      { new: true }
    );

    if (!reminder) {
      return NextResponse.json(
        { error: "Reminder not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(reminder);
  } catch {
    return NextResponse.json(
      { error: "Failed to update reminder" },
      { status: 500 }
    );
  }
}
