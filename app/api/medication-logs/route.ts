import { NextRequest, NextResponse } from "next/server";
import { withHandler } from "@/lib/api/withHandler";
import {
  getOwnedChildIds,
  isOwnershipError,
  requireOwnedChild,
} from "@/lib/api/ownership";
import MedicationLog from "@/lib/models/MedicationLog";
import MedicationDefinition from "@/lib/models/MedicationDefinition";

export const GET = withHandler(async (req: NextRequest, userId: string) => {
  const childId = req.nextUrl.searchParams.get("childId");
  const medicationDefinitionId = req.nextUrl.searchParams.get(
    "medicationDefinitionId"
  );
  const date = req.nextUrl.searchParams.get("date"); // YYYY-MM-DD

  const query: {
    childId?: string | { $in: unknown[] };
    medicationDefinitionId?: string;
  } = {};
  if (childId) {
    const child = await requireOwnedChild(childId, userId);
    if (isOwnershipError(child)) return child;

    query.childId = childId;
  } else {
    query.childId = { $in: await getOwnedChildIds(userId) };
  }
  if (medicationDefinitionId) {
    const medication = await MedicationDefinition.findOne({
      _id: medicationDefinitionId,
      childId: query.childId,
    });

    if (!medication)
      return NextResponse.json(
        { error: "Medication not found" },
        { status: 404 }
      );

    query.medicationDefinitionId = medicationDefinitionId;
  }

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

export const POST = withHandler(async (req: NextRequest, userId: string) => {
  const body = await req.json();

  // Ownership check and medication lookup are independent, so run them in
  // parallel — turns two sequential cross-region round-trips into one
  // (Atlas SG <-> Netlify Ohio). Ownership is still fully enforced below.
  const [child, medication] = await Promise.all([
    requireOwnedChild(body.childId, userId),
    MedicationDefinition.findOne({
      _id: body.medicationDefinitionId,
      childId: body.childId,
    }),
  ]);
  if (isOwnershipError(child)) return child;

  if (!medication)
    return NextResponse.json(
      { error: "Medication not found" },
      { status: 404 }
    );

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

export const PATCH = withHandler(async (req: NextRequest, userId: string) => {
  const id = req.nextUrl.searchParams.get("id");
  if (!id)
    return NextResponse.json({ error: "Log ID is required" }, { status: 400 });

  const log = await MedicationLog.findById(id);
  if (!log)
    return NextResponse.json({ error: "Log not found" }, { status: 404 });

  const child = await requireOwnedChild(log.childId?.toString(), userId);
  if (isOwnershipError(child)) return child;

  const body = await req.json();
  const update: {
    administeredAt?: string;
    dosageAdministered?: number;
    dosageUnit?: "pills" | "ml";
    administeredBy?: string;
    notes?: string | undefined;
  } = {};
  if (body.administeredAt !== undefined)
    update.administeredAt = body.administeredAt;
  if (body.dosageAdministered !== undefined)
    update.dosageAdministered = body.dosageAdministered;
  if (body.dosageUnit !== undefined) update.dosageUnit = body.dosageUnit;
  if (body.administeredBy !== undefined)
    update.administeredBy = body.administeredBy;
  if (body.notes !== undefined) update.notes = body.notes || undefined;

  const updated = await MedicationLog.findByIdAndUpdate(id, update, {
    new: true,
    runValidators: true,
  });
  return NextResponse.json(updated);
});

export const DELETE = withHandler(async (req: NextRequest, userId: string) => {
  const id = req.nextUrl.searchParams.get("id");
  if (!id)
    return NextResponse.json({ error: "Log ID is required" }, { status: 400 });

  const log = await MedicationLog.findById(id);
  if (!log)
    return NextResponse.json({ error: "Log not found" }, { status: 404 });

  const child = await requireOwnedChild(log.childId?.toString(), userId);
  if (isOwnershipError(child)) return child;

  const deleted = await MedicationLog.findByIdAndDelete(id);
  return NextResponse.json({ message: "Log deleted successfully", deleted });
});
