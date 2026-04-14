"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth-helpers";
import { prisma } from "@/lib/db";

const baseSchema = z.object({
  fullName: z.string().min(2),
  nickname: z.string().optional().nullable(),
  relationship: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  payoutMethod: z.enum(["bank", "mobile_wallet", "cash_pickup"]),
});

const bankSchema = baseSchema.extend({
  bankCode: z.string().min(1),
  accountNumber: z.string().min(5),
  accountTitle: z.string().min(2),
  iban: z.string().optional().nullable(),
});

const walletSchema = baseSchema.extend({
  walletProvider: z.enum(["easypaisa", "jazzcash", "nayapay"]),
  walletNumber: z.string().min(7),
});

const cashSchema = baseSchema.extend({
  cashNetwork: z.enum(["western_union", "moneygram"]),
});

export type RecipientState = { error?: string };

export async function createRecipientAction(
  _prev: RecipientState,
  formData: FormData,
): Promise<RecipientState> {
  const user = await requireUser();
  const payoutMethod = formData.get("payoutMethod") as string;

  let accountDetails: Record<string, unknown> = {};
  let parsed: z.SafeParseReturnType<unknown, unknown>;

  if (payoutMethod === "bank") {
    parsed = bankSchema.safeParse(Object.fromEntries(formData));
    if (parsed.success) {
      const d = parsed.data as z.infer<typeof bankSchema>;
      accountDetails = {
        bank_code: d.bankCode,
        account_number: d.accountNumber,
        account_title: d.accountTitle,
        iban: d.iban || undefined,
      };
    }
  } else if (payoutMethod === "mobile_wallet") {
    parsed = walletSchema.safeParse(Object.fromEntries(formData));
    if (parsed.success) {
      const d = parsed.data as z.infer<typeof walletSchema>;
      accountDetails = { provider: d.walletProvider, account_number: d.walletNumber };
    }
  } else if (payoutMethod === "cash_pickup") {
    parsed = cashSchema.safeParse(Object.fromEntries(formData));
    if (parsed.success) {
      const d = parsed.data as z.infer<typeof cashSchema>;
      accountDetails = { network: d.cashNetwork, full_name: d.fullName };
    }
  } else {
    return { error: "Pick a payout method." };
  }

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Please complete all required fields." };
  }

  const data = parsed.data as z.infer<typeof baseSchema>;

  await prisma.recipient.create({
    data: {
      userId: user.id,
      fullName: data.fullName,
      nickname: data.nickname || null,
      relationship: data.relationship || null,
      phone: data.phone || null,
      payoutMethod: data.payoutMethod,
      accountDetails: accountDetails as object,
      country: "PK",
    },
  });
  revalidatePath("/recipients");
  redirect("/recipients");
}

export async function deleteRecipientAction(formData: FormData) {
  const user = await requireUser();
  const id = formData.get("id") as string;
  if (!id) return;
  const recipient = await prisma.recipient.findFirst({ where: { id, userId: user.id } });
  if (!recipient) return;
  await prisma.recipient.update({ where: { id }, data: { deletedAt: new Date() } });
  revalidatePath("/recipients");
}
