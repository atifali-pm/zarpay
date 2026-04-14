import type { TransferStatus } from "@prisma/client";
import { cn } from "@/lib/cn";
import { STATUS_PILL_CLASS, TRANSFER_STATUS_LABELS } from "@/lib/transfer-state";

export function StatusPill({ status, className }: { status: TransferStatus; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-caption font-medium",
        STATUS_PILL_CLASS[status],
        className,
      )}
    >
      {TRANSFER_STATUS_LABELS[status]}
    </span>
  );
}
