import Decimal from "decimal.js";
import { rate as toRate } from "@/lib/money";

const TTL_SECONDS = parseInt(process.env.FX_CACHE_TTL_SECONDS ?? "300", 10);
const DEFAULT_FALLBACK_RATE = "365.42"; // sensible GBP/PKR fallback if API down

type CacheEntry = { value: Decimal; expiresAt: number };
const cache = new Map<string, CacheEntry>();

export interface FxQuote {
  base: string;
  quote: string;
  midRate: Decimal;
  source: "frankfurter" | "exchangerate-host" | "fallback";
  fetchedAt: Date;
}

async function fetchFromFrankfurter(base: string, quote: string): Promise<Decimal> {
  const url = `https://api.frankfurter.app/latest?from=${base}&to=${quote}`;
  const res = await fetch(url, { next: { revalidate: TTL_SECONDS } });
  if (!res.ok) throw new Error(`frankfurter ${res.status}`);
  const data = (await res.json()) as { rates: Record<string, number> };
  const value = data.rates?.[quote];
  if (!value || typeof value !== "number") throw new Error("frankfurter: no rate");
  return new Decimal(value);
}

export async function getMidRate(base = "GBP", quote = "PKR"): Promise<FxQuote> {
  const key = `${base}/${quote}`;
  const cached = cache.get(key);
  if (cached && cached.expiresAt > Date.now()) {
    return {
      base,
      quote,
      midRate: cached.value,
      source: "frankfurter",
      fetchedAt: new Date(),
    };
  }

  try {
    const value = await fetchFromFrankfurter(base, quote);
    cache.set(key, { value, expiresAt: Date.now() + TTL_SECONDS * 1000 });
    return { base, quote, midRate: toRate(value), source: "frankfurter", fetchedAt: new Date() };
  } catch {
    const fallback = toRate(DEFAULT_FALLBACK_RATE);
    cache.set(key, { value: fallback, expiresAt: Date.now() + 60_000 });
    return { base, quote, midRate: fallback, source: "fallback", fetchedAt: new Date() };
  }
}

export function getDefaultSpreadBps(): number {
  return parseInt(process.env.FX_SPREAD_BPS ?? "120", 10);
}

export function getDefaultFeeGbp(): Decimal {
  return new Decimal(process.env.FEE_FIXED_GBP ?? "1.99");
}
