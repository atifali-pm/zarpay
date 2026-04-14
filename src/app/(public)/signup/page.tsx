"use client";

import Link from "next/link";
import { useFormState, useFormStatus } from "react-dom";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { signupAction, type SignupState } from "./actions";

export default function SignupPage() {
  const [state, formAction] = useFormState<SignupState, FormData>(signupAction, {});

  return (
    <div className="container-marketing py-16">
      <div className="mx-auto max-w-md">
        <Card>
          <CardHeader>
            <CardTitle>Create your Zarpay account</CardTitle>
            <CardDescription>
              Already have one?{" "}
              <Link href="/login" className="text-primary-700 hover:underline">
                Log in
              </Link>
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form action={formAction} className="space-y-4">
              <div>
                <Label htmlFor="fullName" required>
                  Full name
                </Label>
                <Input id="fullName" name="fullName" required autoComplete="name" />
                {state.fieldErrors?.fullName && (
                  <p className="mt-1 text-caption text-danger-500">{state.fieldErrors.fullName}</p>
                )}
              </div>
              <div>
                <Label htmlFor="email" required>
                  Email
                </Label>
                <Input id="email" name="email" type="email" required autoComplete="email" />
                {state.fieldErrors?.email && (
                  <p className="mt-1 text-caption text-danger-500">{state.fieldErrors.email}</p>
                )}
              </div>
              <div>
                <Label htmlFor="phone" required>
                  Phone (with country code)
                </Label>
                <Input
                  id="phone"
                  name="phone"
                  type="tel"
                  required
                  autoComplete="tel"
                  placeholder="+447123456789"
                />
                {state.fieldErrors?.phone && (
                  <p className="mt-1 text-caption text-danger-500">{state.fieldErrors.phone}</p>
                )}
              </div>
              <div>
                <Label htmlFor="password" required>
                  Password (8+ characters)
                </Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  required
                  autoComplete="new-password"
                />
                {state.fieldErrors?.password && (
                  <p className="mt-1 text-caption text-danger-500">{state.fieldErrors.password}</p>
                )}
              </div>
              {state.error && (
                <div className="rounded-lg bg-danger-100 px-3 py-2 text-caption text-danger-500">
                  {state.error}
                </div>
              )}
              <SubmitButton />
              <p className="text-micro text-text-500 text-center">
                By signing up you agree to the placeholder Terms and Privacy notice. This is a
                portfolio build.
              </p>
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
      {pending ? "Creating account…" : "Create account"}
    </Button>
  );
}
