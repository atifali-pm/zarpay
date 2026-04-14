import Decimal from "decimal.js";
import { ComplianceRule, ComplianceSeverity } from "@prisma/client";
import { prisma } from "@/lib/db";

export interface ComplianceFlagInput {
  rule: ComplianceRule;
  severity: ComplianceSeverity;
  notes: string;
}

const SINGLE_THRESHOLD = new Decimal(process.env.AML_SINGLE_TRANSFER_GBP ?? "1000");
const DAILY_TOTAL = new Decimal(process.env.AML_DAILY_TOTAL_GBP ?? "3000");
const VELOCITY_COUNT = parseInt(process.env.AML_VELOCITY_COUNT ?? "5", 10);
const VELOCITY_HOURS = parseInt(process.env.AML_VELOCITY_WINDOW_HOURS ?? "24", 10);

// Tiny manual sanctions watchlist for the build. Production swaps in a real list.
const WATCHLIST_NAMES: string[] = ["Test Sanctioned", "Demo Watchlist Person"];

export interface RuleContext {
  senderId: string;
  amountGbp: Decimal;
  recipientFullName: string;
}

export async function evaluateRules(ctx: RuleContext): Promise<ComplianceFlagInput[]> {
  const flags: ComplianceFlagInput[] = [];

  // Rule 1: amount threshold (single transfer)
  if (ctx.amountGbp.gte(SINGLE_THRESHOLD)) {
    flags.push({
      rule: "amount_threshold",
      severity: ctx.amountGbp.gte(SINGLE_THRESHOLD.times(2)) ? "high" : "medium",
      notes: `Single transfer of £${ctx.amountGbp.toFixed(2)} crosses the £${SINGLE_THRESHOLD.toFixed(0)} review threshold.`,
    });
  }

  // Rule 2: daily aggregate
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const todaysTransfers = await prisma.transfer.findMany({
    where: {
      senderId: ctx.senderId,
      createdAt: { gte: startOfDay },
      status: { notIn: ["cancelled", "rejected"] },
    },
    select: { sendAmountGbp: true },
  });
  const dailyTotal = todaysTransfers
    .reduce((acc, t) => acc.plus(new Decimal(t.sendAmountGbp.toString())), new Decimal(0))
    .plus(ctx.amountGbp);
  if (dailyTotal.gte(DAILY_TOTAL)) {
    flags.push({
      rule: "amount_threshold",
      severity: "medium",
      notes: `Daily aggregate would reach £${dailyTotal.toFixed(2)} (limit £${DAILY_TOTAL.toFixed(0)}).`,
    });
  }

  // Rule 3: velocity
  const velocityWindow = new Date(Date.now() - VELOCITY_HOURS * 60 * 60 * 1000);
  const recentCount = await prisma.transfer.count({
    where: {
      senderId: ctx.senderId,
      createdAt: { gte: velocityWindow },
      status: { notIn: ["cancelled", "rejected"] },
    },
  });
  if (recentCount >= VELOCITY_COUNT) {
    flags.push({
      rule: "velocity",
      severity: "medium",
      notes: `${recentCount + 1} transfers in the last ${VELOCITY_HOURS}h (limit ${VELOCITY_COUNT}).`,
    });
  }

  // Rule 4: sanctions screening (manual watchlist for the build)
  const lcName = ctx.recipientFullName.trim().toLowerCase();
  const hit = WATCHLIST_NAMES.find((w) => lcName.includes(w.toLowerCase()));
  if (hit) {
    flags.push({
      rule: "sanctions_hit",
      severity: "high",
      notes: `Recipient name "${ctx.recipientFullName}" matched watchlist entry "${hit}".`,
    });
  }

  return flags;
}

export const COMPLIANCE_THRESHOLDS = {
  singleGbp: SINGLE_THRESHOLD.toString(),
  dailyGbp: DAILY_TOTAL.toString(),
  velocityCount: VELOCITY_COUNT,
  velocityWindowHours: VELOCITY_HOURS,
};
