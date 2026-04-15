import { useEffect, useState } from "react";
import { ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useAuth } from "@/lib/auth";
import { api, ApiClientError } from "@/lib/api";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Logo } from "@/components/ui/Logo";

type ChallengeState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; challengeId: string };

export default function OtpScreen() {
  const router = useRouter();
  const { state: authState, refresh, signOut } = useAuth();
  const [challenge, setChallenge] = useState<ChallengeState>({ status: "loading" });
  const [code, setCode] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [verifyError, setVerifyError] = useState<string | null>(null);

  const requestNewChallenge = async () => {
    setChallenge({ status: "loading" });
    setVerifyError(null);
    try {
      const { challengeId } = await api.sendOtp();
      setChallenge({ status: "ready", challengeId });
    } catch (err) {
      setChallenge({
        status: "error",
        message: err instanceof Error ? err.message : "Could not send code",
      });
    }
  };

  useEffect(() => {
    void requestNewChallenge();
  }, []);

  const onVerify = async () => {
    if (challenge.status !== "ready") return;
    setVerifyError(null);
    setSubmitting(true);
    try {
      await api.verifyOtp({ challengeId: challenge.challengeId, code });
      // Phone verified. Next step is KYC document capture.
      await refresh();
      router.replace("/onboarding/kyc");
    } catch (err) {
      if (err instanceof ApiClientError) {
        setVerifyError(err.message);
      } else if (err instanceof Error) {
        setVerifyError(err.message);
      } else {
        setVerifyError("Could not verify the code");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const phone =
    authState.status === "authenticated" ? authState.user.phone ?? "your phone" : "your phone";

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
          <View className="mb-8 flex-row items-center justify-between">
            <Logo size="md" />
            <Text
              className="text-sm font-semibold text-primary-700"
              onPress={() => {
                void signOut();
                router.replace("/");
              }}
            >
              Cancel
            </Text>
          </View>

          <Text className="text-3xl font-bold text-text-900">Verify your phone</Text>
          <Text className="mt-2 text-base text-text-500">
            We sent a 6 digit code to {phone}. Enter it below to continue.
          </Text>

          <View className="mt-4 rounded-xl bg-primary-100 px-4 py-3">
            <Text className="text-xs font-semibold text-primary-900">Dev tip</Text>
            <Text className="mt-1 text-xs text-primary-900">
              The dev OTP provider accepts any 6 digits. Try 123456.
            </Text>
          </View>

          <View className="mt-8 gap-4">
            {challenge.status === "loading" && (
              <View className="flex-row items-center gap-2">
                <ActivityIndicator size="small" color="#0B2545" />
                <Text className="text-sm text-text-500">Sending code…</Text>
              </View>
            )}

            {challenge.status === "error" && (
              <View className="rounded-xl bg-danger-100 px-4 py-3">
                <Text className="text-sm text-danger-500">{challenge.message}</Text>
              </View>
            )}

            <Input
              label="6 digit code"
              required
              keyboardType="number-pad"
              maxLength={6}
              placeholder="123456"
              value={code}
              onChangeText={(v) => setCode(v.replace(/[^0-9]/g, ""))}
              errorText={verifyError ?? undefined}
            />

            <Button
              size="lg"
              loading={submitting}
              disabled={code.length !== 6 || challenge.status !== "ready"}
              onPress={onVerify}
            >
              Verify and continue
            </Button>

            <Button size="md" variant="ghost" onPress={requestNewChallenge}>
              Send a new code
            </Button>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
