import { NextRequest, NextResponse } from "next/server";
import { withHandler } from "@/lib/api/withHandler";
import MedicationLog from "@/lib/models/MedicationLog";

export const GET = withHandler(async (req: NextRequest) => {
  const childId = req.nextUrl.searchParams.get("childId");
  const medicationDefinitionId = req.nextUrl.searchParams.get(
    "medicationDefinitionId"
  );
  const date = req.nextUrl.searchParams.get("date"); // YYYY-MM-DD

  const query: { childId?: string; medicationDefinitionId?: string } = {};
  if (childId) query.childId = childId;
  if (medicationDefinitionId) query.medicationDefinitionId = medicationDefinitionId;

  let logs = await MedicationLog.find(query).sort({ administeredAt: -1 });

  if (date) {
    const [year, month, day] = date.split("-").map(Number);
    const start = new Date(year, month - 1, day, 0, 0, 0);
    const end = new Date(year, month - 1, day, 23, 59, 59);
    logs = logs.filter((log) => {
      const d = new Date(log.administeredAt);
      return d >= start && d <= end;
    });
  }

  return NextResponse.json(logs);
});

export const POST = withHandler(async (req: NextRequest) => {
  const body = await req.json();

  const log = await MedicationLog.create({
    medicationDefinitionId: body.medicationDefinitionId,
    childId: body.childId,
    administeredAt: body.administeredAt,
    dosageAdministered: body.dosageAdministered,
    dosageUnit: body.dosageUnit,
    administeredBy: body.administeredBy,
    notes: body.notes || undefined,
  });

  return NextResponse.json(log, { status: 201 });
});

export const DELETE = withHandler(async (req: NextRequest) => {
  const id = req.nextUrl.searchParams.get("id");
  if (!id)
    return NextResponse.json({ error: "Log ID is required" }, { status: 400 });

  const deleted = await MedicationLog.findByIdAndDelete(id);
  if (!deleted)
    return NextResponse.json({ error: "Log not found" }, { status: 404 });

  return NextResponse.json({ message: "Log deleted successfully", deleted });
});
