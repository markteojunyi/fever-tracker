import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest, NextResponse } from "next/server";

// Mock connectDB before importing withHandler
vi.mock("@/lib/mongodb", () => ({
  default: vi.fn().mockResolvedValue(undefined),
}));

// Mock auth — default to a valid session so existing assertions still pass.
// Individual tests can override via mockResolvedValueOnce(null) to test the
// unauthenticated path.
vi.mock("@/auth", () => ({
  auth: vi.fn().mockResolvedValue({
    user: { id: "test-user-id", email: "test@example.com" },
  }),
}));

import { withHandler, withPublicHandler } from "@/lib/api/withHandler";
import connectDB from "@/lib/mongodb";
import { auth } from "@/auth";

function makeRequest(path = "/api/test", method = "GET"): NextRequest {
  return new NextRequest(`http://localhost${path}`, { method });
}

describe("withHandler", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset auth to default valid session after each clear
    (auth as ReturnType<typeof vi.fn>).mockResolvedValue({
      user: { id: "test-user-id", email: "test@example.com" },
    });
  });

  it("calls connectDB before the handler", async () => {
    const order: string[] = [];
    (connectDB as ReturnType<typeof vi.fn>).mockImplementationOnce(async () => {
      order.push("connectDB");
    });

    const handler = withHandler(async () => {
      order.push("handler");
      return NextResponse.json({ ok: true });
    });

    await handler(makeRequest());
    expect(order).toEqual(["connectDB", "handler"]);
  });

  it("returns the handler's response when it succeeds", async () => {
    const handler = withHandler(async () =>
      NextResponse.json({ data: "hello" }, { status: 200 })
    );

    const res = await handler(makeRequest());
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body).toEqual({ data: "hello" });
  });

  it("passes the request object through to the handler", async () => {
    let capturedReq: NextRequest | null = null;

    const handler = withHandler(async (req) => {
      capturedReq = req;
      return NextResponse.json({});
    });

    const req = makeRequest("/api/temperatures?childId=abc");
    await handler(req);

    expect(capturedReq).toBe(req);
    expect(
      (capturedReq as unknown as NextRequest).nextUrl.searchParams.get(
        "childId"
      )
    ).toBe("abc");
  });

  it("returns a 500 JSON response when the handler throws", async () => {
    const handler = withHandler(async () => {
      throw new Error("Something went wrong");
    });

    const res = await handler(makeRequest());
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body.error).toBe("Something went wrong");
  });

  it("returns 'Internal server error' for non-Error throws", async () => {
    const handler = withHandler(async () => {
      // eslint-disable-next-line @typescript-eslint/no-throw-literal
      throw "a plain string error";
    });

    const res = await handler(makeRequest());
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body.error).toBe("Internal server error");
  });

  it("returns 500 when connectDB itself throws", async () => {
    (connectDB as ReturnType<typeof vi.fn>).mockRejectedValueOnce(
      new Error("DB connection failed")
    );

    const handler = withHandler(async () => NextResponse.json({ ok: true }));
    const res = await handler(makeRequest());
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body.error).toBe("DB connection failed");
  });

  it("still passes through intentional 4xx responses from the handler", async () => {
    const handler = withHandler(async () =>
      NextResponse.json({ error: "Not found" }, { status: 404 })
    );

    const res = await handler(makeRequest());
    expect(res.status).toBe(404);
  });

  it("works correctly with POST handlers that read the request body", async () => {
    const handler = withHandler(async (req) => {
      const body = await req.json();
      return NextResponse.json({ received: body.name });
    });

    const req = new NextRequest("http://localhost/api/children", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "Emma" }),
    });

    const res = await handler(req);
    const body = await res.json();
    expect(body.received).toBe("Emma");
  });

  it("returns 401 when no session is present", async () => {
    (auth as ReturnType<typeof vi.fn>).mockResolvedValueOnce(null);

    const handler = withHandler(async () => NextResponse.json({ ok: true }));
    const res = await handler(makeRequest());

    expect(res.status).toBe(401);
    expect((await res.json()).error).toBe("Unauthorized");
  });

  it("returns 401 when session exists but has no user.id", async () => {
    (auth as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ user: {} });

    const handler = withHandler(async () => NextResponse.json({ ok: true }));
    const res = await handler(makeRequest());

    expect(res.status).toBe(401);
  });

  it("does not call connectDB when unauthenticated", async () => {
    (auth as ReturnType<typeof vi.fn>).mockResolvedValueOnce(null);

    const handlerFn = vi.fn(async () => NextResponse.json({ ok: true }));
    const handler = withHandler(handlerFn);

    await handler(makeRequest());

    expect(connectDB).not.toHaveBeenCalled();
    expect(handlerFn).not.toHaveBeenCalled();
  });
});

describe("withPublicHandler", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("does not check auth — runs even when no session is present", async () => {
    (auth as ReturnType<typeof vi.fn>).mockResolvedValueOnce(null);

    const handler = withPublicHandler(async () =>
      NextResponse.json({ ok: true })
    );

    const res = await handler(makeRequest());
    expect(res.status).toBe(200);
    expect(auth).not.toHaveBeenCalled();
  });

  it("still calls connectDB before the handler", async () => {
    const order: string[] = [];
    (connectDB as ReturnType<typeof vi.fn>).mockImplementationOnce(async () => {
      order.push("connectDB");
    });

    const handler = withPublicHandler(async () => {
      order.push("handler");
      return NextResponse.json({ ok: true });
    });

    await handler(makeRequest());
    expect(order).toEqual(["connectDB", "handler"]);
  });

  it("returns 500 when the handler throws", async () => {
    const handler = withPublicHandler(async () => {
      throw new Error("boom");
    });

    const res = await handler(makeRequest());
    expect(res.status).toBe(500);
    expect((await res.json()).error).toBe("boom");
  });
});
