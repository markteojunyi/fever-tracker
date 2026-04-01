import { NextRequest, NextResponse } from "next/server";
import { withHandler } from "@/lib/api/withHandler";
import TemperatureReading from "@/lib/models/TemperatureReading";

export const GET = withHandler(async (req: NextRequest) => {
  const childId = req.nextUrl.searchParams.get("childId");
  if (!childId)
    return NextResponse.json({ error: "childId required" }, { status: 400 });

  const readings = await TemperatureReading.find({ childId }).sort({
    timestamp: 1,
  });
  return NextResponse.json(readings);
});

export const POST = withHandler(async (req: NextRequest) => {
  const body = await req.json();

  const reading = await TemperatureReading.create({
    childId: body.childId,
    temperature: body.temperature,
    temperatureUnit: body.temperatureUnit,
    timestamp: body.timestamp,
    notes: body.notes,
  });

  return NextResponse.json(reading, { status: 201 });
});

export const DELETE = withHandler(async (req: NextRequest) => {
  const id = req.nextUrl.searchParams.get("id");
  if (!id)
    return NextResponse.json({ error: "id required" }, { status: 400 });

  await TemperatureReading.findByIdAndDelete(id);
  return NextResponse.json({ message: "Deleted" });
});
