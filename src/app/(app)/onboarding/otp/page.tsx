"use client";

import { useEffect, useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { sendOtpAction, verifyOtpAction, type OtpState } from "./actions";

export default function OtpPage() {
  const [challengeId, setChallengeId] = useState<string>("");
  const [sending, setSending] = useState(true);
  const [state, formAction] = useFormState<OtpState, FormData>(verifyOtpAction, {});

  useEffect(() => {
    void (async () => {
      setSending(true);
      const res = await sendOtpAction();
      if (res.challengeId) setChallengeId(res.challengeId);
      setSending(false);
    })();
  }, []);

  return (
    <div className="container-app py-12">
      <div className="mx-auto max-w-md">
        <Card>
          <CardHeader>
            <CardTitle>Verify your phone</CardTitle>
            <CardDescription>
              We sent a 6-digit code to your phone. In dev mode, any 6 digits will be accepted (try{" "}
              <span className="font-mono">123456</span>).
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form action={formAction} className="space-y-4">
              <input type="hidden" name="challengeId" value={challengeId} />
              <div>
                <Label htmlFor="code" required>
                  6-digit code
                </Label>
                <Input
                  id="code"
                  name="code"
                  inputMode="numeric"
                  pattern="\d{6}"
                  maxLength={6}
                  required
                  className="text-display-lg font-display tracking-widest text-center tabular-nums"
                  placeholder="••••••"
                />
              </div>
              {state.error && (
                <div className="rounded-lg bg-danger-100 px-3 py-2 text-caption text-danger-500">
                  {state.error}
                </div>
              )}
              <SubmitButton disabled={sending || !challengeId} />
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function SubmitButton({ disabled }: { disabled?: boolean }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" width="full" size="lg" disabled={disabled || pending}>
      {pending ? "Verifying…" : "Verify and continue"}
    </Button>
  );
}
