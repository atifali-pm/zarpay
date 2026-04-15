import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Alert, Pressable, RefreshControl, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect, useRouter } from "expo-router";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import type {
  Recipient,
  RecipientBankDetails,
  RecipientCashDetails,
  RecipientWalletDetails,
} from "@zarpay/types";
import { api, ApiClientError } from "@/lib/api";
import { Button } from "@/components/ui/Button";
import { Logo } from "@/components/ui/Logo";

type LoadState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ok"; recipients: Recipient[] };

export default function RecipientsListScreen() {
  const router = useRouter();
  const tabBarHeight = useBottomTabBarHeight();
  const [state, setState] = useState<LoadState>({ status: "loading" });
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const recipients = await api.listRecipients();
      setState({ status: "ok", recipients });
    } catch (err) {
      const message =
        err instanceof ApiClientError ? err.message : err instanceof Error ? err.message : "Failed";
      setState({ status: "error", message });
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  // Refresh when the tab comes back into focus (e.g. returning from new/edit).
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

  const handleDelete = (recipient: Recipient) => {
    Alert.alert(
      `Remove ${recipient.fullName}?`,
      "The recipient will be hidden from new transfers. Existing transfer history is preserved.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: async () => {
            try {
              await api.deleteRecipient(recipient.id);
              await load();
            } catch (err) {
              Alert.alert(
                "Could not remove",
                err instanceof Error ? err.message : "Please try again",
              );
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
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <View className="flex-row items-center justify-between">
          <Logo size="md" />
        </View>

        <Text className="mt-8 text-3xl font-bold text-text-900">Recipients</Text>
        <Text className="mt-1 text-base text-text-500">
          People you send money to in Pakistan. Add bank accounts, mobile wallets, or cash pickup.
        </Text>

        <View className="mt-6">
          <Button size="lg" onPress={() => router.push("/(tabs)/recipients/new")}>
            Add a recipient
          </Button>
        </View>

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
              <Pressable onPress={() => void load()} style={{ marginTop: 8 }}>
                <Text className="text-sm font-semibold text-primary-700">Retry</Text>
              </Pressable>
            </View>
          )}

          {state.status === "ok" && state.recipients.length === 0 && (
            <View className="rounded-2xl border border-border bg-white p-8">
              <Text className="text-center text-base font-semibold text-text-900">
                No recipients yet
              </Text>
              <Text className="mt-2 text-center text-sm text-text-500">
                Add your first recipient to start sending money.
              </Text>
            </View>
          )}

          {state.status === "ok" &&
            state.recipients.map((r) => (
              <RecipientCard
                key={r.id}
                recipient={r}
                onEdit={() => router.push({ pathname: "/(tabs)/recipients/[id]", params: { id: r.id } })}
                onDelete={() => handleDelete(r)}
              />
            ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function RecipientCard({
  recipient,
  onEdit,
  onDelete,
}: {
  recipient: Recipient;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const details = recipient.accountDetails;
  return (
    <View
      style={{
        marginTop: 12,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: "#E6EAF0",
        backgroundColor: "#FFFFFF",
        padding: 16,
      }}
    >
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 16, fontWeight: "700", color: "#0B1A2C" }}>
            {recipient.fullName}
          </Text>
          {recipient.nickname && (
            <Text style={{ marginTop: 2, fontSize: 12, color: "#5B6B7F" }}>
              "{recipient.nickname}"
              {recipient.relationship ? ` · ${recipient.relationship}` : ""}
            </Text>
          )}
        </View>
        <PayoutBadge method={recipient.payoutMethod} />
      </View>

      <View style={{ marginTop: 12, gap: 4 }}>
        {recipient.payoutMethod === "bank" && (
          <>
            <Detail label="Bank" value={(details as RecipientBankDetails).bank_code} />
            <Detail
              label="Account"
              value={maskAccount((details as RecipientBankDetails).account_number)}
            />
            <Detail label="Title" value={(details as RecipientBankDetails).account_title} />
          </>
        )}
        {recipient.payoutMethod === "mobile_wallet" && (
          <>
            <Detail label="Wallet" value={(details as RecipientWalletDetails).provider} />
            <Detail
              label="Number"
              value={maskAccount((details as RecipientWalletDetails).account_number)}
            />
          </>
        )}
        {recipient.payoutMethod === "cash_pickup" && (
          <>
            <Detail label="Network" value={(details as RecipientCashDetails).network} />
          </>
        )}
      </View>

      <View style={{ marginTop: 12, flexDirection: "row", gap: 8 }}>
        <View style={{ flex: 1 }}>
          <Button size="sm" variant="secondary" onPress={onEdit}>
            Edit
          </Button>
        </View>
        <View style={{ flex: 1 }}>
          <Button size="sm" variant="ghost" onPress={onDelete}>
            Remove
          </Button>
        </View>
      </View>
    </View>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
      <Text style={{ fontSize: 12, color: "#5B6B7F" }}>{label}</Text>
      <Text style={{ fontSize: 12, fontWeight: "600", color: "#0B1A2C" }}>{value}</Text>
    </View>
  );
}

function PayoutBadge({ method }: { method: "bank" | "mobile_wallet" | "cash_pickup" }) {
  const labels = {
    bank: "Bank",
    mobile_wallet: "Wallet",
    cash_pickup: "Cash",
  } as const;
  return (
    <View
      style={{
        backgroundColor: "#E8EEF7",
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 999,
      }}
    >
      <Text style={{ fontSize: 11, fontWeight: "700", color: "#0B2545" }}>{labels[method]}</Text>
    </View>
  );
}

function maskAccount(value: string | undefined | null): string {
  if (!value) return "·";
  if (value.length <= 4) return value;
  return `••${value.slice(-4)}`;
}
