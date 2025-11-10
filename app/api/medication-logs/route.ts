// ============================================
// FILE: app/api/medication-logs/route.ts
// GET logs, POST new medication log
// ============================================

import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import MedicationLog from '@/lib/models/MedicationLog';

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    const childId = request.nextUrl.searchParams.get('childId');
    const medicationDefinitionId = request.nextUrl.searchParams.get('medicationDefinitionId');
    const date = request.nextUrl.searchParams.get('date'); // YYYY-MM-DD format

    const query: any = {};
    if (childId) query.childId = childId;
    if (medicationDefinitionId) query.medicationDefinitionId = medicationDefinitionId;

    let logs = await MedicationLog.find(query).sort({ administeredAt: -1 });

    // Filter by date if provided
    if (date) {
      const [year, month, day] = date.split('-').map(Number);
      const startOfDay = new Date(year, month - 1, day, 0, 0, 0);
      const endOfDay = new Date(year, month - 1, day, 23, 59, 59);

      logs = logs.filter((log) => {
        const logDate = new Date(log.administeredAt);
        return logDate >= startOfDay && logDate <= endOfDay;
      });
    }

    return NextResponse.json(logs);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch medication logs' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const body = await request.json();

    const log = await MedicationLog.create({
      medicationDefinitionId: body.medicationDefinitionId,
      childId: body.childId,
      administeredAt: body.administeredAt,
      dosageAdministered: body.dosageAdministered,
      dosageUnit: body.dosageUnit,
      administeredBy: body.administeredBy,
    });

    return NextResponse.json(log, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create medication log' }, { status: 500 });
  }
}
