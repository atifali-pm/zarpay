import { useEffect, useState } from "react";
import { ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import type { CreateRecipientRequest, Recipient } from "@zarpay/types";
import { api, ApiClientError } from "@/lib/api";
import { Logo } from "@/components/ui/Logo";
import { RecipientForm } from "@/components/recipients/RecipientForm";

type LoadState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ok"; recipient: Recipient };

export default function EditRecipientScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id: string }>();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;
  const [state, setState] = useState<LoadState>({ status: "loading" });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    void (async () => {
      if (!id) {
        setState({ status: "error", message: "Missing recipient id" });
        return;
      }
      try {
        const recipient = await api.getRecipient(id);
        setState({ status: "ok", recipient });
      } catch (err) {
        setState({
          status: "error",
          message: err instanceof Error ? err.message : "Failed to load",
        });
      }
    })();
  }, [id]);

  const onSubmit = async (payload: CreateRecipientRequest) => {
    if (!id) return;
    setSubmitting(true);
    setError(null);
    setFieldErrors({});
    try {
      await api.updateRecipient(id, payload);
      router.back();
    } catch (err) {
      if (err instanceof ApiClientError && err.code === "VALIDATION" && err.details) {
        const mapped: Record<string, string> = {};
        for (const [key, value] of Object.entries(err.details)) {
          mapped[key] = Array.isArray(value) ? value[0] : String(value);
        }
        setFieldErrors(mapped);
      } else if (err instanceof Error) {
        setError(err.message);
      }
    } finally {
      setSubmitting(false);
    }
  };

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
          <View className="mb-6 flex-row items-center justify-between">
            <Logo size="md" />
            <Text
              className="text-sm font-semibold text-primary-700"
              onPress={() => router.back()}
            >
              Cancel
            </Text>
          </View>

          <Text className="text-3xl font-bold text-text-900">Edit recipient</Text>
          <Text className="mt-2 text-base text-text-500">
            Update the details. Changes apply to future transfers.
          </Text>

          {state.status === "loading" && (
            <View className="mt-10 flex-row items-center justify-center gap-2">
              <ActivityIndicator size="small" color="#0B2545" />
              <Text className="text-sm text-text-500">Loading…</Text>
            </View>
          )}

          {state.status === "error" && (
            <View className="mt-6 rounded-xl bg-danger-100 px-4 py-3">
              <Text className="text-sm text-danger-500">{state.message}</Text>
            </View>
          )}

          {state.status === "ok" && (
            <View className="mt-8">
              <RecipientForm
                initial={state.recipient}
                submitLabel="Save changes"
                submitting={submitting}
                error={error}
                fieldErrors={fieldErrors}
                onSubmit={onSubmit}
              />
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
