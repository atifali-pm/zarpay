import Decimal from "decimal.js";
import { Prisma, TransferStatus, ActorType, TransferEventType } from "@prisma/client";
import { prisma } from "@/lib/db";
import { generateTransferReference } from "@/lib/reference";
import { buildQuote, QUOTE_LOCK_MINUTES } from "@/lib/quote";
import { assertTransition } from "@/lib/transfer-state";
import { evaluateRules } from "@/lib/compliance/rules";
import { getEmailProvider, emailTemplates } from "@/lib/providers/email";
import { getSmsProvider, smsTemplates } from "@/lib/providers/sms";
import { getPayoutProvider } from "@/lib/providers/payout";
import { formatGbp, formatPkr } from "@/lib/money";

interface CreateTransferArgs {
  senderId: string;
  recipientId: string;
  sendAmountGbp: Decimal.Value;
  midRate: Decimal.Value;
  spreadBps: number;
  feeGbp: Decimal.Value;
}

export async function createTransfer(args: CreateTransferArgs) {
  const quote = buildQuote({
    sendAmountGbp: args.sendAmountGbp,
    midRate: args.midRate,
    spreadBps: args.spreadBps,
    feeGbp: args.feeGbp,
  });

  const reference = generateTransferReference();
  const lockedUntil = new Date(Date.now() + QUOTE_LOCK_MINUTES * 60 * 1000);

  const transfer = await prisma.$transaction(async (tx) => {
    const t = await tx.transfer.create({
      data: {
        reference,
        senderId: args.senderId,
        recipientId: args.recipientId,
        sendAmountGbp: new Prisma.Decimal(quote.sendAmountGbp.toString()),
        receiveAmountPkr: new Prisma.Decimal(quote.receiveAmountPkr.toString()),
        exchangeRate: new Prisma.Decimal(quote.effectiveRate.toString()),
        spreadBps: quote.spreadBps,
        feeGbp: new Prisma.Decimal(quote.feeGbp.toString()),
        totalChargedGbp: new Prisma.Decimal(quote.totalChargedGbp.toString()),
        status: "quote_locked",
        quoteLockedUntil: lockedUntil,
        initiatedAt: new Date(),
      },
    });
    await tx.transferEvent.create({
      data: {
        transferId: t.id,
        eventType: "quote_created",
        toStatus: "quote_locked",
        actorType: "sender",
        actorId: args.senderId,
        payload: {
          midRate: quote.midRate.toString(),
          effectiveRate: quote.effectiveRate.toString(),
          spreadBps: quote.spreadBps,
        },
      },
    });
    return t;
  });

  return transfer;
}

interface AdvanceArgs {
  transferId: string;
  to: TransferStatus;
  actorType: ActorType;
  actorId?: string | null;
  eventType: TransferEventType;
  payload?: Record<string, unknown>;
  patch?: Prisma.TransferUpdateInput;
}

export async function advanceTransfer(args: AdvanceArgs) {
  return prisma.$transaction(async (tx) => {
    const transfer = await tx.transfer.findUniqueOrThrow({ where: { id: args.transferId } });
    assertTransition(transfer.status, args.to);
    const updated = await tx.transfer.update({
      where: { id: args.transferId },
      data: { status: args.to, ...args.patch },
    });
    await tx.transferEvent.create({
      data: {
        transferId: args.transferId,
        eventType: args.eventType,
        fromStatus: transfer.status,
        toStatus: args.to,
        actorType: args.actorType,
        actorId: args.actorId ?? null,
        payload: (args.payload ?? {}) as object,
      },
    });
    return updated;
  });
}

export async function markPendingPayment(transferId: string, intentId: string) {
  return advanceTransfer({
    transferId,
    to: "pending_payment",
    eventType: "payment_initiated",
    actorType: "sender",
    payload: { intentId },
    patch: { paymentIntentId: intentId },
  });
}

