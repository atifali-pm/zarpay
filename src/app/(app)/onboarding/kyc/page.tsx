"use client";

import { useFormState, useFormStatus } from "react-dom";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { uploadKycAction, type KycState } from "./actions";

export default function KycPage() {
  const [state, formAction] = useFormState<KycState, FormData>(uploadKycAction, {});

  return (
    <div className="container-app py-12">
      <div className="mx-auto max-w-2xl">
        <h1 className="text-display-lg font-display font-bold mb-2">Verify your identity</h1>
        <p className="text-body text-text-500 mb-8">
          We need three documents to confirm who you are. Pick clear, well-lit photos.
        </p>
        <Card>
          <CardHeader>
            <CardTitle>ID and selfie</CardTitle>
            <CardDescription>JPG, PNG, WebP, or PDF. Up to 8 MB per file.</CardDescription>
          </CardHeader>
          <CardContent>
            <form action={formAction} className="space-y-5" encType="multipart/form-data">
              <div>
                <Label htmlFor="id_type" required>
                  ID type
                </Label>
                <Select id="id_type" name="id_type" required defaultValue="passport">
                  <option value="passport">Passport</option>
                  <option value="driving_licence">Driving licence</option>
                  <option value="national_id">National ID card</option>
                </Select>
              </div>
              <div>
                <Label htmlFor="id_front" required>
                  ID front
                </Label>
                <Input id="id_front" name="id_front" type="file" accept="image/*,application/pdf" required />
              </div>
              <div>
                <Label htmlFor="id_back" required>
                  ID back
                </Label>
                <Input id="id_back" name="id_back" type="file" accept="image/*,application/pdf" required />
                <p className="mt-1 text-caption text-text-500">
                  For passports, upload the photo page on both sides if there is no back.
                </p>
              </div>
              <div>
                <Label htmlFor="selfie" required>
                  Selfie holding your ID
                </Label>
                <Input id="selfie" name="selfie" type="file" accept="image/*" required />
              </div>
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
      {pending ? "Uploading…" : "Submit for review"}
    </Button>
  );
}
