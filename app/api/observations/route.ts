import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Observation from "@/lib/models/Observation";
import Child from "@/lib/models/Child";

export async function GET(req: NextRequest) {
  const childId = req.nextUrl.searchParams.get("childId");
  if (!childId)
    return NextResponse.json({ error: "childId required" }, { status: 400 });

  await connectDB();

  const child = await Child.findById(childId);
  if (!child)
    return NextResponse.json({ error: "Not found" }, { status: 404 });

  const observations = await Observation.find({ childId }).sort({
    observedAt: -1,
  });
  return NextResponse.json(observations);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { childId, content, observedAt } = body;

  if (!childId || !content?.trim()) {
    return NextResponse.json(
      { error: "childId and content are required" },
      { status: 400 }
    );
  }

  await connectDB();

  const child = await Child.findById(childId);
  if (!child)
    return NextResponse.json({ error: "Not found" }, { status: 404 });

  const observation = await Observation.create({
    childId,
    content: content.trim(),
    observedAt: observedAt ? new Date(observedAt) : new Date(),
  });

  return NextResponse.json(observation, { status: 201 });
}

export async function DELETE(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("id");
  if (!id)
    return NextResponse.json({ error: "id required" }, { status: 400 });

  await connectDB();

  const deleted = await Observation.findByIdAndDelete(id);
  if (!deleted)
    return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({ success: true });
}
