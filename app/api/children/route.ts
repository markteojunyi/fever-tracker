import { NextRequest, NextResponse } from "next/server";
import { withHandler } from "@/lib/api/withHandler";
import Child from "@/lib/models/Child";

export const GET = withHandler(async (_req: NextRequest, userId: string) => {
  const children = await Child.find({ userId }).sort({ createdAt: -1 });
  return NextResponse.json(children);
});

export const POST = withHandler(async (req: NextRequest, userId: string) => {
  const body = await req.json();

  const child = await Child.create({
    userId,
    name: body.name,
    dateOfBirth: body.dateOfBirth,
    weight: body.weight,
  });

  return NextResponse.json(child, { status: 201 });
});

export const PATCH = withHandler(async (req: NextRequest, userId: string) => {
  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  const { name } = await req.json();
  if (!name)
    return NextResponse.json({ error: "name required" }, { status: 400 });

  // Ownership is enforced by the { userId } filter — findOneAndUpdate returns
  // null (-> 404) if the record isn't owned. No separate pre-check needed,
  // which saves one cross-region round-trip (Atlas SG <-> Netlify Ohio).
  const updated = await Child.findOneAndUpdate(
    { _id: id, userId },
    { name },
    { new: true }
  );
  if (!updated)
    return NextResponse.json({ error: "Record not found" }, { status: 404 });

  return NextResponse.json(updated);
});

export const DELETE = withHandler(async (req: NextRequest, userId: string) => {
  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  const deleted = await Child.findOneAndDelete({ _id: id, userId });
  if (!deleted)
    return NextResponse.json({ error: "Record not found" }, { status: 404 });

  return NextResponse.json({ message: "Deleted" });
});
