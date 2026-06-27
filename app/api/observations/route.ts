import { NextRequest, NextResponse } from "next/server";
import { withHandler } from "@/lib/api/withHandler";
import { isOwnershipError, requireOwnedChild } from "@/lib/api/ownership";
import Observation from "@/lib/models/Observation";
import Child from "@/lib/models/Child";

export const GET = withHandler(async (req: NextRequest) => {
  const childId = req.nextUrl.searchParams.get("childId");
  if (!childId)
    return NextResponse.json({ error: "childId required" }, { status: 400 });

  const child = await Child.findById(childId);
  if (!child) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const observations = await Observation.find({ childId }).sort({
    observedAt: -1,
  });
  return NextResponse.json(observations);
});

export const POST = withHandler(async (req: NextRequest) => {
  const { childId, content, observedAt } = await req.json();

  if (!childId || !content?.trim())
    return NextResponse.json(
      { error: "childId and content are required" },
      { status: 400 }
    );

  const child = await Child.findById(childId);
  if (!child) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const observation = await Observation.create({
    childId,
    content: content.trim(),
    observedAt: observedAt ? new Date(observedAt) : new Date(),
  });

  return NextResponse.json(observation, { status: 201 });
});

export const PATCH = withHandler(async (req: NextRequest, userId: string) => {
  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  const observation = await Observation.findById(id);
  if (!observation)
    return NextResponse.json({ error: "Not found" }, { status: 404 });

  const child = await requireOwnedChild(
    observation.childId?.toString(),
    userId
  );
  if (isOwnershipError(child)) return child;

  const { content, observedAt } = await req.json();
  if (content !== undefined && !content?.trim())
    return NextResponse.json(
      { error: "content cannot be empty" },
      { status: 400 }
    );

  const update: { content?: string; observedAt?: Date } = {};
  if (content !== undefined) update.content = content.trim();
  if (observedAt !== undefined) update.observedAt = new Date(observedAt);

  const updated = await Observation.findByIdAndUpdate(id, update, {
    new: true,
  });
  return NextResponse.json(updated);
});

export const DELETE = withHandler(async (req: NextRequest) => {
  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  const deleted = await Observation.findByIdAndDelete(id);
  if (!deleted)
    return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({ success: true });
});
