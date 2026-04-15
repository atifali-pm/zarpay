import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { requireBearerUser } from "@/lib/api-auth";
import { getOtpProvider } from "@/lib/providers/otp";
import type { OtpVerifyResponse } from "@zarpay/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const schema = z.object({
  challengeId: z.string().min(1),
  code: z.string().regex(/^\d{6}$/, "Code must be 6 digits"),
});

export async function POST(req: NextRequest) {
  const auth = await requireBearerUser(req);
  if ("response" in auth) return auth.response;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid code", code: "VALIDATION" },
      { status: 400 },
    );
  }

  const result = await getOtpProvider().verify({
    challengeId: parsed.data.challengeId,
    code: parsed.data.code,
  });

  if (!result.ok) {
    return NextResponse.json(
      { error: "Code is invalid or expired", code: "BAD_OTP" },
      { status: 400 },
    );
  }

  const response: OtpVerifyResponse = { ok: true };
  return NextResponse.json(response);
}
