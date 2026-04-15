import { useState } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import type { CreateRecipientRequest } from "@zarpay/types";
import { api, ApiClientError } from "@/lib/api";
import { Logo } from "@/components/ui/Logo";
import { RecipientForm } from "@/components/recipients/RecipientForm";

export default function NewRecipientScreen() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const onSubmit = async (payload: CreateRecipientRequest) => {
    setSubmitting(true);
    setError(null);
    setFieldErrors({});
    try {
      await api.createRecipient(payload);
      router.back();
    } catch (err) {
      if (err instanceof ApiClientError && err.code === "VALIDATION" && err.details) {
        const mapped: Record<string, string> = {};
        for (const [key, value] of Object.entries(err.details)) {
          mapped[key] = Array.isArray(value) ? value[0] : String(value);
        }
        setFieldErrors(mapped);
      } else if (err instanceof ApiClientError) {
        setError(err.message);
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Could not save");
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

          <Text className="text-3xl font-bold text-text-900">Add a recipient</Text>
          <Text className="mt-2 text-base text-text-500">
            Save bank accounts, mobile wallets, or cash pickup destinations for quick sending.
          </Text>

          <View className="mt-8">
            <RecipientForm
              submitLabel="Save recipient"
              submitting={submitting}
              error={error}
              fieldErrors={fieldErrors}
              onSubmit={onSubmit}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
