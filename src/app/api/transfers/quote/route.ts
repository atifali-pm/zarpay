import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireKycApprovedUser } from "@/lib/api-auth";
import { buildQuote } from "@/lib/quote";
import { getMidRate, getDefaultSpreadBps, getDefaultFeeGbp } from "@/lib/fx";
import type { QuoteResponse } from "@zarpay/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const schema = z.object({
  sendAmountGbp: z
    .string()
    .refine((v) => /^\d+(\.\d{1,2})?$/.test(v) && parseFloat(v) > 0, {
      message: "sendAmountGbp must be a positive GBP amount with up to 2 decimals",
    }),
  recipientId: z.string().uuid(),
});

export async function POST(req: NextRequest) {
  const auth = await requireKycApprovedUser(req);
  if ("response" in auth) return auth.response;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Invalid quote request",
        code: "VALIDATION",
        details: parsed.error.flatten().fieldErrors,
      },
      { status: 400 },
    );
  }

  const recipient = await prisma.recipient.findFirst({
    where: {
      id: parsed.data.recipientId,
      userId: auth.user.id,
      deletedAt: null,
    },
  });
  if (!recipient) {
    return NextResponse.json(
      { error: "Recipient not found", code: "NOT_FOUND" },
      { status: 404 },
    );
  }

  const fx = await getMidRate("GBP", "PKR");
  const quote = buildQuote({
    sendAmountGbp: parsed.data.sendAmountGbp,
    midRate: fx.midRate.toString(),
    spreadBps: getDefaultSpreadBps(),
    feeGbp: getDefaultFeeGbp().toString(),
  });

  const response: QuoteResponse = {
    sendAmountGbp: quote.sendAmountGbp.toString(),
    midRate: quote.midRate.toString(),
    effectiveRate: quote.effectiveRate.toString(),
    spreadBps: quote.spreadBps,
    feeGbp: quote.feeGbp.toString(),
    receiveAmountPkr: quote.receiveAmountPkr.toString(),
    totalChargedGbp: quote.totalChargedGbp.toString(),
  };
  return NextResponse.json(response);
}
