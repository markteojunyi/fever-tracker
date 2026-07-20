import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { withPublicHandler } from "@/lib/api/withHandler";
import { parseBody, registerSchema } from "@/lib/api/validation";
import User from "@/models/User";

export const POST = withPublicHandler(async (req: NextRequest) => {
  const parsed = await parseBody(req, registerSchema);
  if (!parsed.ok) return parsed.response;
  const { name, email, password } = parsed.data;

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
    {
      message: "User created successfully",
      user: { id: user._id, name: user.name, email: user.email },
    },
    { status: 201 }
  );
});
