import { NextRequest, NextResponse } from "next/server";

// Password reset will be rebuilt as a token-based flow in a future change.
// Until then, the endpoint is intentionally disabled. To reset a password
// in the meantime, update the user's bcrypt hash directly in MongoDB.
export async function POST(_request: NextRequest) {
  void _request;

  return NextResponse.json(
    { error: "Password reset is temporarily unavailable" },
    { status: 503 }
  );
}
