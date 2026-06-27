import { NextRequest, NextResponse } from "next/server";
import { withHandler } from "@/lib/api/withHandler";
import { isOwnershipError, requireOwnedChild } from "@/lib/api/ownership";
import TemperatureReading from "@/lib/models/TemperatureReading";

export const GET = withHandler(async (req: NextRequest, userId: string) => {
  const childId = req.nextUrl.searchParams.get("childId");
  const child = await requireOwnedChild(childId, userId);
  if (isOwnershipError(child)) return child;

  const readings = await TemperatureReading.find({ childId }).sort({
    timestamp: 1,
  });
  return NextResponse.json(readings);
});

export const POST = withHandler(async (req: NextRequest, userId: string) => {
  const body = await req.json();
  const child = await requireOwnedChild(body.childId, userId);
  if (isOwnershipError(child)) return child;

  const reading = await TemperatureReading.create({
    childId: body.childId,
    temperature: body.temperature,
    temperatureUnit: body.temperatureUnit,
    timestamp: body.timestamp,
    notes: body.notes,
  });

  return NextResponse.json(reading, { status: 201 });
});

export const PATCH = withHandler(async (req: NextRequest, userId: string) => {
  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  const reading = await TemperatureReading.findById(id);
  if (!reading)
    return NextResponse.json({ error: "Record not found" }, { status: 404 });

  const child = await requireOwnedChild(reading.childId?.toString(), userId);
  if (isOwnershipError(child)) return child;

  const body = await req.json();
  const update: {
    temperature?: number;
    temperatureUnit?: "C" | "F";
    timestamp?: string;
    notes?: string | null;
  } = {};
  if (body.temperature !== undefined) update.temperature = body.temperature;
  if (body.temperatureUnit !== undefined)
    update.temperatureUnit = body.temperatureUnit;
  if (body.timestamp !== undefined) update.timestamp = body.timestamp;
  if (body.notes !== undefined) update.notes = body.notes || null;

  const updated = await TemperatureReading.findByIdAndUpdate(id, update, {
    new: true,
    runValidators: true,
  });
  return NextResponse.json(updated);
});

export const DELETE = withHandler(async (req: NextRequest, userId: string) => {
  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  const reading = await TemperatureReading.findById(id);
  if (!reading)
    return NextResponse.json({ error: "Record not found" }, { status: 404 });

  const child = await requireOwnedChild(reading.childId?.toString(), userId);
  if (isOwnershipError(child)) return child;

  await TemperatureReading.findByIdAndDelete(id);
  return NextResponse.json({ message: "Deleted" });
});
