"use server";

import Decimal from "decimal.js";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth-helpers";
import { prisma } from "@/lib/db";
import { writeAudit } from "@/lib/audit";
import { getMidRate } from "@/lib/fx";
import { Prisma } from "@prisma/client";

export async function refreshRateAction(formData: FormData) {
  const admin = await requireAdmin();
  const spreadStr = (formData.get("spreadBps") as string) || "120";
  const spreadBps = parseInt(spreadStr, 10);
  const fx = await getMidRate("GBP", "PKR");

  const created = await prisma.exchangeRate.create({
    data: {
      base: "GBP",
      quote: "PKR",
      midRate: new Prisma.Decimal(fx.midRate.toString()),
      spreadBps,
      effectiveAt: new Date(),
      source: fx.source === "fallback" ? "manual" : "frankfurter",
    },
  });
  await writeAudit({
    actorId: admin.id,
    action: "rate.refresh",
    targetType: "exchange_rate",
    targetId: created.id,
    diff: { midRate: fx.midRate.toString(), spreadBps },
  });
  revalidatePath("/admin/rates");
}

export async function setManualRateAction(formData: FormData) {
  const admin = await requireAdmin();
  const midStr = formData.get("midRate") as string;
  const spreadStr = formData.get("spreadBps") as string;
  const mid = new Decimal(midStr);
  const spreadBps = parseInt(spreadStr, 10);

  const created = await prisma.exchangeRate.create({
    data: {
      base: "GBP",
      quote: "PKR",
      midRate: new Prisma.Decimal(mid.toString()),
      spreadBps,
      effectiveAt: new Date(),
      source: "manual",
    },
  });
  await writeAudit({
    actorId: admin.id,
    action: "rate.manual_set",
    targetType: "exchange_rate",
    targetId: created.id,
    diff: { midRate: mid.toString(), spreadBps },
  });
  revalidatePath("/admin/rates");
}
