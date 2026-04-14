"use client";

import Link from "next/link";
import { useFormState, useFormStatus } from "react-dom";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { loginAction, type LoginState } from "./actions";

export default function LoginPage() {
  const [state, formAction] = useFormState<LoginState, FormData>(loginAction, {});

  return (
    <div className="container-marketing py-16">
      <div className="mx-auto max-w-md">
        <Card>
          <CardHeader>
            <CardTitle>Log in to Zarpay</CardTitle>
            <CardDescription>
              No account?{" "}
              <Link href="/signup" className="text-primary-700 hover:underline">
                Sign up
              </Link>
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form action={formAction} className="space-y-4">
              <div>
                <Label htmlFor="email" required>
                  Email
                </Label>
                <Input id="email" name="email" type="email" required autoComplete="email" />
              </div>
              <div>
                <Label htmlFor="password" required>
                  Password
                </Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  required
                  autoComplete="current-password"
                />
              </div>
              {state.error && (
                <div className="rounded-lg bg-danger-100 px-3 py-2 text-caption text-danger-500">
                  {state.error}
                </div>
              )}
              <SubmitButton />
              <div className="rounded-lg bg-primary-100 px-3 py-2 text-caption text-primary-900">
                <p className="font-semibold">Demo accounts</p>
                <ul className="mt-1 space-y-0.5">
                  <li>sender@zarpay.dev / password123</li>
                  <li>reviewer@zarpay.dev / password123</li>
                  <li>admin@zarpay.dev / password123</li>
                </ul>
              </div>
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
      {pending ? "Logging in…" : "Log in"}
    </Button>
  );
}
