import { NextResponse } from "next/server";
import mongoose from "mongoose";
import connectDB from "@/lib/mongodb";

export const dynamic = "force-dynamic";

// Liveness/readiness probe for uptime monitoring. Verifies the app is up and
// the database is reachable. Returns no internal details beyond status.
export async function GET() {
  try {
    await connectDB();
    await mongoose.connection.db?.admin().ping();
    return NextResponse.json({ status: "ok" });
  } catch {
    return NextResponse.json({ status: "unhealthy" }, { status: 503 });
  }
}
