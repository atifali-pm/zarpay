import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect, useRouter } from "expo-router";
import type { CurrentRateResponse, Recipient, TransferDetail } from "@zarpay/types";
import { useAuth } from "@/lib/auth";
import { api, ApiClientError } from "@/lib/api";
import { formatGbp, formatPkr, formatRate } from "@/lib/format";
import { Button } from "@/components/ui/Button";
import { Card, CardBody } from "@/components/ui/Card";
import { Logo } from "@/components/ui/Logo";
import { StatusPill } from "@/components/ui/StatusPill";

type Step = "form" | "review" | "paying" | "success" | "error";

interface Quote {
  sendAmount: number;
  receiveAmount: number;
  midRate: number;
  effectiveRate: number;
  spreadPct: number;
  fee: number;
  total: number;
}

export default function SendScreen() {
  const router = useRouter();
  const { state: authState } = useAuth();
  const [step, setStep] = useState<Step>("form");
  const [amount, setAmount] = useState("500");
  const [recipientId, setRecipientId] = useState<string | null>(null);
  const [recipients, setRecipients] = useState<Recipient[] | null>(null);
  const [rate, setRate] = useState<CurrentRateResponse | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [transfer, setTransfer] = useState<TransferDetail | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoadError(null);
    try {
      const [recipientsRes, rateRes] = await Promise.all([
        api.listRecipients(),
        api.getCurrentRate(),
      ]);
      setRecipients(recipientsRes);
      setRate(rateRes);
      if (!recipientId && recipientsRes[0]) {
        setRecipientId(recipientsRes[0].id);
      }
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : "Failed to load");
    }
  }, [recipientId]);

  useFocusEffect(
    useCallback(() => {
      // Re-fetch rate + recipients every time the tab comes into focus, so
      // a freshly added recipient shows up without a manual refresh.
      if (step === "form") {
        void load();
      }
    }, [load, step]),
  );

  const quote: Quote | null = useMemo(() => {
    if (!rate) return null;
    const value = parseFloat(amount.replace(/,/g, ""));
    if (!Number.isFinite(value) || value <= 0) return null;
    const effectiveRate = parseFloat(rate.effectiveRate);
    const midRate = parseFloat(rate.midRate);
    const fee = parseFloat(rate.feeGbp);
    return {
      sendAmount: value,
      receiveAmount: value * effectiveRate,
      midRate,
      effectiveRate,
      spreadPct: rate.spreadBps / 100,
      fee,
      total: value + fee,
    };
  }, [amount, rate]);

  const selectedRecipient = recipients?.find((r) => r.id === recipientId) ?? null;
  const isKycApproved = authState.status === "authenticated" && authState.user.kycStatus === "approved";

  const reset = () => {
    setStep("form");
    setTransfer(null);
    setError(null);
    setAmount("500");
  };

  const onContinueToReview = () => {
    if (!quote || !selectedRecipient) return;
    setStep("review");
  };

  const onConfirmAndPay = async () => {
    if (!selectedRecipient) return;
    setStep("paying");
    setError(null);
    try {
      const created = await api.createTransfer({
        sendAmountGbp: amount,
        recipientId: selectedRecipient.id,
      });
      // The backend already moved it from quote_locked to pending_payment.
      // Now simulate the user completing the payment.
      const confirmed = await api.confirmDevPayment(created.id);
      setTransfer(confirmed);
      setStep("success");
    } catch (err) {
      setError(
        err instanceof ApiClientError
          ? err.message
          : err instanceof Error
            ? err.message
            : "Something went wrong",
      );
      setStep("error");
    }
  };

  const onCancelFromReview = () => setStep("form");

  if (!isKycApproved) {
    return (
      <SafeAreaView className="flex-1 bg-bg-50">
        <ScrollView contentContainerClassName="flex-grow px-6 pt-6 pb-12">
          <Logo size="md" />
          <Text className="mt-8 text-3xl font-bold text-text-900">Verify first</Text>
          <Text className="mt-2 text-base text-text-500">
            You need an approved identity before you can send money. Complete the onboarding
            wizard and wait for a reviewer to confirm.
          </Text>
          <View className="mt-6">
            <Button onPress={() => router.push("/onboarding/otp")}>Continue verification</Button>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-bg-50">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        className="flex-1"
      >
        <ScrollView
          contentContainerClassName="flex-grow px-6 pt-6 pb-12"
          keyboardShouldPersistTaps="handled"
        >
          <Logo size="md" />

          {step === "form" && (
            <FormStep
              amount={amount}
              onAmountChange={setAmount}
              quote={quote}
              recipients={recipients}
              recipientId={recipientId}
              onRecipientChange={setRecipientId}
              loadError={loadError}
              onRetryLoad={load}
              onContinue={onContinueToReview}
            />
          )}

          {step === "review" && quote && selectedRecipient && rate && (
            <ReviewStep
              quote={quote}
              recipient={selectedRecipient}
              rateSource={rate.source}
              onBack={onCancelFromReview}
              onConfirm={onConfirmAndPay}
            />
          )}

          {step === "paying" && <PayingStep />}

          {step === "success" && transfer && (
            <SuccessStep
              transfer={transfer}
              onSendAnother={reset}
              onHome={() => {
                reset();
                router.push("/(tabs)/dashboard");
              }}
            />
          )}

          {step === "error" && (
            <ErrorStep
              message={error ?? "Something went wrong"}
              onRetry={() => setStep("review")}
              onHome={() => {
                reset();
                router.push("/(tabs)/dashboard");
              }}
            />
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ---------------------------------------------------------------------------

function FormStep({
  amount,
  onAmountChange,
  quote,
  recipients,
  recipientId,
  onRecipientChange,
  loadError,
  onRetryLoad,
  onContinue,
}: {
  amount: string;
  onAmountChange: (v: string) => void;
  quote: Quote | null;
  recipients: Recipient[] | null;
  recipientId: string | null;
  onRecipientChange: (id: string) => void;
  loadError: string | null;
  onRetryLoad: () => void;
  onContinue: () => void;
}) {
  const hasRecipients = (recipients?.length ?? 0) > 0;
  const canContinue = quote !== null && recipientId !== null && hasRecipients;

  return (
    <View>
      <Text className="mt-8 text-3xl font-bold text-text-900">Send money</Text>
      <Text className="mt-2 text-base text-text-500">
        Mid market rate. Disclosed spread. Quote locked for 60 minutes.
      </Text>

      <Card className="mt-6">
        <CardBody>
          <Text className="text-xs font-semibold uppercase tracking-widest text-text-500">
            You send
          </Text>
          <View className="mt-2 flex-row items-center">
            <Text className="text-4xl font-bold text-text-900">£</Text>
            <TextInput
              value={amount}
              onChangeText={(v) => onAmountChange(v.replace(/[^0-9.]/g, ""))}
              keyboardType="decimal-pad"
              placeholder="500"
              placeholderTextColor="#9BA8B8"
              className="ml-2 flex-1 text-4xl font-bold text-text-900"
            />
            <Text className="text-base text-text-500">GBP</Text>
          </View>

          <View className="my-4 h-px bg-border" />

          <Text className="text-xs font-semibold uppercase tracking-widest text-text-500">
            Recipient gets
          </Text>
          <View className="mt-1 flex-row items-baseline">
            <Text className="text-5xl font-bold text-primary-900">
              {quote ? formatPkr(quote.receiveAmount).replace("PKR ", "") : "·"}
            </Text>
            <Text className="ml-2 text-base text-text-500">PKR</Text>
          </View>
        </CardBody>
      </Card>

      <Text className="mt-8 text-xs font-semibold uppercase tracking-widest text-text-500">
        Send to
      </Text>
      {recipients === null && !loadError && (
        <View className="mt-3 flex-row items-center gap-2">
          <ActivityIndicator size="small" color="#0B2545" />
          <Text className="text-sm text-text-500">Loading recipients…</Text>
        </View>
      )}
      {loadError && (
        <View className="mt-3 rounded-xl bg-danger-100 px-4 py-3">
          <Text className="text-sm text-danger-500">{loadError}</Text>
          <Pressable onPress={onRetryLoad} style={{ marginTop: 6 }}>
            <Text className="text-sm font-semibold text-primary-700">Retry</Text>
          </Pressable>
        </View>
      )}

      {recipients && recipients.length === 0 && (
        <Card className="mt-3">
          <CardBody>
            <Text className="text-sm text-text-500">
              No recipients yet. Add one under the Recipients tab before you can send.
            </Text>
          </CardBody>
        </Card>
      )}

      {recipients && recipients.length > 0 && (
        <View className="mt-3 gap-2">
          {recipients.map((r) => {
            const selected = r.id === recipientId;
            return (
              <Pressable
                key={r.id}
                onPress={() => onRecipientChange(r.id)}
                style={{
                  borderWidth: selected ? 2 : 1,
                  borderColor: selected ? "#0B2545" : "#E6EAF0",
                  borderRadius: 14,
                  padding: 14,
                  backgroundColor: "#FFFFFF",
                }}
              >
                <Text className="text-base font-semibold text-text-900">{r.fullName}</Text>
                <Text className="mt-1 text-xs text-text-500">
                  {r.payoutMethod === "bank"
                    ? "Bank deposit"
                    : r.payoutMethod === "mobile_wallet"
                      ? "Mobile wallet"
                      : "Cash pickup"}
                  {r.nickname ? ` · ${r.nickname}` : ""}
                </Text>
              </Pressable>
            );
          })}
        </View>
      )}

      <View className="mt-8">
        <Button size="lg" disabled={!canContinue} onPress={onContinue}>
          Review transfer
        </Button>
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------

function ReviewStep({
  quote,
  recipient,
  rateSource,
  onBack,
  onConfirm,
}: {
  quote: Quote;
  recipient: Recipient;
  rateSource: string;
  onBack: () => void;
  onConfirm: () => void;
}) {
  return (
    <View>
      <Text className="mt-8 text-3xl font-bold text-text-900">Review and confirm</Text>
      <Text className="mt-2 text-base text-text-500">
        We will lock this rate for 60 minutes once you confirm.
      </Text>

      <Card className="mt-6">
        <CardBody>
          <View className="gap-5">
            <View>
              <Text className="text-xs font-semibold uppercase tracking-widest text-text-500">
                You send
              </Text>
              <Text className="text-3xl font-bold text-text-900">
                {formatGbp(quote.sendAmount)}
              </Text>
            </View>
            <View>
              <Text className="text-xs font-semibold uppercase tracking-widest text-text-500">
                Recipient gets
              </Text>
              <Text className="text-3xl font-bold text-primary-900">
                {formatPkr(quote.receiveAmount)}
              </Text>
            </View>
          </View>

          <View className="my-5 h-px bg-border" />

          <View className="gap-2">
            <Row label="Mid market rate" value={`1 GBP = ${formatRate(quote.midRate)} PKR`} />
            <Row
              label={`Our rate (spread ${quote.spreadPct.toFixed(2)}%)`}
              value={`1 GBP = ${formatRate(quote.effectiveRate)} PKR`}
            />
            <Row label="Fee" value={formatGbp(quote.fee)} />
            <View className="my-1 h-px bg-border" />
            <Row label="Total to pay" value={formatGbp(quote.total)} bold />
          </View>
        </CardBody>
      </Card>

      <Card className="mt-4">
        <CardBody>
          <Text className="text-xs font-semibold uppercase tracking-widest text-text-500">
            Sending to
          </Text>
          <Text className="mt-1 text-lg font-bold text-text-900">{recipient.fullName}</Text>
          <Text className="mt-1 text-sm text-text-500">
            {recipient.payoutMethod === "bank"
              ? "Bank deposit"
              : recipient.payoutMethod === "mobile_wallet"
                ? "Mobile wallet"
                : "Cash pickup"}
          </Text>
        </CardBody>
      </Card>

      <View className="mt-8 gap-3">
        <Button size="lg" onPress={onConfirm}>
          Confirm and pay
        </Button>
        <Button size="md" variant="ghost" onPress={onBack}>
          Back to edit
        </Button>
      </View>

      <Text className="mt-4 text-center text-xs text-text-500">
        Rate from {rateSource}. High value transfers are reviewed by our compliance team before
        delivery.
      </Text>
    </View>
  );
}

// ---------------------------------------------------------------------------

function PayingStep() {
  return (
    <View className="mt-12 items-center">
      <ActivityIndicator size="large" color="#0B2545" />
      <Text className="mt-4 text-xl font-bold text-text-900">Processing payment…</Text>
      <Text className="mt-2 text-center text-sm text-text-500">
        Charging your card through the dev payment provider and running AML checks.
      </Text>
    </View>
  );
}

// ---------------------------------------------------------------------------

function SuccessStep({
  transfer,
  onSendAnother,
  onHome,
}: {
  transfer: TransferDetail;
  onSendAnother: () => void;
  onHome: () => void;
}) {
  const isHeld = transfer.status === "compliance_hold";
  return (
    <View>
      <View
        style={{
          marginTop: 40,
          width: 72,
          height: 72,
          borderRadius: 36,
          alignSelf: "center",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: isHeld ? "#FFF7E0" : "#E6F4F0",
        }}
      >
        <Text style={{ fontSize: 32 }}>{isHeld ? "⏸" : "✓"}</Text>
      </View>

      <Text className="mt-6 text-center text-3xl font-bold text-text-900">
        {isHeld ? "On compliance hold" : "Transfer on its way"}
      </Text>
      <Text className="mt-2 text-center text-base text-text-500">
        {isHeld
          ? "Your transfer crossed an AML threshold and is being reviewed by compliance. You will get an email when it clears."
          : "Your transfer is with our payout partner in Pakistan. Expect delivery within minutes."}
      </Text>

      <Card className="mt-8">
        <CardBody>
          <View className="flex-row items-center justify-between">
            <Text className="font-mono text-sm text-text-500">{transfer.reference}</Text>
            <StatusPill status={transfer.status} />
          </View>
          <View className="mt-4 gap-2">
            <Row label="You sent" value={formatGbp(transfer.sendAmountGbp)} />
            <Row label="Recipient gets" value={formatPkr(transfer.receiveAmountPkr)} />
            <Row label="To" value={transfer.recipient.fullName} />
            <Row label="Total charged" value={formatGbp(transfer.totalChargedGbp)} bold />
          </View>
        </CardBody>
      </Card>

      <View className="mt-8 gap-3">
        <Button size="lg" onPress={onHome}>
          Back to home
        </Button>
        <Button size="md" variant="ghost" onPress={onSendAnother}>
          Send another
        </Button>
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------

function ErrorStep({
  message,
  onRetry,
  onHome,
}: {
  message: string;
  onRetry: () => void;
  onHome: () => void;
}) {
  return (
    <View>
      <View
        style={{
          marginTop: 40,
          width: 72,
          height: 72,
          borderRadius: 36,
          alignSelf: "center",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#FBEAEA",
        }}
      >
        <Text style={{ fontSize: 32 }}>!</Text>
      </View>

      <Text className="mt-6 text-center text-3xl font-bold text-text-900">
        Payment could not complete
      </Text>
      <Text className="mt-2 text-center text-base text-text-500">{message}</Text>

      <View className="mt-8 gap-3">
        <Button size="lg" onPress={onRetry}>
          Try again
        </Button>
        <Button size="md" variant="ghost" onPress={onHome}>
          Back to home
        </Button>
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------

function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <View className="flex-row items-center justify-between">
      <Text className="text-xs text-text-500">{label}</Text>
      <Text
        style={{ fontSize: bold ? 15 : 13, color: bold ? "#0B1A2C" : "#243447", fontWeight: bold ? "700" : "500" }}
      >
        {value}
      </Text>
    </View>
  );
}
