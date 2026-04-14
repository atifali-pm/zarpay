"use client";

import { useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import Link from "next/link";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { PK_BANKS, MOBILE_WALLETS, CASH_NETWORKS } from "@/lib/constants";
import { createRecipientAction, type RecipientState } from "../actions";

type Method = "bank" | "mobile_wallet" | "cash_pickup";

export default function NewRecipientPage() {
  const [method, setMethod] = useState<Method>("bank");
  const [state, formAction] = useFormState<RecipientState, FormData>(createRecipientAction, {});

  return (
    <div className="container-app py-10">
      <div className="mx-auto max-w-2xl">
        <Link href="/recipients" className="text-caption text-text-500 hover:underline">
          ← Back to recipients
        </Link>
        <h1 className="text-display-lg font-display font-bold mt-2 mb-6">Add a recipient</h1>
        <Card>
          <CardHeader>
            <CardTitle>Recipient details</CardTitle>
          </CardHeader>
          <CardContent>
            <form action={formAction} className="space-y-5">
              <div>
                <Label htmlFor="payoutMethod" required>
                  How will they receive funds?
                </Label>
                <Select
                  id="payoutMethod"
                  name="payoutMethod"
                  value={method}
                  onChange={(e) => setMethod(e.target.value as Method)}
                >
                  <option value="bank">Bank account</option>
                  <option value="mobile_wallet">Mobile wallet</option>
                  <option value="cash_pickup">Cash pickup</option>
                </Select>
              </div>

              <div>
                <Label htmlFor="fullName" required>
                  Full legal name
                </Label>
                <Input id="fullName" name="fullName" required />
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label htmlFor="nickname">Nickname (optional)</Label>
                  <Input id="nickname" name="nickname" placeholder="Mum, Cousin Ali" />
                </div>
                <div>
                  <Label htmlFor="relationship">Relationship (optional)</Label>
                  <Input id="relationship" name="relationship" placeholder="Family, friend, business" />
                </div>
              </div>
              <div>
                <Label htmlFor="phone">Phone (for SMS notification, optional)</Label>
                <Input id="phone" name="phone" type="tel" placeholder="+923001234567" />
              </div>

              {method === "bank" && (
                <div className="space-y-4 rounded-lg border border-border bg-bg-50 p-4">
                  <h3 className="text-heading-md font-semibold">Bank details</h3>
                  <div>
                    <Label htmlFor="bankCode" required>
                      Bank
                    </Label>
                    <Select id="bankCode" name="bankCode" required defaultValue="HBL">
                      {PK_BANKS.map((b) => (
                        <option key={b.code} value={b.code}>
                          {b.name}
                        </option>
                      ))}
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="accountNumber" required>
                      Account number
                    </Label>
                    <Input id="accountNumber" name="accountNumber" required />
                  </div>
                  <div>
                    <Label htmlFor="accountTitle" required>
                      Account title (must match bank records)
                    </Label>
                    <Input id="accountTitle" name="accountTitle" required />
                  </div>
                  <div>
                    <Label htmlFor="iban">IBAN (optional)</Label>
                    <Input id="iban" name="iban" />
                  </div>
                </div>
              )}

              {method === "mobile_wallet" && (
                <div className="space-y-4 rounded-lg border border-border bg-bg-50 p-4">
                  <h3 className="text-heading-md font-semibold">Wallet details</h3>
                  <div>
                    <Label htmlFor="walletProvider" required>
                      Wallet
                    </Label>
                    <Select id="walletProvider" name="walletProvider" required defaultValue="easypaisa">
                      {MOBILE_WALLETS.map((w) => (
                        <option key={w.code} value={w.code}>
                          {w.name}
                        </option>
                      ))}
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="walletNumber" required>
                      Wallet phone number
                    </Label>
                    <Input id="walletNumber" name="walletNumber" required placeholder="03001234567" />
                  </div>
                </div>
              )}

              {method === "cash_pickup" && (
                <div className="space-y-4 rounded-lg border border-border bg-bg-50 p-4">
                  <h3 className="text-heading-md font-semibold">Cash pickup</h3>
                  <div>
                    <Label htmlFor="cashNetwork" required>
                      Pickup network
                    </Label>
                    <Select id="cashNetwork" name="cashNetwork" required defaultValue="western_union">
                      {CASH_NETWORKS.map((c) => (
                        <option key={c.code} value={c.code}>
                          {c.name}
                        </option>
                      ))}
                    </Select>
                  </div>
                  <p className="text-caption text-text-500">
                    The recipient will use the same legal name above to collect funds at any agent.
                  </p>
                </div>
              )}

              {state.error && (
                <div className="rounded-lg bg-danger-100 px-3 py-2 text-caption text-danger-500">
                  {state.error}
                </div>
              )}

              <SubmitButton />
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" width="full" size="lg" disabled={pending}>
      {pending ? "Saving…" : "Save recipient"}
    </Button>
  );
}
