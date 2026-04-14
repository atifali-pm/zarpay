import { Prisma } from "@prisma/client";
import Decimal from "decimal.js";

Decimal.set({ precision: 30, rounding: Decimal.ROUND_HALF_EVEN });

export type Money = Decimal;

export function gbp(value: Decimal.Value): Decimal {
  return new Decimal(value).toDecimalPlaces(2);
}

export function pkr(value: Decimal.Value): Decimal {
  return new Decimal(value).toDecimalPlaces(2);
}

export function rate(value: Decimal.Value): Decimal {
  return new Decimal(value).toDecimalPlaces(6);
}

export function formatGbp(value: Decimal.Value | null | undefined, opts: { symbol?: boolean } = {}): string {
  if (value === null || value === undefined) return "·";
  const dec = new Decimal(value);
  const formatted = new Intl.NumberFormat("en-GB", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(dec.toNumber());
  return opts.symbol === false ? formatted : `£${formatted}`;
}

export function formatPkr(value: Decimal.Value | null | undefined, opts: { decimals?: 0 | 2 } = {}): string {
  if (value === null || value === undefined) return "·";
  const dec = new Decimal(value);
  const formatted = new Intl.NumberFormat("en-GB", {
    minimumFractionDigits: opts.decimals ?? 0,
    maximumFractionDigits: opts.decimals ?? 0,
  }).format(dec.toNumber());
  return `PKR ${formatted}`;
}

export function formatRate(value: Decimal.Value | null | undefined): string {
  if (value === null || value === undefined) return "·";
  const dec = new Decimal(value);
  return new Intl.NumberFormat("en-GB", {
    minimumFractionDigits: 4,
    maximumFractionDigits: 4,
  }).format(dec.toNumber());
}

// Helper to convert Prisma Decimal to plain number for client components
export function toNumber(value: Prisma.Decimal | Decimal | null | undefined): number {
  if (value === null || value === undefined) return 0;
  return new Decimal(value.toString()).toNumber();
}

// Convert Prisma Decimal to plain string (preferred for serialization)
export function toString(value: Prisma.Decimal | Decimal | null | undefined): string {
  if (value === null || value === undefined) return "0";
  return value.toString();
}
