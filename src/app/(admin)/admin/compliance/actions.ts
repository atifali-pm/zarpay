"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth-helpers";
import { prisma } from "@/lib/db";
import { clearComplianceAndRelease, rejectFromCompliance } from "@/lib/transfer";
import { writeAudit } from "@/lib/audit";

export async function clearFlagAction(formData: FormData) {
  const admin = await requireAdmin();
  const flagId = formData.get("flagId") as string;
  const flag = await prisma.complianceFlag.findUnique({ where: { id: flagId } });
  if (!flag) return;
  const result = await clearComplianceAndRelease(flag.transferId, admin.id, flagId);
  await writeAudit({
    actorId: admin.id,
    action: "compliance.clear",
    targetType: "compliance_flag",
    targetId: flagId,
    diff: { released: result.released },
  });
  revalidatePath("/admin/compliance");
  revalidatePath(`/admin/transfers/${flag.transferId}`);
}

export async function escalateFlagAction(formData: FormData) {
  const admin = await requireAdmin();
  const flagId = formData.get("flagId") as string;
  await prisma.complianceFlag.update({
    where: { id: flagId },
    data: { status: "escalated", reviewedById: admin.id, reviewedAt: new Date() },
  });
  await writeAudit({
    actorId: admin.id,
    action: "compliance.escalate",
    targetType: "compliance_flag",
    targetId: flagId,
  });
  revalidatePath("/admin/compliance");
}

export async function rejectFlagAction(formData: FormData) {
  const admin = await requireAdmin();
  const flagId = formData.get("flagId") as string;
  const flag = await prisma.complianceFlag.findUnique({ where: { id: flagId } });
  if (!flag) return;
  await prisma.complianceFlag.update({
    where: { id: flagId },
    data: { status: "reported", reviewedById: admin.id, reviewedAt: new Date() },
  });
  await rejectFromCompliance(flag.transferId, admin.id, "Rejected by compliance");
  await writeAudit({
    actorId: admin.id,
    action: "compliance.reject_transfer",
    targetType: "compliance_flag",
    targetId: flagId,
  });
  revalidatePath("/admin/compliance");
  revalidatePath(`/admin/transfers/${flag.transferId}`);
}
