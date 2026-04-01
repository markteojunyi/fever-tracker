import { NextRequest, NextResponse } from "next/server";
import { withHandler } from "@/lib/api/withHandler";
import Child from "@/lib/models/Child";

export const GET = withHandler(async () => {
  const children = await Child.find().sort({ createdAt: -1 });
  return NextResponse.json(children);
});

export const POST = withHandler(async (req: NextRequest) => {
  const body = await req.json();

  const child = await Child.create({
    name: body.name,
    dateOfBirth: body.dateOfBirth,
    weight: body.weight,
  });

  return NextResponse.json(child, { status: 201 });
});

export const PATCH = withHandler(async (req: NextRequest) => {
  const id = req.nextUrl.searchParams.get("id");
  if (!id)
    return NextResponse.json({ error: "id required" }, { status: 400 });

  const { name } = await req.json();
  if (!name)
    return NextResponse.json({ error: "name required" }, { status: 400 });

  const updated = await Child.findByIdAndUpdate(id, { name }, { new: true });
  if (!updated)
    return NextResponse.json({ error: "Record not found" }, { status: 404 });

  return NextResponse.json(updated);
});

export const DELETE = withHandler(async (req: NextRequest) => {
  const id = req.nextUrl.searchParams.get("id");
  if (!id)
    return NextResponse.json({ error: "id required" }, { status: 400 });

  await Child.findByIdAndDelete(id);
  return NextResponse.json({ message: "Deleted" });
});
