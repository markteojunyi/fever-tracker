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

// ─── Diagnostics ──────────────────────────────────────────────────────────────
// Set to false (or remove this whole block) once latency is understood.
// `coldStart` is true only for the very first request a fresh serverless
// instance serves — that's when the DB TLS handshake happens.
const TIMING = true;
let coldStart = true;

function formatError(error: unknown, req: NextRequest): NextResponse {
  const message =
    error instanceof Error ? error.message : "Internal server error";
  console.error(`[API Error] ${req.method} ${req.nextUrl.pathname}:`, error);
  return NextResponse.json({ error: message }, { status: 500 });
}

export function withHandler(handler: AuthenticatedRouteHandler): RouteHandler {
  return async (req: NextRequest) => {
    const t0 = performance.now();
    const wasCold = coldStart;
    coldStart = false;
    try {
      const session = await auth();
      const tAuth = performance.now();
      if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      await connectDB();
      const tConnect = performance.now();
      const res = await handler(req, session.user.id);
      const tHandler = performance.now();

      if (TIMING) {
        const fmt = (n: number) => Math.round(n);
        const auth_ms = fmt(tAuth - t0);
        const connect_ms = fmt(tConnect - tAuth);
        const handler_ms = fmt(tHandler - tConnect);
        const total_ms = fmt(tHandler - t0);
        // Visible in Vercel function logs
        console.log(
          `[timing] ${req.method} ${req.nextUrl.pathname} cold=${wasCold} ` +
            `auth=${auth_ms} connect=${connect_ms} handler=${handler_ms} total=${total_ms}ms`
        );
        // Visible in the browser Network tab → response Server-Timing
        res.headers.set(
          "Server-Timing",
          `auth;dur=${auth_ms},connect;dur=${connect_ms},` +
            `handler;dur=${handler_ms},total;dur=${total_ms},cold;desc="${wasCold}"`
        );
      }
      return res;
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
