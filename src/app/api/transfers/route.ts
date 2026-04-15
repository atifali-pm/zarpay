import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireBearerUser, requireKycApprovedUser } from "@/lib/api-auth";
import { createTransfer, markPendingPayment } from "@/lib/transfer";
import { getMidRate, getDefaultSpreadBps, getDefaultFeeGbp } from "@/lib/fx";
import { getPaymentInProvider } from "@/lib/providers/payment-in";
import { toTransferDetail, toTransferSummary } from "@/lib/transfer-mapper";
import Decimal from "decimal.js";
import { getEmailProvider, emailTemplates } from "@/lib/providers/email";
import { formatGbp } from "@/lib/money";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const createSchema = z.object({
  sendAmountGbp: z
    .string()
    .refine((v) => /^\d+(\.\d{1,2})?$/.test(v) && parseFloat(v) > 0, {
      message: "sendAmountGbp must be a positive GBP amount with up to 2 decimals",
    }),
  recipientId: z.string().uuid(),
});

export async function GET(req: NextRequest) {
  const auth = await requireBearerUser(req);
  if ("response" in auth) return auth.response;

  const rows = await prisma.transfer.findMany({
    where: { senderId: auth.user.id },
    orderBy: { createdAt: "desc" },
    take: 50,
    include: { recipient: true },
  });

  return NextResponse.json({
    transfers: rows.map(toTransferSummary),
  });
}

export async function POST(req: NextRequest) {
  const auth = await requireKycApprovedUser(req);
  if ("response" in auth) return auth.response;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: parsed.error.issues[0]?.message ?? "Invalid transfer request",
        code: "VALIDATION",
        details: parsed.error.flatten().fieldErrors,
      },
      { status: 400 },
    );
  }

  const recipient = await prisma.recipient.findFirst({
    where: { id: parsed.data.recipientId, userId: auth.user.id, deletedAt: null },
  });
  if (!recipient) {
    return NextResponse.json(
      { error: "Recipient not found", code: "NOT_FOUND" },
      { status: 404 },
    );
  }

  const fx = await getMidRate("GBP", "PKR");
  const transfer = await createTransfer({
    senderId: auth.user.id,
    recipientId: recipient.id,
    sendAmountGbp: parsed.data.sendAmountGbp,
    midRate: fx.midRate.toString(),
    spreadBps: getDefaultSpreadBps(),
    feeGbp: getDefaultFeeGbp().toString(),
  });

  // Create a payment intent via the provider and move the transfer into
  // pending_payment. The mobile client then calls confirm-payment to
  // simulate the user completing the payment.
  const provider = getPaymentInProvider();
  const intent = await provider.createIntent({
    amountGbp: new Decimal(transfer.totalChargedGbp.toString()),
    transferReference: transfer.reference,
    description: `Zarpay transfer ${transfer.reference}`,
  });
  await markPendingPayment(transfer.id, intent.intentId);

  // Fire an "initiated" email (dev provider logs to console)
  const tpl = emailTemplates.transferInitiated(
    auth.user.fullName,
    transfer.reference,
    formatGbp(transfer.sendAmountGbp.toString()).replace("£", ""),
    recipient.fullName,
  );
  await getEmailProvider().send({
    to: auth.user.email,
    subject: tpl.subject,
    body: tpl.body,
  });

  // Re-fetch with the new pending_payment status + initial events so the
  // client gets a complete TransferDetail to drive the pay screen.
  const full = await prisma.transfer.findUniqueOrThrow({
    where: { id: transfer.id },
    include: { recipient: true, events: { orderBy: { createdAt: "asc" } } },
  });

  return NextResponse.json(toTransferDetail(full), { status: 201 });
}
