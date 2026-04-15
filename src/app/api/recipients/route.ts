import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { requireBearerUser } from "@/lib/api-auth";
import { toPublicRecipient } from "@/lib/recipient-mapper";
import { createRecipientSchema, toAccountDetails } from "@/lib/recipient-schema";
import type { RecipientListResponse, RecipientResponse } from "@zarpay/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const auth = await requireBearerUser(req);
  if ("response" in auth) return auth.response;

  const rows = await prisma.recipient.findMany({
    where: { userId: auth.user.id, deletedAt: null },
    orderBy: { createdAt: "desc" },
  });

  const body: RecipientListResponse = {
    recipients: rows.map(toPublicRecipient),
  };
  return NextResponse.json(body);
}

export async function POST(req: NextRequest) {
  const auth = await requireBearerUser(req);
  if ("response" in auth) return auth.response;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = createRecipientSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: parsed.error.issues[0]?.message ?? "Invalid recipient",
        code: "VALIDATION",
        details: parsed.error.flatten().fieldErrors,
      },
      { status: 400 },
    );
  }

  const data = parsed.data;
  const row = await prisma.recipient.create({
    data: {
      userId: auth.user.id,
      fullName: data.fullName,
      nickname: data.nickname || null,
      relationship: data.relationship || null,
      phone: data.phone || null,
      payoutMethod: data.payoutMethod,
      accountDetails: toAccountDetails(data) as object,
      country: "PK",
      isVerified: true,
    },
  });

  const response: RecipientResponse = { recipient: toPublicRecipient(row) };
  return NextResponse.json(response, { status: 201 });
}
