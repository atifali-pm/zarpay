"use client";

import { useMemo, useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { buildQuote } from "@/lib/quote";
import { formatGbp, formatPkr, formatRate } from "@/lib/money";
import { startTransferAction, type SendState } from "./actions";

interface RecipientLite {
  id: string;
  fullName: string;
  nickname: string | null;
  payoutMethod: "bank" | "mobile_wallet" | "cash_pickup";
  accountDetails: Record<string, unknown>;
}

interface RateData {
  midRate: string;
  spreadBps: number;
  feeGbp: string;
  source: string;
}

export function SendForm({
  recipients,
  initialRecipientId,
  rate,
}: {
  recipients: RecipientLite[];
  initialRecipientId: string;
  rate: RateData;
}) {
  const [amount, setAmount] = useState("500");
  const [recipientId, setRecipientId] = useState(initialRecipientId);
  const [state, formAction] = useFormState<SendState, FormData>(startTransferAction, {});

  const recipient = recipients.find((r) => r.id === recipientId);

  const quote = useMemo(() => {
    const value = parseFloat(amount.replace(/,/g, ""));
    if (Number.isNaN(value) || value <= 0) return null;
    return buildQuote({
      sendAmountGbp: value,
      midRate: rate.midRate,
      spreadBps: rate.spreadBps,
      feeGbp: rate.feeGbp,
    });
  }, [amount, rate]);

  return (
    <form action={formAction} className="space-y-6">
      {/* Section 1: Amount */}
      <Card>
        <CardContent className="pt-6 space-y-5">
          <h3 className="text-heading-lg font-semibold">1. How much?</h3>
          <div>
            <Label htmlFor="amount">You send</Label>
            <div className="flex items-center gap-3 rounded-lg border border-border-strong bg-white px-4 py-3 focus-within:ring-2 focus-within:ring-primary-700">
              <span className="text-display-lg font-display font-semibold">£</span>
              <Input
                id="amount"
                name="amount"
                value={amount}
                onChange={(e) => setAmount(e.target.value.replace(/[^\d.]/g, ""))}
                inputMode="decimal"
                className="border-0 px-0 text-display-lg font-display font-semibold tabular-nums focus-visible:ring-0 h-auto"
                placeholder="500"
                required
              />
              <span className="text-body font-medium text-text-500">GBP</span>
            </div>
          </div>
          {quote && (
            <div>
              <Label>Recipient gets</Label>
              <div className="flex items-baseline gap-2 px-1">
                <span className="text-display-2xl font-display font-bold tabular-nums text-primary-900">
                  {formatPkr(quote.receiveAmountPkr).replace("PKR ", "")}
                </span>
                <span className="text-body font-medium text-text-500">PKR</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Section 2: Recipient */}
      <Card>
        <CardContent className="pt-6 space-y-4">
          <h3 className="text-heading-lg font-semibold">2. Who's receiving?</h3>
          <div>
            <Label htmlFor="recipientId" required>
              Recipient
            </Label>
            <Select
              id="recipientId"
              name="recipientId"
              value={recipientId}
              onChange={(e) => setRecipientId(e.target.value)}
              required
            >
              {recipients.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.fullName}
                  {r.nickname ? ` (${r.nickname})` : ""} · {labelFor(r.payoutMethod)}
                </option>
              ))}
            </Select>
          </div>
          {recipient && (
            <RecipientSummary recipient={recipient} />
          )}
        </CardContent>
      </Card>

      {/* Section 3: Review */}
      <Card>
        <CardContent className="pt-6 space-y-4">
          <h3 className="text-heading-lg font-semibold">3. Review</h3>
          {quote && (
            <div className="rounded-lg bg-bg-50 p-4 space-y-2 text-body tabular-nums">
              <Row label="Mid-market rate" value={`1 GBP = ${formatRate(quote.midRate)} PKR`} />
              <Row
                label={`Our rate (spread ${(rate.spreadBps / 100).toFixed(2)}%)`}
                value={`1 GBP = ${formatRate(quote.effectiveRate)} PKR`}
              />
              <Row label="You send" value={formatGbp(quote.sendAmountGbp)} />
              <Row label="Fee" value={formatGbp(quote.feeGbp)} />
              <div className="border-t border-border pt-2">
                <Row label="Total to pay" value={formatGbp(quote.totalChargedGbp)} bold />
                <Row label="Recipient gets" value={formatPkr(quote.receiveAmountPkr)} bold />
              </div>
            </div>
          )}
          {state.error && (
            <div className="rounded-lg bg-danger-100 px-3 py-2 text-caption text-danger-500">
              {state.error}
            </div>
          )}
          <SubmitButton />
          <p className="text-micro text-text-500 text-center">
            Quote will be locked for 60 minutes. Rate from {rate.source}.
          </p>
        </CardContent>
      </Card>
    </form>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" width="full" size="lg" disabled={pending}>
      {pending ? "Locking quote…" : "Continue to payment"}
    </Button>
  );
}

function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className="flex items-center justify-between text-caption">
      <span className="text-text-500">{label}</span>
      <span className={bold ? "font-semibold text-text-900 text-body" : "text-text-700"}>
        {value}
      </span>
    </div>
  );
}

function RecipientSummary({ recipient }: { recipient: RecipientLite }) {
  const d = recipient.accountDetails as Record<string, string>;
  return (
    <div className="rounded-lg border border-border bg-bg-50 p-4 text-caption space-y-1">
      <div className="text-text-900 font-semibold">{recipient.fullName}</div>
      {recipient.payoutMethod === "bank" && (
        <div className="text-text-500">
          {d.bank_code} · {d.account_number}
        </div>
      )}
      {recipient.payoutMethod === "mobile_wallet" && (
        <div className="text-text-500">
          {d.provider} · {d.account_number}
        </div>
      )}
      {recipient.payoutMethod === "cash_pickup" && (
        <div className="text-text-500">{d.network} · cash pickup</div>
      )}
    </div>
  );
}

function labelFor(method: "bank" | "mobile_wallet" | "cash_pickup"): string {
  if (method === "bank") return "Bank";
  if (method === "mobile_wallet") return "Wallet";
  return "Cash pickup";
}
