/**
 * One-off: add a new sender (Kashif) and a recipient (Atif) in production.
 *
 * Run:
 *   DATABASE_URL='<neon-prod-url>' tsx scripts/add-users.ts
 */
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const passwordHash = bcrypt.hashSync("password123", 10);

  const kashif = await prisma.user.upsert({
    where: { email: "kashif@zarpay.dev" },
    update: {},
    create: {
      email: "kashif@zarpay.dev",
      fullName: "Kashif Ali",
      phone: "+447700100200",
      passwordHash,
      role: "sender",
      kycStatus: "approved",
      kycTier: 1,
      country: "GB",
    },
  });
  console.log(`sender: ${kashif.email} (id ${kashif.id})`);

  // Atif as a saved recipient owned by Kashif. Bank payout, HBL.
  const existing = await prisma.recipient.findFirst({
    where: { userId: kashif.id, fullName: "Atif Ali" },
  });
  if (existing) {
    console.log(`recipient already exists: ${existing.fullName} (id ${existing.id})`);
  } else {
    const recipient = await prisma.recipient.create({
      data: {
        userId: kashif.id,
        fullName: "Atif Ali",
        nickname: "Brother",
        relationship: "Family",
        payoutMethod: "bank",
        accountDetails: {
          bank_code: "HBL",
          account_number: "12345678901234",
          account_title: "Atif Ali",
          contact_email: "atif@zarpay.dev",
        },
        phone: "+923001234567",
        isVerified: true,
      },
    });
    console.log(`recipient: ${recipient.fullName} (id ${recipient.id})`);
  }

  console.log("\nCredentials (password for all demo accounts: password123)");
  console.log("  New sender:       kashif@zarpay.dev / password123");
  console.log("  KYC reviewer:     reviewer@zarpay.dev / password123");
  console.log("  Full admin:       admin@zarpay.dev / password123");
  console.log("  Compliance:       compliance@zarpay.dev / password123");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
