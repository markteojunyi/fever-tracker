import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { withHandler } from "@/lib/api/withHandler";
import User from "@/models/User";

export const POST = withHandler(async (req: NextRequest) => {
  const { email, newPassword } = await req.json();

  if (!email || !newPassword)
    return NextResponse.json(
      { error: "Missing required fields" },
      { status: 400 }
    );

  if (newPassword.length < 6)
    return NextResponse.json(
      { error: "Password must be at least 6 characters" },
      { status: 400 }
    );

  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user)
    return NextResponse.json(
      { error: "No account found with that email" },
      { status: 404 }
    );

  const hashedPassword = await bcrypt.hash(newPassword, 10);
  await User.updateOne(
    { email: email.toLowerCase() },
    { $set: { password: hashedPassword } }
  );

  return NextResponse.json({ message: "Password updated successfully" });
});
