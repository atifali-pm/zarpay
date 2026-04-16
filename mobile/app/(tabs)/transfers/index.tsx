import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect, useRouter } from "expo-router";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import type { TransferSummary } from "@zarpay/types";
import { api, ApiClientError } from "@/lib/api";
import { Logo } from "@/components/ui/Logo";
import { StatusPill } from "@/components/ui/StatusPill";
import { formatGbp, formatPkr, formatRelative } from "@/lib/format";

type LoadState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ok"; transfers: TransferSummary[] };

export default function TransfersListScreen() {
  const router = useRouter();
  const tabBarHeight = useBottomTabBarHeight();
  const [state, setState] = useState<LoadState>({ status: "loading" });
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const transfers = await api.listTransfers();
      setState({ status: "ok", transfers });
    } catch (err) {
      const message =
        err instanceof ApiClientError
          ? err.message
          : err instanceof Error
            ? err.message
            : "Failed to load";
      setState({ status: "error", message });
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
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
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <Logo size="md" />
        <Text className="mt-8 text-3xl font-bold text-text-900">Transfers</Text>
        <Text className="mt-1 text-base text-text-500">
          Every transfer you have started, newest first.
        </Text>

        <View className="mt-6">
          {state.status === "loading" && (
            <View className="flex-row items-center gap-2">
              <ActivityIndicator size="small" color="#0B2545" />
              <Text className="text-sm text-text-500">Loading…</Text>
            </View>
          )}

          {state.status === "error" && (
            <View className="rounded-xl bg-danger-100 px-4 py-3">
              <Text className="text-sm text-danger-500">{state.message}</Text>
              <Pressable onPress={() => void load()} style={{ marginTop: 6 }}>
                <Text className="text-sm font-semibold text-primary-700">Retry</Text>
              </Pressable>
            </View>
          )}

          {state.status === "ok" && state.transfers.length === 0 && (
            <View className="rounded-2xl border border-border bg-white p-8">
              <Text className="text-center text-base font-semibold text-text-900">
                No transfers yet
              </Text>
              <Text className="mt-2 text-center text-sm text-text-500">
                Tap Send to start your first transfer.
              </Text>
            </View>
          )}

          {state.status === "ok" &&
            state.transfers.map((t) => (
              <TransferCard
                key={t.id}
                transfer={t}
                onPress={() => router.push(`/(tabs)/transfers/${t.id}` as never)}
              />
            ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function TransferCard({
  transfer,
  onPress,
}: {
  transfer: TransferSummary;
  onPress: () => void;
}) {
  const methodLabel =
    transfer.recipientPayoutMethod === "bank"
      ? "Bank deposit"
      : transfer.recipientPayoutMethod === "mobile_wallet"
        ? "Mobile wallet"
        : "Cash pickup";

  return (
    <View
      style={{
        marginTop: 12,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: "#E6EAF0",
        backgroundColor: "#FFFFFF",
        overflow: "hidden",
      }}
    >
      <Pressable
        onPress={onPress}
        style={({ pressed }) => ({
          padding: 16,
          backgroundColor: pressed ? "#F6F8FB" : "#FFFFFF",
        })}
      >
        <View
          style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}
        >
          <View style={{ flex: 1, marginRight: 12 }}>
            <Text style={{ fontFamily: "monospace", fontSize: 11, color: "#5B6B7F" }}>
              {transfer.reference}
            </Text>
            <Text
              style={{ marginTop: 4, fontSize: 16, fontWeight: "700", color: "#0B1A2C" }}
            >
              {transfer.recipientName}
            </Text>
            <Text style={{ marginTop: 2, fontSize: 12, color: "#5B6B7F" }}>
              {methodLabel} · {formatRelative(transfer.createdAt)}
            </Text>
          </View>
          <View style={{ alignItems: "flex-end" }}>
            <Text style={{ fontSize: 16, fontWeight: "700", color: "#0B1A2C" }}>
              {formatGbp(transfer.sendAmountGbp)}
            </Text>
            <Text style={{ fontSize: 11, color: "#5B6B7F", marginTop: 2 }}>
              {formatPkr(transfer.receiveAmountPkr)}
            </Text>
            <View style={{ marginTop: 6 }}>
              <StatusPill status={transfer.status} />
            </View>
          </View>
        </View>
      </Pressable>
    </View>
  );
}
