import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { requireBearerUser } from "@/lib/api-auth";
import type {
  TransferDetail,
  RecipientAccountDetails,
  TransferEvent as TransferEventDto,
} from "@zarpay/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireBearerUser(req);
  if ("response" in auth) return auth.response;

  const transfer = await prisma.transfer.findFirst({
    where: { id: params.id, senderId: auth.user.id },
    include: {
      recipient: true,
      events: { orderBy: { createdAt: "asc" } },
    },
  });
  if (!transfer) {
    return NextResponse.json(
      { error: "Transfer not found", code: "NOT_FOUND" },
      { status: 404 },
    );
  }

  const events: TransferEventDto[] = transfer.events.map((e) => ({
    id: e.id,
    eventType: e.eventType,
    fromStatus: e.fromStatus,
    toStatus: e.toStatus,
    actorType: e.actorType,
    createdAt: e.createdAt.toISOString(),
  }));

  const response: TransferDetail = {
    id: transfer.id,
    reference: transfer.reference,
    status: transfer.status,
    sendAmountGbp: transfer.sendAmountGbp.toString(),
    receiveAmountPkr: transfer.receiveAmountPkr.toString(),
    exchangeRate: transfer.exchangeRate.toString(),
    spreadBps: transfer.spreadBps,
    feeGbp: transfer.feeGbp.toString(),
    totalChargedGbp: transfer.totalChargedGbp.toString(),
    paymentIntentId: transfer.paymentIntentId,
    payoutReference: transfer.payoutReference,
    quoteLockedUntil: transfer.quoteLockedUntil.toISOString(),
    initiatedAt: transfer.initiatedAt?.toISOString() ?? null,
    fundedAt: transfer.fundedAt?.toISOString() ?? null,
    inTransitAt: transfer.inTransitAt?.toISOString() ?? null,
    deliveredAt: transfer.deliveredAt?.toISOString() ?? null,
    createdAt: transfer.createdAt.toISOString(),
    recipient: {
      id: transfer.recipient.id,
      fullName: transfer.recipient.fullName,
      payoutMethod: transfer.recipient.payoutMethod,
      accountDetails: transfer.recipient.accountDetails as unknown as RecipientAccountDetails,
    },
    events,
  };
  return NextResponse.json(response);
}
