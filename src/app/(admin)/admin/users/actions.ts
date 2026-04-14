"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth-helpers";
import { prisma } from "@/lib/db";
import { writeAudit } from "@/lib/audit";

export async function freezeUserAction(formData: FormData) {
  const admin = await requireAdmin();
  const id = formData.get("id") as string;
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) return;
  await prisma.user.update({ where: { id }, data: { frozen: !user.frozen } });
  await writeAudit({
    actorId: admin.id,
    action: user.frozen ? "user.unfreeze" : "user.freeze",
    targetType: "user",
    targetId: id,
    diff: { frozen: { from: user.frozen, to: !user.frozen } },
  });
  revalidatePath("/admin/users");
  revalidatePath(`/admin/users/${id}`);
}
