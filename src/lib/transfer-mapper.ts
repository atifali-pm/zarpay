import type {
  Transfer as PrismaTransfer,
  Recipient as PrismaRecipient,
  TransferEvent as PrismaTransferEvent,
} from "@prisma/client";
import type {
  RecipientAccountDetails,
  TransferDetail,
  TransferEvent,
  TransferSummary,
} from "@zarpay/types";

export function toTransferSummary(
  row: PrismaTransfer & { recipient: PrismaRecipient },
): TransferSummary {
  return {
    id: row.id,
    reference: row.reference,
    status: row.status,
    sendAmountGbp: row.sendAmountGbp.toString(),
    receiveAmountPkr: row.receiveAmountPkr.toString(),
    feeGbp: row.feeGbp.toString(),
    totalChargedGbp: row.totalChargedGbp.toString(),
    recipientName: row.recipient.fullName,
    recipientPayoutMethod: row.recipient.payoutMethod,
    createdAt: row.createdAt.toISOString(),
  };
}

export function toTransferDetail(
  row: PrismaTransfer & {
    recipient: PrismaRecipient;
    events: PrismaTransferEvent[];
  },
): TransferDetail {
  const events: TransferEvent[] = row.events.map((e) => ({
    id: e.id,
    eventType: e.eventType,
    fromStatus: e.fromStatus,
    toStatus: e.toStatus,
    actorType: e.actorType,
    createdAt: e.createdAt.toISOString(),
  }));

  return {
    id: row.id,
    reference: row.reference,
    status: row.status,
    sendAmountGbp: row.sendAmountGbp.toString(),
    receiveAmountPkr: row.receiveAmountPkr.toString(),
    exchangeRate: row.exchangeRate.toString(),
    spreadBps: row.spreadBps,
    feeGbp: row.feeGbp.toString(),
    totalChargedGbp: row.totalChargedGbp.toString(),
    paymentIntentId: row.paymentIntentId,
    payoutReference: row.payoutReference,
    quoteLockedUntil: row.quoteLockedUntil.toISOString(),
    initiatedAt: row.initiatedAt?.toISOString() ?? null,
    fundedAt: row.fundedAt?.toISOString() ?? null,
    inTransitAt: row.inTransitAt?.toISOString() ?? null,
    deliveredAt: row.deliveredAt?.toISOString() ?? null,
    createdAt: row.createdAt.toISOString(),
    recipient: {
      id: row.recipient.id,
      fullName: row.recipient.fullName,
      payoutMethod: row.recipient.payoutMethod,
      accountDetails: row.recipient.accountDetails as unknown as RecipientAccountDetails,
    },
    events,
  };
}
