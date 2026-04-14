"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { getOtpProvider } from "@/lib/providers/otp";

const verifySchema = z.object({
  challengeId: z.string().min(1),
  code: z.string().regex(/^\d{6}$/, "Code must be 6 digits"),
});

export type OtpState = { error?: string; success?: string };

export async function sendOtpAction(): Promise<{ challengeId: string; error?: string }> {
  const session = await auth();
  if (!session?.user?.id) return { challengeId: "", error: "Not signed in" };
  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user?.phone) return { challengeId: "", error: "No phone on file" };
  const otp = getOtpProvider();
  const result = await otp.send({ phone: user.phone });
  return { challengeId: result.challengeId };
}

export async function verifyOtpAction(_prev: OtpState, formData: FormData): Promise<OtpState> {
  const session = await auth();
  if (!session?.user?.id) return { error: "Not signed in" };

  const parsed = verifySchema.safeParse({
    challengeId: formData.get("challengeId"),
    code: formData.get("code"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const otp = getOtpProvider();
  const result = await otp.verify({
    challengeId: parsed.data.challengeId,
    code: parsed.data.code,
  });
  if (!result.ok) return { error: "Code is invalid or expired. Please try again." };

  redirect("/onboarding/kyc");
}