export async function markFundedAndScreen(transferId: string) {
  // 1. Move to funded
  await advanceTransfer({
    transferId,
    to: "funded",
    eventType: "payment_funded",
    actorType: "system",
    patch: { fundedAt: new Date() },
  });

  // 2. Screen the transfer
  const t = await prisma.transfer.findUniqueOrThrow({
    where: { id: transferId },
    include: { recipient: true, sender: true },
  });
  const flags = await evaluateRules({
    senderId: t.senderId,
    amountGbp: new Decimal(t.sendAmountGbp.toString()),
    recipientFullName: t.recipient.fullName,
  });

  if (flags.length > 0) {
    await prisma.complianceFlag.createMany({
      data: flags.map((f) => ({
        transferId: t.id,
        rule: f.rule,
        severity: f.severity,
        notes: f.notes,
      })),
    });
    await advanceTransfer({
      transferId: t.id,
      to: "compliance_hold",
      eventType: "compliance_flagged",
      actorType: "system",
      payload: { flagCount: flags.length },
    });
    // Email sender
    const tpl = emailTemplates.transferFunded(t.sender.fullName, t.reference);
    await getEmailProvider().send({ to: t.sender.email, subject: tpl.subject, body: tpl.body });
    return { funded: true, hold: true };
  }

  // 3. No flags: instruct payout immediately
  const recipient = await prisma.recipient.findUniqueOrThrow({ where: { id: t.recipientId } });
  const payout = getPayoutProvider();
  const result = await payout.instruct({
    amountPkr: new Decimal(t.receiveAmountPkr.toString()),
    transferReference: t.reference,
    method: recipient.payoutMethod,
    accountDetails: recipient.accountDetails as Record<string, unknown>,
  });
  await advanceTransfer({
    transferId: t.id,
    to: "in_transit",
    eventType: "released_to_payout",
    actorType: "system",
    payload: { payoutReference: result.payoutReference },
    patch: { payoutReference: result.payoutReference, inTransitAt: new Date() },
  });
  // Email
  const fundedTpl = emailTemplates.transferFunded(t.sender.fullName, t.reference);
  await getEmailProvider().send({
    to: t.sender.email,
    subject: fundedTpl.subject,
    body: fundedTpl.body,
  });
  const transitTpl = emailTemplates.transferInTransit(t.sender.fullName, t.reference);
  await getEmailProvider().send({
    to: t.sender.email,
    subject: transitTpl.subject,
    body: transitTpl.body,
  });
  return { funded: true, hold: false };
}

export async function markDelivered(transferId: string, actorId?: string | null) {
  const t = await prisma.transfer.findUniqueOrThrow({
    where: { id: transferId },
    include: { recipient: true, sender: true },
  });
  await advanceTransfer({
    transferId: t.id,
    to: "delivered",
    eventType: "payout_delivered",
    actorType: actorId ? "admin" : "system",
    actorId,
    patch: { deliveredAt: new Date() },
  });
  const tpl = emailTemplates.transferDelivered(
    t.sender.fullName,
    t.reference,
    t.recipient.fullName,
    formatPkr(t.receiveAmountPkr.toString()).replace("PKR ", ""),
  );
  await getEmailProvider().send({ to: t.sender.email, subject: tpl.subject, body: tpl.body });

  if (t.recipient.phone) {
    const sms = smsTemplates.delivered(
      t.recipient.fullName,
      formatPkr(t.receiveAmountPkr.toString()).replace("PKR ", ""),
    );
    await getSmsProvider().send({ to: t.recipient.phone, body: `${sms.en}\n${sms.ur}` });
  }
}

export async function clearComplianceAndRelease(
  transferId: string,
  actorId: string,
  flagId: string,
) {
  await prisma.complianceFlag.update({
    where: { id: flagId },
    data: { status: "cleared", reviewedById: actorId, reviewedAt: new Date() },
  });
  // If all flags are cleared, release
  const open = await prisma.complianceFlag.count({
    where: { transferId, status: "open" },
  });
  if (open > 0) return { released: false };

  const t = await prisma.transfer.findUniqueOrThrow({
    where: { id: transferId },
    include: { recipient: true, sender: true },
  });
  const payout = getPayoutProvider();
  const result = await payout.instruct({
    amountPkr: new Decimal(t.receiveAmountPkr.toString()),
    transferReference: t.reference,
    method: t.recipient.payoutMethod,
    accountDetails: t.recipient.accountDetails as Record<string, unknown>,
  });
  await advanceTransfer({
    transferId: t.id,
    to: "in_transit",
    eventType: "released_to_payout",
    actorType: "admin",
    actorId,
    payload: { payoutReference: result.payoutReference, manuallyReleased: true },
    patch: { payoutReference: result.payoutReference, inTransitAt: new Date() },
  });
  const tpl = emailTemplates.transferInTransit(t.sender.fullName, t.reference);
  await getEmailProvider().send({ to: t.sender.email, subject: tpl.subject, body: tpl.body });
  return { released: true };
}

export async function rejectFromCompliance(transferId: string, actorId: string, reason: string) {
  await advanceTransfer({
    transferId,
    to: "rejected",
    eventType: "manual_state_change",
    actorType: "admin",
    actorId,
    payload: { reason },
  });
}

export async function cancelTransfer(transferId: string, senderId: string) {
  return advanceTransfer({
    transferId,
    to: "cancelled",
    eventType: "payment_cancelled",
    actorType: "sender",
    actorId: senderId,
  });
}

export function isExpired(transferId: { quoteLockedUntil: Date }): boolean {
  return transferId.quoteLockedUntil.getTime() < Date.now();
}

export function summarize(t: {
  sendAmountGbp: Prisma.Decimal | string;
  receiveAmountPkr: Prisma.Decimal | string;
  feeGbp: Prisma.Decimal | string;
  totalChargedGbp: Prisma.Decimal | string;
  exchangeRate: Prisma.Decimal | string;
}) {
  return {
    sendAmount: formatGbp(t.sendAmountGbp.toString()),
    receiveAmount: formatPkr(t.receiveAmountPkr.toString()),
    fee: formatGbp(t.feeGbp.toString()),
    total: formatGbp(t.totalChargedGbp.toString()),
    rate: t.exchangeRate.toString(),
  };
}
