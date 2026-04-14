import { TransferStatus } from "@prisma/client";

export const TRANSFER_STATUS_LABELS: Record<TransferStatus, string> = {
  quote_locked: "Quote locked",
  pending_payment: "Awaiting payment",
  funded: "Funded",
  compliance_hold: "Compliance hold",
  in_transit: "In transit",
  delivered: "Delivered",
  cancelled: "Cancelled",
  rejected: "Rejected",
};

const TRANSITIONS: Record<TransferStatus, TransferStatus[]> = {
  quote_locked: ["pending_payment", "cancelled"],
  pending_payment: ["funded", "cancelled"],
  funded: ["compliance_hold", "in_transit", "rejected"],
  compliance_hold: ["in_transit", "rejected"],
  in_transit: ["delivered", "rejected"],
  delivered: [],
  cancelled: [],
  rejected: [],
};

export function canTransition(from: TransferStatus, to: TransferStatus): boolean {
  return TRANSITIONS[from]?.includes(to) ?? false;
}

export function assertTransition(from: TransferStatus, to: TransferStatus): void {
  if (!canTransition(from, to)) {
    throw new Error(`Invalid transfer transition: ${from} → ${to}`);
  }
}

export function nextAllowed(from: TransferStatus): TransferStatus[] {
  return TRANSITIONS[from] ?? [];
}

export function isTerminal(status: TransferStatus): boolean {
  return TRANSITIONS[status].length === 0;
}

export const STATUS_PILL_CLASS: Record<TransferStatus, string> = {
  quote_locked: "bg-primary-100 text-primary-900",
  pending_payment: "bg-warning-100 text-warning-500",
  funded: "bg-primary-100 text-primary-700",
  compliance_hold: "bg-warning-100 text-warning-500",
  in_transit: "bg-warning-100 text-warning-500",
  delivered: "bg-success-100 text-success-500",
  cancelled: "bg-bg-50 text-text-500",
  rejected: "bg-danger-100 text-danger-500",
};
