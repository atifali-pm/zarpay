import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { signToken } from "@/lib/jwt";
import { toPublicUser } from "@/lib/api-auth";
import type { SignUpResponse } from "@zarpay/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const schema = z.object({
  fullName: z.string().min(2, "Full name is too short"),
  email: z.string().email("Please enter a valid email"),
  phone: z
    .string()
    .min(10, "Phone must include the country code")
    .regex(/^\+?[0-9\s-]{10,20}$/i, "Phone must be in international format"),
  password: z.string().min(8, "Password must be at least 8 characters"),
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
      {
        error: parsed.error.issues[0]?.message ?? "Invalid sign up data",
        code: "VALIDATION",
        details: parsed.error.flatten().fieldErrors,
      },
      { status: 400 },
    );
  }

  const email = parsed.data.email.toLowerCase();
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json(
      { error: "An account with that email already exists", code: "EMAIL_TAKEN" },
      { status: 409 },
    );
  }

  const passwordHash = await bcrypt.hash(parsed.data.password, 10);
  const user = await prisma.user.create({
    data: {
      email,
      fullName: parsed.data.fullName,
      phone: parsed.data.phone.replace(/\s|-/g, ""),
      passwordHash,
      role: "sender",
      kycStatus: "unverified",
    },
  });

  const token = await signToken({
    sub: user.id,
    email: user.email,
    role: user.role,
    kycStatus: user.kycStatus,
  });

  const response: SignUpResponse = {
    token,
    user: toPublicUser(user),
  };
  return NextResponse.json(response, { status: 201 });
}
