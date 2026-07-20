import { NextRequest, NextResponse } from "next/server";
import { withHandler } from "@/lib/api/withHandler";
import { isOwnershipError, requireOwnedChild } from "@/lib/api/ownership";
import {
  observationCreateSchema,
  observationUpdateSchema,
  parseBody,
} from "@/lib/api/validation";
import Observation from "@/lib/models/Observation";

export const GET = withHandler(async (req: NextRequest, userId: string) => {
  const childId = req.nextUrl.searchParams.get("childId");
  if (!childId)
    return NextResponse.json({ error: "childId required" }, { status: 400 });

  const child = await requireOwnedChild(childId, userId);
  if (isOwnershipError(child)) return child;

  const observations = await Observation.find({ childId }).sort({
    observedAt: -1,
  });
  return NextResponse.json(observations);
});

export const POST = withHandler(async (req: NextRequest, userId: string) => {
  const parsed = await parseBody(req, observationCreateSchema);
  if (!parsed.ok) return parsed.response;
  const { childId, content, observedAt } = parsed.data;

  const child = await requireOwnedChild(childId, userId);
  if (isOwnershipError(child)) return child;

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

  const parsed = await parseBody(req, observationUpdateSchema);
  if (!parsed.ok) return parsed.response;
  const { content, observedAt } = parsed.data;

  const observation = await Observation.findById(id);
  if (!observation)
    return NextResponse.json({ error: "Not found" }, { status: 404 });

  const child = await requireOwnedChild(
    observation.childId?.toString(),
    userId
  );
  if (isOwnershipError(child)) return child;

  const update: { content?: string; observedAt?: Date } = {};
  if (content !== undefined) update.content = content.trim();
  if (observedAt !== undefined) update.observedAt = new Date(observedAt);

  const updated = await Observation.findByIdAndUpdate(id, update, {
    new: true,
  });
  return NextResponse.json(updated);
});

export const DELETE = withHandler(async (req: NextRequest, userId: string) => {
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

  await Observation.findByIdAndDelete(id);
  return NextResponse.json({ success: true });
});
