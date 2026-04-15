import { NextResponse, type NextRequest } from "next/server";
import { requireBearerUser } from "@/lib/api-auth";
import { getOtpProvider } from "@/lib/providers/otp";
import type { OtpSendResponse } from "@zarpay/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const auth = await requireBearerUser(req);
  if ("response" in auth) return auth.response;

  if (!auth.user.phone) {
    return NextResponse.json(
      { error: "No phone on file", code: "NO_PHONE" },
      { status: 400 },
    );
  }

  const result = await getOtpProvider().send({ phone: auth.user.phone });
  const body: OtpSendResponse = { challengeId: result.challengeId };
  return NextResponse.json(body);
}
