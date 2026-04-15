import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { signToken } from "@/lib/jwt";
import { toPublicUser } from "@/lib/api-auth";
import type { SignInResponse } from "@zarpay/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid credentials format", code: "VALIDATION" },
      { status: 400 },
    );
  }

  const email = parsed.data.email.toLowerCase();
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || user.deletedAt || user.frozen) {
    return NextResponse.json(
      { error: "Email or password is incorrect", code: "INVALID_CREDENTIALS" },
      { status: 401 },
    );
  }

  const ok = await bcrypt.compare(parsed.data.password, user.passwordHash);
  if (!ok) {
    return NextResponse.json(
      { error: "Email or password is incorrect", code: "INVALID_CREDENTIALS" },
      { status: 401 },
    );
  }

  const token = await signToken({
    sub: user.id,
    email: user.email,
    role: user.role,
    kycStatus: user.kycStatus,
  });

  const response: SignInResponse = {
    token,
    user: toPublicUser(user),
  };
  return NextResponse.json(response);
}
