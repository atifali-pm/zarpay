import { NextResponse, type NextRequest } from "next/server";
import { requireBearerUser, toPublicUser } from "@/lib/api-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const auth = await requireBearerUser(req);
  if ("response" in auth) return auth.response;
  return NextResponse.json({ user: toPublicUser(auth.user) });
}
