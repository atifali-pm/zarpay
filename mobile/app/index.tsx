import { useCallback, useEffect, useMemo, useState } from "react";
import { ActivityIndicator, SafeAreaView, ScrollView, Text, TextInput, View } from "react-native";
import { api, ApiClientError } from "@/lib/api";
import type { CurrentRateResponse } from "@zarpay/types";

type RateState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ok"; rate: CurrentRateResponse };

export default function LandingScreen() {
  const [amount, setAmount] = useState("500");
  const [state, setState] = useState<RateState>({ status: "loading" });

  const load = useCallback(async () => {
    setState({ status: "loading" });
    try {
      const rate = await api.getCurrentRate();
      setState({ status: "ok", rate });
    } catch (err) {
      const message =
        err instanceof ApiClientError
          ? `${err.status} ${err.message}`
          : err instanceof Error
            ? err.message
            : "Failed to load rate";
      setState({ status: "error", message });
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const breakdown = useMemo(() => {
    if (state.status !== "ok") return null;
    const value = parseFloat(amount.replace(/,/g, ""));
    if (!Number.isFinite(value) || value <= 0) return null;
    const effectiveRate = parseFloat(state.rate.effectiveRate);
    const fee = parseFloat(state.rate.feeGbp);
    const receiveAmount = value * effectiveRate;
    const total = value + fee;
    return {
      send: value.toFixed(2),
      receive: receiveAmount.toFixed(0),
      fee: fee.toFixed(2),
      total: total.toFixed(2),
      midRate: parseFloat(state.rate.midRate).toFixed(4),
      effectiveRate: effectiveRate.toFixed(4),
      spreadPct: (state.rate.spreadBps / 100).toFixed(2),
    };
  }, [amount, state]);

  return (
    <SafeAreaView className="flex-1 bg-bg-50">
      <ScrollView contentContainerClassName="flex-grow px-6 pt-12 pb-16">
        <Text className="text-accent-500 font-bold text-3xl">
          Z<Text className="text-primary-900">arpay</Text>
        </Text>

        <Text className="mt-8 text-text-500 text-sm uppercase tracking-widest">
          UK to Pakistan corridor
        </Text>
        <Text className="mt-2 text-4xl font-bold text-text-900">
          Send to Pakistan{" "}
          <Text className="text-accent-500">at the real rate.</Text>
        </Text>
        <Text className="mt-4 text-base text-text-500">
          Mid market rate, disclosed spread, no hidden margin. Bank deposit, mobile wallet, or
          cash pickup, anywhere in Pakistan.
        </Text>

        <View className="mt-8 rounded-2xl border border-border bg-white p-6 shadow-sm">
          <Text className="text-xs font-medium uppercase tracking-widest text-text-500">
            You send
          </Text>
          <View className="mt-2 flex-row items-center">
            <Text className="text-4xl font-bold text-text-900">£</Text>
            <TextInput
              value={amount}
              onChangeText={(v) => setAmount(v.replace(/[^0-9.]/g, ""))}
              keyboardType="decimal-pad"
              className="ml-2 flex-1 text-4xl font-bold text-text-900"
              placeholder="500"
              placeholderTextColor="#9BA8B8"
            />
            <Text className="text-base text-text-500">GBP</Text>
          </View>

          <View className="my-4 h-px bg-border" />

          <Text className="text-xs font-medium uppercase tracking-widest text-text-500">
            Recipient gets
          </Text>
          <View className="mt-1 flex-row items-baseline">
            <Text className="text-5xl font-bold text-primary-900">
              {breakdown ? breakdown.receive : "·"}
            </Text>
            <Text className="ml-2 text-base text-text-500">PKR</Text>
          </View>

          {state.status === "loading" && (
            <View className="mt-6 flex-row items-center gap-2">
              <ActivityIndicator size="small" color="#0B2545" />
              <Text className="text-sm text-text-500">Loading rate…</Text>
            </View>
          )}

          {state.status === "error" && (
            <View className="mt-6 rounded-lg bg-danger-100 px-4 py-3">
              <Text className="text-sm text-danger-500">
                Could not reach the Zarpay backend: {state.message}
              </Text>
              <Text className="mt-2 text-xs text-text-500">
                Is the Next.js dev server running on port 3010 and reachable from this device?
              </Text>
            </View>
          )}

          {breakdown && state.status === "ok" && (
            <View className="mt-6 gap-y-2 rounded-lg bg-bg-50 p-4">
              <Row label="Mid market rate" value={`1 GBP = ${breakdown.midRate} PKR`} />
              <Row
                label={`Our rate (spread ${breakdown.spreadPct}%)`}
                value={`1 GBP = ${breakdown.effectiveRate} PKR`}
              />
              <Row label="You send" value={`£${breakdown.send}`} />
              <Row label="Fee" value={`£${breakdown.fee}`} />
              <View className="mt-1 h-px bg-border" />
              <Row label="Total to pay" value={`£${breakdown.total}`} bold />
            </View>
          )}
        </View>

        <Text className="mt-8 text-center text-xs text-text-500">
          Rate from {state.status === "ok" ? state.rate.source : "backend"}. Quote will be locked
          for 60 minutes once you start a transfer.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

function Row({ label, value, bold = false }: { label: string; value: string; bold?: boolean }) {
  return (
    <View className="flex-row items-center justify-between">
      <Text className="text-xs text-text-500">{label}</Text>
      <Text
        className={`text-sm ${bold ? "font-semibold text-text-900" : "text-text-700"}`}
      >
        {value}
      </Text>
    </View>
  );
}
