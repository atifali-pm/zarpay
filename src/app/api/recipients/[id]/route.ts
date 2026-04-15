import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { requireBearerUser } from "@/lib/api-auth";
import { toPublicRecipient } from "@/lib/recipient-mapper";
import { createRecipientSchema, toAccountDetails } from "@/lib/recipient-schema";
import type { RecipientResponse } from "@zarpay/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function loadOwnedRecipient(userId: string, id: string) {
  return prisma.recipient.findFirst({
    where: { id, userId, deletedAt: null },
  });
}

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireBearerUser(req);
  if ("response" in auth) return auth.response;

  const row = await loadOwnedRecipient(auth.user.id, params.id);
  if (!row) {
    return NextResponse.json({ error: "Recipient not found", code: "NOT_FOUND" }, { status: 404 });
  }
  const body: RecipientResponse = { recipient: toPublicRecipient(row) };
  return NextResponse.json(body);
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireBearerUser(req);
  if ("response" in auth) return auth.response;

  const existing = await loadOwnedRecipient(auth.user.id, params.id);
  if (!existing) {
    return NextResponse.json({ error: "Recipient not found", code: "NOT_FOUND" }, { status: 404 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  // Require a full body with the payoutMethod so the schema can discriminate.
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
  const row = await prisma.recipient.update({
    where: { id: existing.id },
    data: {
      fullName: data.fullName,
      nickname: data.nickname || null,
      relationship: data.relationship || null,
      phone: data.phone || null,
      payoutMethod: data.payoutMethod,
      accountDetails: toAccountDetails(data) as object,
    },
  });

  const response: RecipientResponse = { recipient: toPublicRecipient(row) };
  return NextResponse.json(response);
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireBearerUser(req);
  if ("response" in auth) return auth.response;

  const existing = await loadOwnedRecipient(auth.user.id, params.id);
  if (!existing) {
    return NextResponse.json({ error: "Recipient not found", code: "NOT_FOUND" }, { status: 404 });
  }

  await prisma.recipient.update({
    where: { id: existing.id },
    data: { deletedAt: new Date() },
  });

  return NextResponse.json({ ok: true });
}
