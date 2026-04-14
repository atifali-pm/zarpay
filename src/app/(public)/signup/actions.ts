"use server";

import { z } from "zod";
import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { signIn } from "@/auth";
import { getOtpProvider } from "@/lib/providers/otp";

const signupSchema = z.object({
  fullName: z.string().min(2, "Please enter your full name"),
  email: z.string().email("Please enter a valid email"),
  phone: z.string().min(10, "Please enter your phone number in international format"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export type SignupState = {
  error?: string;
  fieldErrors?: Partial<Record<keyof z.infer<typeof signupSchema>, string>>;
};

export async function signupAction(_prev: SignupState, formData: FormData): Promise<SignupState> {
  const parsed = signupSchema.safeParse({
    fullName: formData.get("fullName"),
    email: formData.get("email"),
    phone: formData.get("phone"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    const fieldErrors: SignupState["fieldErrors"] = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path[0] as keyof z.infer<typeof signupSchema>;
      if (!fieldErrors[key]) fieldErrors[key] = issue.message;
    }
    return { fieldErrors };
  }

  const { fullName, email, phone, password } = parsed.data;
  const lcEmail = email.toLowerCase();

  const existing = await prisma.user.findUnique({ where: { email: lcEmail } });
  if (existing) {
    return { error: "An account with that email already exists." };
  }

  const passwordHash = await bcrypt.hash(password, 10);
  await prisma.user.create({
    data: {
      email: lcEmail,
      fullName,
      phone,
      passwordHash,
      role: "sender",
      kycStatus: "unverified",
    },
  });

  // Send OTP straight away
  const otp = getOtpProvider();
  await otp.send({ phone });

  // Sign the user in
  try {
    await signIn("credentials", {
      email: lcEmail,
      password,
      redirect: false,
    });
  } catch {
    return { error: "Account created but sign-in failed. Please log in." };
  }

  redirect("/onboarding/otp");
}
