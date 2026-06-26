import { NextResponse } from "next/server";
import Child from "@/lib/models/Child";

export async function requireOwnedChild(
  childId: string | null | undefined,
  userId: string
) {
  if (!childId) {
    return NextResponse.json({ error: "childId required" }, { status: 400 });
  }

  const child = await Child.findOne({ _id: childId, userId });

  if (!child) {
    return NextResponse.json({ error: "Child not found" }, { status: 404 });
  }

  return child;
}

export function isOwnershipError(value: unknown): value is NextResponse {
  return value instanceof NextResponse;
}

export async function getOwnedChildIds(userId: string) {
  const children = await Child.find({ userId }).select("_id");
  return children.map((child) => child._id);
}
