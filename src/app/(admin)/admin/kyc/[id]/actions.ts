"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth-helpers";
import { prisma } from "@/lib/db";
import { writeAudit } from "@/lib/audit";
import { getEmailProvider, emailTemplates } from "@/lib/providers/email";

export async function approveKycAction(formData: FormData) {
  const reviewer = await requireAdmin();
  const userId = formData.get("userId") as string;
  if (!userId) return;
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return;

  await prisma.$transaction([
    prisma.user.update({
      where: { id: userId },
      data: { kycStatus: "approved", kycTier: 1 },
    }),
    prisma.kycDocument.updateMany({
      where: { userId },
      data: { status: "approved", reviewedById: reviewer.id, reviewedAt: new Date() },
    }),
  ]);

  await writeAudit({
    actorId: reviewer.id,
    action: "kyc.approve",
    targetType: "user",
    targetId: userId,
    diff: { kycStatus: { from: user.kycStatus, to: "approved" } },
  });

  const tpl = emailTemplates.kycApproved(user.fullName);
  await getEmailProvider().send({ to: user.email, subject: tpl.subject, body: tpl.body });

  revalidatePath("/admin/kyc");
  revalidatePath(`/admin/kyc/${userId}`);
  redirect("/admin/kyc");
}

export async function rejectKycAction(formData: FormData) {
  const reviewer = await requireAdmin();
  const userId = formData.get("userId") as string;
  const reason = (formData.get("reason") as string) || "Documents unclear or incomplete";
  if (!userId) return;
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return;

  await prisma.$transaction([
    prisma.user.update({
      where: { id: userId },
      data: { kycStatus: "rejected" },
    }),
    prisma.kycDocument.updateMany({
      where: { userId },
      data: {
        status: "rejected",
        reviewedById: reviewer.id,
        reviewedAt: new Date(),
        reviewNotes: reason,
      },
    }),
  ]);

  await writeAudit({
    actorId: reviewer.id,
    action: "kyc.reject",
    targetType: "user",
    targetId: userId,
    diff: { kycStatus: { from: user.kycStatus, to: "rejected" }, reason },
  });

  const tpl = emailTemplates.kycRejected(user.fullName, reason);
  await getEmailProvider().send({ to: user.email, subject: tpl.subject, body: tpl.body });

  revalidatePath("/admin/kyc");
  redirect("/admin/kyc");
}
