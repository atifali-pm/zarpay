import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { requireBearerUser } from "@/lib/api-auth";
import { markFundedAndScreen } from "@/lib/transfer";
import { toTransferDetail } from "@/lib/transfer-mapper";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Dev payment confirmation. Simulates the user completing the card
 * payment on the Stripe checkout page, then runs the AML screening via
 * markFundedAndScreen(). If the amount is below the threshold the
 * transfer moves to in_transit immediately, otherwise compliance_hold.
 *
 * Production swap: replace this endpoint with a Stripe webhook handler
 * keyed on payment_intent.succeeded.
 */
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
  if (existing.status !== "pending_payment") {
    return NextResponse.json(
      { error: `Cannot confirm payment from status ${existing.status}`, code: "BAD_STATE" },
      { status: 409 },
    );
  }

  await markFundedAndScreen(existing.id);

  const full = await prisma.transfer.findUniqueOrThrow({
    where: { id: existing.id },
    include: { recipient: true, events: { orderBy: { createdAt: "asc" } } },
  });
  return NextResponse.json(toTransferDetail(full));
}
