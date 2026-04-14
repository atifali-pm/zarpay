import { prisma } from "@/lib/db";

export interface AuditEntry {
  actorId: string;
  action: string;
  targetType: "user" | "transfer" | "kyc_document" | "exchange_rate" | "compliance_flag";
  targetId: string;
  diff?: Record<string, unknown>;
  ipAddress?: string | null;
  userAgent?: string | null;
}

export async function writeAudit(entry: AuditEntry): Promise<void> {
  await prisma.auditLog.create({
    data: {
      actorId: entry.actorId,
      action: entry.action,
      targetType: entry.targetType,
      targetId: entry.targetId,
      diff: (entry.diff ?? {}) as object,
      ipAddress: entry.ipAddress ?? null,
      userAgent: entry.userAgent ?? null,
    },
  });
}
