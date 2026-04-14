"use server";

import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth-helpers";
import { prisma } from "@/lib/db";
import { markFundedAndScreen } from "@/lib/transfer";

export async function confirmDevPayment(formData: FormData) {
  const user = await requireUser();
  const intentId = formData.get("intentId") as string;
  if (!intentId) return;
  const transfer = await prisma.transfer.findFirst({
    where: { paymentIntentId: intentId, senderId: user.id },
  });
  if (!transfer) return;
  if (transfer.status !== "pending_payment") {
    redirect(`/transfers/${transfer.id}`);
  }
  await markFundedAndScreen(transfer.id);
  redirect(`/transfers/${transfer.id}`);
}

export async function declineDevPayment(formData: FormData) {
  const user = await requireUser();
  const intentId = formData.get("intentId") as string;
  if (!intentId) return;
  const transfer = await prisma.transfer.findFirst({
    where: { paymentIntentId: intentId, senderId: user.id },
  });
  if (!transfer) return;
  redirect(`/transfers/${transfer.id}`);
}
