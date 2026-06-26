// ─── Decorator Pattern ────────────────────────────────────────────────────────
// withHandler:        wraps an authenticated route handler. Rejects unauthenticated
//                     requests with 401 before connecting to the database.
// withPublicHandler:  wraps a public route handler (e.g. /api/register). No auth
//                     check; just connectDB + error formatting.
//
// Both add the same connectDB + 500-error handling so route bodies stay terse.
// ─────────────────────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import connectDB from "@/lib/mongodb";

type RouteHandler = (req: NextRequest) => Promise<NextResponse>;
type AuthenticatedRouteHandler = (
  req: NextRequest,
  userId: string
) => Promise<NextResponse>;

function formatError(error: unknown, req: NextRequest): NextResponse {
  const message =
    error instanceof Error ? error.message : "Internal server error";
  console.error(`[API Error] ${req.method} ${req.nextUrl.pathname}:`, error);
  return NextResponse.json({ error: message }, { status: 500 });
}

export function withHandler(handler: AuthenticatedRouteHandler): RouteHandler {
  return async (req: NextRequest) => {
    try {
      const session = await auth();
      if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      await connectDB();
      return await handler(req, session.user.id);
    } catch (error) {
      return formatError(error, req);
    }
  };
}

export function withPublicHandler(handler: RouteHandler): RouteHandler {
  return async (req: NextRequest) => {
    try {
      await connectDB();
      return await handler(req);
    } catch (error) {
      return formatError(error, req);
    }
  };
}
