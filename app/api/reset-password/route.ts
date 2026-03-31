import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";

export async function POST(request: NextRequest) {
  try {
    const { email, newPassword } = await request.json();

    if (!email || !newPassword) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    if (newPassword.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters" },
        { status: 400 }
      );
    }

    await connectDB();

    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      return NextResponse.json(
        { error: "No account found with that email" },
        { status: 404 }
      );
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await User.updateOne(
      { email: email.toLowerCase() },
      { $set: { password: hashedPassword } }
    );

    return NextResponse.json({ message: "Password updated successfully" });
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    console.error("Reset password error:", errorMessage);
    return NextResponse.json(
      { error: "Failed to reset password" },
      { status: 500 }
    );
  }
}
