"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth-helpers";
import { prisma } from "@/lib/db";
import { cancelTransfer } from "@/lib/transfer";

export async function cancelTransferAction(formData: FormData) {
  const user = await requireUser();
  const id = formData.get("id") as string;
  const transfer = await prisma.transfer.findFirst({
    where: { id, senderId: user.id },
  });
  if (!transfer) return;
  if (transfer.status !== "pending_payment" && transfer.status !== "quote_locked") return;
  await cancelTransfer(transfer.id, user.id);
  revalidatePath(`/transfers/${id}`);
  revalidatePath("/transfers");
  redirect("/transfers");
}
