import Decimal from "decimal.js";
import { gbp, pkr, rate } from "@/lib/money";

export interface QuoteInput {
  sendAmountGbp: Decimal.Value;
  midRate: Decimal.Value;
  spreadBps: number;
  feeGbp: Decimal.Value;
}

export interface Quote {
  sendAmountGbp: Decimal;
  midRate: Decimal;
  effectiveRate: Decimal;
  spreadBps: number;
  feeGbp: Decimal;
  receiveAmountPkr: Decimal;
  totalChargedGbp: Decimal;
}

/**
 * Apply spread by reducing the rate the customer gets (we hold the spread).
 * effectiveRate = midRate * (1 - spreadBps / 10000)
 */
export function buildQuote(input: QuoteInput): Quote {
  const sendAmount = gbp(input.sendAmountGbp);
  const midRate = rate(input.midRate);
  const fee = gbp(input.feeGbp);

  const spreadFactor = new Decimal(1).minus(new Decimal(input.spreadBps).div(10_000));
  const effectiveRate = rate(midRate.times(spreadFactor));

  const receiveAmount = pkr(sendAmount.times(effectiveRate));
  const totalCharged = gbp(sendAmount.plus(fee));

  return {
    sendAmountGbp: sendAmount,
    midRate,
    effectiveRate,
    spreadBps: input.spreadBps,
    feeGbp: fee,
    receiveAmountPkr: receiveAmount,
    totalChargedGbp: totalCharged,
  };
}

export const QUOTE_LOCK_MINUTES = 60;
