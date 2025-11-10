// ============================================
// FILE: app/api/reminders/[id]/route.ts
// PATCH reminder to mark as completed
// ============================================

import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import MedicationReminder from '@/lib/models/MedicationReminder';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params;
    const body = await request.json();

    const reminder = await MedicationReminder.findByIdAndUpdate(
      id,
      {
        isCompleted: body.isCompleted,
        completedAt: body.isCompleted ? new Date() : null,
      },
      { new: true }
    );

    if (!reminder) {
      return NextResponse.json({ error: 'Reminder not found' }, { status: 404 });
    }

    return NextResponse.json(reminder);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update reminder' }, { status: 500 });
  }
}