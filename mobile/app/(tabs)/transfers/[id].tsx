import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";
import type {
  RecipientBankDetails,
  RecipientCashDetails,
  RecipientWalletDetails,
  TransferDetail,
} from "@zarpay/types";
import { api, ApiClientError } from "@/lib/api";
import { Button } from "@/components/ui/Button";
import { Card, CardBody } from "@/components/ui/Card";
import { Logo } from "@/components/ui/Logo";
import { StatusPill } from "@/components/ui/StatusPill";
import { TransferTimeline } from "@/components/transfers/TransferTimeline";
import { formatGbp, formatPkr } from "@/lib/format";

type LoadState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ok"; transfer: TransferDetail };

export default function TransferDetailScreen() {
  const router = useRouter();
  const tabBarHeight = useBottomTabBarHeight();
  const params = useLocalSearchParams<{ id: string }>();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;
  const [state, setState] = useState<LoadState>({ status: "loading" });
  const [cancelling, setCancelling] = useState(false);

  const load = useCallback(async () => {
    if (!id) {
      setState({ status: "error", message: "Missing transfer id" });
      return;
    }
    try {
      const transfer = await api.getTransferDetail(id);
      setState({ status: "ok", transfer });
    } catch (err) {
      const message =
        err instanceof ApiClientError
          ? err.message
          : err instanceof Error
            ? err.message
            : "Failed to load transfer";
      setState({ status: "error", message });
    }
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  const handleCancel = () => {
    if (state.status !== "ok") return;
    Alert.alert(
      "Cancel transfer?",
      `Cancel transfer ${state.transfer.reference}? This stops the payment and the recipient receives nothing.`,
      [
        { text: "Keep", style: "cancel" },
        {
          text: "Cancel transfer",
          style: "destructive",
          onPress: async () => {
            if (!id) return;
            setCancelling(true);
            try {
              const updated = await api.cancelTransfer(id);
              setState({ status: "ok", transfer: updated });
            } catch (err) {
              Alert.alert(
                "Could not cancel",
                err instanceof Error ? err.message : "Please try again",
              );
            } finally {
              setCancelling(false);
            }
          },
        },
      ],
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-bg-50">
      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
          paddingHorizontal: 24,
          paddingTop: 24,
          paddingBottom: tabBarHeight + 24,
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
          <Logo size="md" />
          <Pressable
            onPress={() => router.back()}
            style={{ flexDirection: "row", alignItems: "center", gap: 4 }}
          >
            <Ionicons name="chevron-back" size={18} color="#0B2545" />
            <Text style={{ fontSize: 14, fontWeight: "600", color: "#0B2545" }}>Back</Text>
          </Pressable>
        </View>

        {state.status === "loading" && (
          <View className="mt-12 flex-row items-center justify-center gap-2">
            <ActivityIndicator size="small" color="#0B2545" />
            <Text className="text-sm text-text-500">Loading transfer…</Text>
          </View>
        )}

        {state.status === "error" && (
          <View className="mt-6 rounded-xl bg-danger-100 px-4 py-3">
            <Text className="text-sm text-danger-500">{state.message}</Text>
          </View>
        )}

        {state.status === "ok" && (
          <Detail
            transfer={state.transfer}
            cancelling={cancelling}
            onCancel={handleCancel}
          />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function Detail({
  transfer,
  cancelling,
  onCancel,
}: {
  transfer: TransferDetail;
  cancelling: boolean;
  onCancel: () => void;
}) {
  const canCancel =
    transfer.status === "pending_payment" || transfer.status === "quote_locked";
  const details = transfer.recipient.accountDetails;

  return (
    <View>
      <View style={{ marginTop: 24 }}>
        <Text style={{ fontFamily: "monospace", fontSize: 12, color: "#5B6B7F" }}>
          {transfer.reference}
        </Text>
        <View style={{ marginTop: 8 }}>
          <StatusPill status={transfer.status} />
        </View>
      </View>

      <Card className="mt-6">
        <CardBody>
          <View>
            <Text style={{ fontSize: 11, fontWeight: "600", letterSpacing: 1, color: "#5B6B7F" }}>
              YOU SENT
            </Text>
            <Text style={{ marginTop: 4, fontSize: 28, fontWeight: "700", color: "#0B1A2C" }}>
              {formatGbp(transfer.sendAmountGbp)}
            </Text>
          </View>
          <View style={{ marginTop: 16 }}>
            <Text style={{ fontSize: 11, fontWeight: "600", letterSpacing: 1, color: "#5B6B7F" }}>
              RECIPIENT GETS
            </Text>
            <Text style={{ marginTop: 4, fontSize: 28, fontWeight: "700", color: "#0B2545" }}>
              {formatPkr(transfer.receiveAmountPkr)}
            </Text>
          </View>
          <View style={{ marginVertical: 16, height: 1, backgroundColor: "#E6EAF0" }} />
          <View style={{ gap: 6 }}>
            <Row label="Exchange rate" value={`1 GBP = ${transfer.exchangeRate} PKR`} />
            <Row label="Spread" value={`${(transfer.spreadBps / 100).toFixed(2)}%`} />
            <Row label="Fee" value={formatGbp(transfer.feeGbp)} />
            <Row label="Total charged" value={formatGbp(transfer.totalChargedGbp)} bold />
          </View>
        </CardBody>
      </Card>

      <Card className="mt-4">
        <CardBody>
          <Text style={{ fontSize: 11, fontWeight: "600", letterSpacing: 1, color: "#5B6B7F" }}>
            RECIPIENT
          </Text>
          <Text style={{ marginTop: 4, fontSize: 18, fontWeight: "700", color: "#0B1A2C" }}>
            {transfer.recipient.fullName}
          </Text>
          <View style={{ marginTop: 12, gap: 6 }}>
            {transfer.recipient.payoutMethod === "bank" && (
              <>
                <Row label="Method" value="Bank deposit" />
                <Row label="Bank" value={(details as RecipientBankDetails).bank_code} />
                <Row
                  label="Account"
                  value={(details as RecipientBankDetails).account_number}
                />
                <Row
                  label="Title"
                  value={(details as RecipientBankDetails).account_title}
                />
              </>
            )}
            {transfer.recipient.payoutMethod === "mobile_wallet" && (
              <>
                <Row label="Method" value="Mobile wallet" />
                <Row label="Wallet" value={(details as RecipientWalletDetails).provider} />
                <Row
                  label="Number"
                  value={(details as RecipientWalletDetails).account_number}
                />
              </>
            )}
            {transfer.recipient.payoutMethod === "cash_pickup" && (
              <>
                <Row label="Method" value="Cash pickup" />
                <Row label="Network" value={(details as RecipientCashDetails).network} />
              </>
            )}
          </View>
        </CardBody>
      </Card>

      <Card className="mt-4">
        <CardBody>
          <Text style={{ fontSize: 11, fontWeight: "600", letterSpacing: 1, color: "#5B6B7F" }}>
            TIMELINE
          </Text>
          <View style={{ marginTop: 12 }}>
            <TransferTimeline events={transfer.events} />
          </View>
        </CardBody>
      </Card>

      <Card className="mt-4">
        <CardBody>
          <Text style={{ fontSize: 11, fontWeight: "600", letterSpacing: 1, color: "#5B6B7F" }}>
            DETAILS
          </Text>
          <View style={{ marginTop: 12, gap: 6 }}>
            <Row
              label="Payment intent"
              value={transfer.paymentIntentId ?? "·"}
              mono
            />
            <Row
              label="Payout reference"
              value={transfer.payoutReference ?? "·"}
              mono
            />
            <Row
              label="Quote locked until"
              value={new Date(transfer.quoteLockedUntil).toLocaleString("en-GB")}
            />
          </View>
        </CardBody>
      </Card>

      {canCancel && (
        <View style={{ marginTop: 24 }}>
          <Button variant="destructive" loading={cancelling} onPress={onCancel}>
            Cancel transfer
          </Button>
        </View>
      )}
    </View>
  );
}

function Row({
  label,
  value,
  bold,
  mono,
}: {
  label: string;
  value: string;
  bold?: boolean;
  mono?: boolean;
}) {
  return (
    <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
      <Text style={{ fontSize: 12, color: "#5B6B7F" }}>{label}</Text>
      <Text
        style={{
          fontSize: bold ? 14 : 12,
          color: bold ? "#0B1A2C" : "#243447",
          fontWeight: bold ? "700" : "500",
          fontFamily: mono ? "monospace" : undefined,
          textAlign: "right",
          flexShrink: 1,
          marginLeft: 16,
        }}
      >
        {value}
      </Text>
    </View>
  );
}
