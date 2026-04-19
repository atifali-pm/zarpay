import type { TransferEvent } from "@prisma/client";
import { formatDateTime, formatRelative } from "@/lib/format";

const EVENT_LABELS: Record<string, string> = {
  quote_created: "Quote locked",
  payment_initiated: "Awaiting payment",
  payment_funded: "Payment received",
  payment_cancelled: "Cancelled by you",
  compliance_flagged: "Held for compliance review",
  compliance_cleared: "Compliance cleared",
  released_to_payout: "Sent to payout partner",
  payout_delivered: "Delivered",
  payout_failed: "Payout failed",
  manual_state_change: "Status changed",
};

export function TransferTimeline({ events }: { events: TransferEvent[] }) {
  if (events.length === 0) {
    return <p className="text-body text-text-500">No events yet.</p>;
  }

  return (
    <ol className="relative border-l border-border ml-3">
      {events.map((e) => (
        <li key={e.id} className="mb-6 ml-6">
          <span className="absolute -left-1.5 mt-1.5 h-3 w-3 rounded-full bg-primary-700 ring-4 ring-white" />
          <h4 className="text-body font-semibold text-text-900">
            {EVENT_LABELS[e.eventType] ?? e.eventType}
          </h4>
          <p className="text-caption text-text-500">
            <span className="font-medium text-text-700">{formatRelative(e.createdAt)}</span>
            <span className="mx-1.5 text-border">·</span>
            {formatDateTime(e.createdAt)}
          </p>
          {e.fromStatus && (
            <p className="text-caption text-text-500">
              {e.fromStatus} → {e.toStatus}
            </p>
          )}
        </li>
      ))}
    </ol>
  );
}
