"use client";

import { useEffect, useMemo, useState } from "react";
import Decimal from "decimal.js";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { buildQuote } from "@/lib/quote";
import { formatGbp, formatPkr, formatRate } from "@/lib/money";

interface CalculatorRateData {
  midRate: string;
  spreadBps: number;
  feeGbp: string;
  source: string;
  fetchedAt: string;
}

export function RateCalculator({ initialRate }: { initialRate: CalculatorRateData }) {
  const [amount, setAmount] = useState("500");
  const [rateData, setRateData] = useState(initialRate);
  const [loading, setLoading] = useState(false);

  const refresh = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/quote/rate", { cache: "no-store" });
      if (res.ok) {
        const data = (await res.json()) as CalculatorRateData;
        setRateData(data);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const id = setInterval(refresh, 60_000);
    return () => clearInterval(id);
  }, []);

  const quote = useMemo(() => {
    const value = parseFloat(amount.replace(/,/g, ""));
    if (Number.isNaN(value) || value <= 0) return null;
    return buildQuote({
      sendAmountGbp: value,
      midRate: rateData.midRate,
      spreadBps: rateData.spreadBps,
      feeGbp: rateData.feeGbp,
    });
  }, [amount, rateData]);

  return (
    <Card className="p-6 md:p-8 shadow-md">
      <div className="space-y-5">
        <div>
          <label htmlFor="send-amount" className="block text-caption font-medium text-text-500">
            You send
          </label>
          <div className="mt-2 flex items-center gap-3 rounded-lg border border-border-strong bg-white px-4 py-3 focus-within:ring-2 focus-within:ring-primary-700 focus-within:ring-offset-1">
            <span className="text-display-lg font-display font-semibold text-text-900">£</span>
            <Input
              id="send-amount"
              type="text"
              inputMode="decimal"
              value={amount}
              onChange={(e) => setAmount(e.target.value.replace(/[^\d.]/g, ""))}
              className="border-0 px-0 text-display-lg font-display font-semibold tabular-nums focus-visible:ring-0 focus-visible:ring-offset-0 h-auto"
              placeholder="500"
            />
            <span className="text-body font-medium text-text-500">GBP</span>
          </div>
        </div>

        <div className="border-t border-border" />

        <div>
          <span className="block text-caption font-medium text-text-500">Recipient gets</span>
          <div className="mt-2 flex items-baseline gap-3 px-1">
            <span className="text-display-2xl font-display font-bold tabular-nums text-primary-900">
              {quote ? formatPkr(quote.receiveAmountPkr).replace("PKR ", "") : "·"}
            </span>
            <span className="text-body font-medium text-text-500">PKR</span>
          </div>
        </div>

        {quote && (
          <div className="rounded-lg bg-bg-50 p-4 space-y-2 text-caption tabular-nums">
            <Row label="Mid-market rate" value={`1 GBP = ${formatRate(quote.midRate)} PKR`} />
            <Row
              label={`Our rate (spread ${(rateData.spreadBps / 100).toFixed(2)}%)`}
              value={`1 GBP = ${formatRate(quote.effectiveRate)} PKR`}
            />
            <Row label="You send" value={formatGbp(quote.sendAmountGbp)} />
            <Row label="Fee" value={formatGbp(quote.feeGbp)} />
            <div className="border-t border-border pt-2">
              <Row label="Total to pay" value={formatGbp(quote.totalChargedGbp)} bold />
            </div>
          </div>
        )}

        <div className="flex flex-col gap-2 pt-1">
          <Button asChild size="lg" width="full">
            <Link href="/signup">Sign up to send</Link>
          </Button>
          <p className="text-center text-micro text-text-500">
            Rate from {rateData.source}
            {loading ? " · refreshing…" : ""}. Quote will be locked for 60 minutes once you start a
            transfer.
          </p>
        </div>
      </div>
    </Card>
  );
}

function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-text-500">{label}</span>
      <span className={bold ? "font-semibold text-text-900" : "text-text-700"}>{value}</span>
    </div>
  );
}
