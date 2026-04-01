import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { withHandler } from "@/lib/api/withHandler";
import User from "@/models/User";

export const POST = withHandler(async (req: NextRequest) => {
  const { name, email, password } = await req.json();

  if (!name || !email || !password)
    return NextResponse.json(
      { error: "Missing required fields" },
      { status: 400 }
    );

  if (password.length < 6)
    return NextResponse.json(
      { error: "Password must be at least 6 characters" },
      { status: 400 }
    );

  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing)
    return NextResponse.json(
      { error: "User with this email already exists" },
      { status: 400 }
    );

  const hashedPassword = await bcrypt.hash(password, 10);
  const user = await User.create({
    name,
    email: email.toLowerCase(),
    password: hashedPassword,
  });

  return NextResponse.json(
    { message: "User created successfully", user: { id: user._id, name: user.name, email: user.email } },
    { status: 201 }
  );
});
