import type { Recipient as PrismaRecipient } from "@prisma/client";
import type { Recipient, RecipientAccountDetails } from "@zarpay/types";

/**
 * Convert a Prisma Recipient row into the Recipient DTO the client sees.
 * Strips internal fields (userId, deletedAt, updatedAt) and casts the
 * jsonb account_details into the typed discriminated union.
 */
export function toPublicRecipient(row: PrismaRecipient): Recipient {
  return {
    id: row.id,
    fullName: row.fullName,
    nickname: row.nickname,
    relationship: row.relationship,
    phone: row.phone,
    country: row.country,
    payoutMethod: row.payoutMethod,
    accountDetails: row.accountDetails as unknown as RecipientAccountDetails,
    isVerified: row.isVerified,
    createdAt: row.createdAt.toISOString(),
  };
}
