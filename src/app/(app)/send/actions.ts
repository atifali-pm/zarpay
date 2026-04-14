"use server";

import { z } from "zod";
import Decimal from "decimal.js";
import { redirect } from "next/navigation";
import { requireKycApprovedUser } from "@/lib/auth-helpers";
import { prisma } from "@/lib/db";
import { createTransfer, markPendingPayment } from "@/lib/transfer";
import { getMidRate, getDefaultSpreadBps, getDefaultFeeGbp } from "@/lib/fx";
import { getPaymentInProvider } from "@/lib/providers/payment-in";
import { getEmailProvider, emailTemplates } from "@/lib/providers/email";
import { formatGbp } from "@/lib/money";

const sendSchema = z.object({
  recipientId: z.string().uuid(),
  amount: z.string().refine((v) => parseFloat(v) > 0, "Enter an amount > 0"),
});

export type SendState = { error?: string };

export async function startTransferAction(
  _prev: SendState,
  formData: FormData,
): Promise<SendState> {
  const user = await requireKycApprovedUser();
  const parsed = sendSchema.safeParse({
    recipientId: formData.get("recipientId"),
    amount: formData.get("amount"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const recipient = await prisma.recipient.findFirst({
    where: { id: parsed.data.recipientId, userId: user.id, deletedAt: null },
  });
  if (!recipient) return { error: "Recipient not found." };

  const fx = await getMidRate("GBP", "PKR");
  const transfer = await createTransfer({
    senderId: user.id,
    recipientId: recipient.id,
    sendAmountGbp: parsed.data.amount,
    midRate: fx.midRate.toString(),
    spreadBps: getDefaultSpreadBps(),
    feeGbp: getDefaultFeeGbp().toString(),
  });

  // Create payment intent
  const provider = getPaymentInProvider();
  const intent = await provider.createIntent({
    amountGbp: new Decimal(transfer.totalChargedGbp.toString()),
    transferReference: transfer.reference,
    description: `Zarpay transfer ${transfer.reference}`,
  });
  await markPendingPayment(transfer.id, intent.intentId);

  // Email
  const tpl = emailTemplates.transferInitiated(
    user.fullName,
    transfer.reference,
    formatGbp(transfer.sendAmountGbp.toString()).replace("£", ""),
    recipient.fullName,
  );
  await getEmailProvider().send({ to: user.email, subject: tpl.subject, body: tpl.body });

  redirect(intent.checkoutUrl);
}
