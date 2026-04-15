import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { requireBearerUser } from "@/lib/api-auth";
import { cancelTransfer } from "@/lib/transfer";
import { toTransferDetail } from "@/lib/transfer-mapper";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireBearerUser(req);
  if ("response" in auth) return auth.response;

  const existing = await prisma.transfer.findFirst({
    where: { id: params.id, senderId: auth.user.id },
  });
  if (!existing) {
    return NextResponse.json(
      { error: "Transfer not found", code: "NOT_FOUND" },
      { status: 404 },
    );
  }
  if (existing.status !== "pending_payment" && existing.status !== "quote_locked") {
    return NextResponse.json(
      { error: `Cannot cancel from status ${existing.status}`, code: "BAD_STATE" },
      { status: 409 },
    );
  }

  await cancelTransfer(existing.id, auth.user.id);

  const full = await prisma.transfer.findUniqueOrThrow({
    where: { id: existing.id },
    include: { recipient: true, events: { orderBy: { createdAt: "asc" } } },
  });
  return NextResponse.json(toTransferDetail(full));
}
