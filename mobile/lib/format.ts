/**
 * Display helpers for money values. Inputs are always strings because the
 * backend returns Decimal values stringified to preserve precision. We only
 * convert to Number at the last moment for locale formatting.
 */
export function formatGbp(value: string | number | null | undefined): string {
  if (value === null || value === undefined || value === "") return "·";
  const n = typeof value === "number" ? value : parseFloat(value);
  if (!Number.isFinite(n)) return "·";
  const formatted = new Intl.NumberFormat("en-GB", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n);
  return `£${formatted}`;
}

export function formatPkr(value: string | number | null | undefined): string {
  if (value === null || value === undefined || value === "") return "·";
  const n = typeof value === "number" ? value : parseFloat(value);
  if (!Number.isFinite(n)) return "·";
  const formatted = new Intl.NumberFormat("en-GB", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(n);
  return `PKR ${formatted}`;
}

export function formatRate(value: string | number | null | undefined): string {
  if (value === null || value === undefined || value === "") return "·";
  const n = typeof value === "number" ? value : parseFloat(value);
  if (!Number.isFinite(n)) return "·";
  return new Intl.NumberFormat("en-GB", {
    minimumFractionDigits: 4,
    maximumFractionDigits: 4,
  }).format(n);
}

export function formatRelative(iso: string | null | undefined): string {
  if (!iso) return "·";
  const d = new Date(iso);
  const diffMs = Date.now() - d.getTime();
  const diffMinutes = Math.round(diffMs / 60_000);
  if (diffMinutes < 1) return "just now";
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  const hours = Math.round(diffMinutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  if (days < 30) return `${days}d ago`;
  return d.toLocaleDateString("en-GB", { year: "numeric", month: "short", day: "numeric" });
}

const STATUS_LABELS: Record<string, string> = {
  quote_locked: "Quote locked",
  pending_payment: "Awaiting payment",
  funded: "Funded",
  compliance_hold: "Compliance hold",
  in_transit: "In transit",
  delivered: "Delivered",
  cancelled: "Cancelled",
  rejected: "Rejected",
};

const STATUS_COLORS: Record<string, { bg: string; fg: string }> = {
  quote_locked: { bg: "#E8EEF7", fg: "#0B2545" },
  pending_payment: { bg: "#FFF7E0", fg: "#B37E00" },
  funded: { bg: "#E8EEF7", fg: "#13315C" },
  compliance_hold: { bg: "#FFF7E0", fg: "#B37E00" },
  in_transit: { bg: "#FFF7E0", fg: "#B37E00" },
  delivered: { bg: "#E6F4F0", fg: "#1F8A70" },
  cancelled: { bg: "#F6F8FB", fg: "#5B6B7F" },
  rejected: { bg: "#FBEAEA", fg: "#D64545" },
};

export function transferStatusLabel(status: string): string {
  return STATUS_LABELS[status] ?? status;
}

export function transferStatusColors(status: string): { bg: string; fg: string } {
  return STATUS_COLORS[status] ?? { bg: "#F6F8FB", fg: "#5B6B7F" };
}
