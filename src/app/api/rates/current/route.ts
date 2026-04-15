import { NextResponse } from "next/server";
import Decimal from "decimal.js";
import { getMidRate, getDefaultSpreadBps, getDefaultFeeGbp } from "@/lib/fx";
import { rate as toRate } from "@/lib/money";
import type { CurrentRateResponse } from "@zarpay/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const fx = await getMidRate("GBP", "PKR");
  const spreadBps = getDefaultSpreadBps();
  const spreadFactor = new Decimal(1).minus(new Decimal(spreadBps).div(10_000));
  const effectiveRate = toRate(fx.midRate.times(spreadFactor));

  const body: CurrentRateResponse = {
    base: "GBP",
    quote: "PKR",
    midRate: fx.midRate.toString(),
    spreadBps,
    effectiveRate: effectiveRate.toString(),
    feeGbp: getDefaultFeeGbp().toString(),
    source: fx.source,
    fetchedAt: fx.fetchedAt.toISOString(),
  };
  return NextResponse.json(body);
}
