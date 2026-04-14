"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth-helpers";
import { prisma } from "@/lib/db";
import { advanceTransfer, markDelivered } from "@/lib/transfer";
import { writeAudit } from "@/lib/audit";

export async function adminMarkDelivered(formData: FormData) {
  const admin = await requireAdmin();
  const id = formData.get("id") as string;
  await markDelivered(id, admin.id);
  await writeAudit({
    actorId: admin.id,
    action: "transfer.mark_delivered",
    targetType: "transfer",
    targetId: id,
  });
  revalidatePath(`/admin/transfers/${id}`);
}

export async function adminMarkInTransit(formData: FormData) {
  const admin = await requireAdmin();
  const id = formData.get("id") as string;
  const transfer = await prisma.transfer.findUniqueOrThrow({ where: { id } });
  if (transfer.status !== "funded" && transfer.status !== "compliance_hold") return;
  await advanceTransfer({
    transferId: id,
    to: "in_transit",
    eventType: "manual_state_change",
    actorType: "admin",
    actorId: admin.id,
    payload: { manual: true },
    patch: { inTransitAt: new Date() },
  });
  await writeAudit({
    actorId: admin.id,
    action: "transfer.manual_advance",
    targetType: "transfer",
    targetId: id,
    diff: { from: transfer.status, to: "in_transit" },
  });
  revalidatePath(`/admin/transfers/${id}`);
}

export async function adminReject(formData: FormData) {
  const admin = await requireAdmin();
  const id = formData.get("id") as string;
  const reason = (formData.get("reason") as string) ?? "Manually rejected";
  const transfer = await prisma.transfer.findUniqueOrThrow({ where: { id } });
  await advanceTransfer({
    transferId: id,
    to: "rejected",
    eventType: "manual_state_change",
    actorType: "admin",
    actorId: admin.id,
    payload: { reason },
  });
  await writeAudit({
    actorId: admin.id,
    action: "transfer.reject",
    targetType: "transfer",
    targetId: id,
    diff: { from: transfer.status, to: "rejected", reason },
  });
  revalidatePath(`/admin/transfers/${id}`);
}
