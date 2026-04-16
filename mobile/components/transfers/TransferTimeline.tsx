import { Text, View } from "react-native";
import type { TransferEvent } from "@zarpay/types";

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

function formatStamp(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString("en-GB", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function TransferTimeline({ events }: { events: TransferEvent[] }) {
  if (events.length === 0) {
    return <Text style={{ fontSize: 13, color: "#5B6B7F" }}>No events yet.</Text>;
  }

  return (
    <View>
      {events.map((event, idx) => {
        const isLast = idx === events.length - 1;
        return (
          <View key={event.id} style={{ flexDirection: "row" }}>
            {/* Left rail with dot + connector */}
            <View style={{ width: 24, alignItems: "center" }}>
              <View
                style={{
                  width: 12,
                  height: 12,
                  borderRadius: 6,
                  backgroundColor: "#0B2545",
                  marginTop: 4,
                }}
              />
              {!isLast && (
                <View
                  style={{
                    width: 2,
                    flex: 1,
                    backgroundColor: "#E6EAF0",
                    marginTop: 2,
                  }}
                />
              )}
            </View>

            {/* Right side: label + timestamp */}
            <View style={{ flex: 1, paddingLeft: 12, paddingBottom: isLast ? 0 : 20 }}>
              <Text style={{ fontSize: 14, fontWeight: "600", color: "#0B1A2C" }}>
                {EVENT_LABELS[event.eventType] ?? event.eventType}
              </Text>
              <Text style={{ marginTop: 2, fontSize: 11, color: "#5B6B7F" }}>
                {formatStamp(event.createdAt)}
              </Text>
              {event.fromStatus && (
                <Text style={{ marginTop: 2, fontSize: 11, color: "#9BA8B8" }}>
                  {event.fromStatus} → {event.toStatus}
                </Text>
              )}
            </View>
          </View>
        );
      })}
    </View>
  );
}
