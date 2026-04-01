// ─── Decorator Pattern ────────────────────────────────────────────────────────
// Before: every API route handler repeated the same skeleton:
//
//   export async function GET(req) {
//     try {
//       await connectDB();
//       // ...business logic...
//     } catch (error) {
//       return NextResponse.json({ error: "..." }, { status: 500 });
//     }
//   }
//
//   This boilerplate appeared in ~16 handler functions across 8 route files.
//   Each route also had to know about connectDB and write its own catch block.
//
// After: withHandler wraps any route handler and adds the connect/catch
//   behaviour around it — the "decoration". Route handlers now contain only
//   their own business logic. connectDB and 500-error formatting live in one
//   place.
//
//   Usage:
//     export const GET = withHandler(async (req) => {
//       // just the logic — no try/catch, no connectDB
//     });
// ─────────────────────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";

type RouteHandler = (req: NextRequest) => Promise<NextResponse>;

export function withHandler(handler: RouteHandler): RouteHandler {
  return async (req: NextRequest) => {
    try {
      await connectDB();
      return await handler(req);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Internal server error";
      console.error(
        `[API Error] ${req.method} ${req.nextUrl.pathname}:`,
        error
      );
      return NextResponse.json({ error: message }, { status: 500 });
    }
  };
}
