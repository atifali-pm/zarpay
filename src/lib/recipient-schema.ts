import { z } from "zod";

const baseFields = {
  fullName: z.string().min(2, "Please enter the recipient's full legal name"),
  nickname: z.string().max(60).nullish(),
  relationship: z.string().max(60).nullish(),
  phone: z
    .string()
    .regex(/^\+?[0-9\s-]{7,20}$/, "Phone must be digits, optional +, spaces, and dashes")
    .nullish(),
};

export const bankRecipientSchema = z.object({
  ...baseFields,
  payoutMethod: z.literal("bank"),
  bankCode: z.string().min(1, "Pick a bank"),
  accountNumber: z.string().min(5, "Account number is too short"),
  accountTitle: z.string().min(2, "Enter the account title as it appears at the bank"),
  iban: z.string().optional(),
  branch: z.string().optional(),
});

export const walletRecipientSchema = z.object({
  ...baseFields,
  payoutMethod: z.literal("mobile_wallet"),
  walletProvider: z.enum(["easypaisa", "jazzcash", "nayapay"]),
  walletNumber: z
    .string()
    .regex(/^\+?[0-9\s-]{7,20}$/, "Enter the wallet phone number"),
});

export const cashRecipientSchema = z.object({
  ...baseFields,
  payoutMethod: z.literal("cash_pickup"),
  cashNetwork: z.enum(["western_union", "moneygram"]),
});

export const createRecipientSchema = z.discriminatedUnion("payoutMethod", [
  bankRecipientSchema,
  walletRecipientSchema,
  cashRecipientSchema,
]);

export type CreateRecipientInput = z.infer<typeof createRecipientSchema>;

export function toAccountDetails(input: CreateRecipientInput): Record<string, unknown> {
  switch (input.payoutMethod) {
    case "bank":
      return {
        bank_code: input.bankCode,
        account_number: input.accountNumber,
        account_title: input.accountTitle,
        iban: input.iban || undefined,
        branch: input.branch || undefined,
      };
    case "mobile_wallet":
      return {
        provider: input.walletProvider,
        account_number: input.walletNumber,
      };
    case "cash_pickup":
      return {
        network: input.cashNetwork,
        full_name: input.fullName,
      };
  }
}
