import { NextResponse } from "next/server";
import { getMidRate, getDefaultSpreadBps, getDefaultFeeGbp } from "@/lib/fx";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const fx = await getMidRate("GBP", "PKR");
  return NextResponse.json({
    midRate: fx.midRate.toString(),
    spreadBps: getDefaultSpreadBps(),
    feeGbp: getDefaultFeeGbp().toString(),
    source: fx.source,
    fetchedAt: fx.fetchedAt.toISOString(),
  });
}
