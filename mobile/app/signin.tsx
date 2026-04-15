import { useState } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Link, useRouter } from "expo-router";
import { useAuth } from "@/lib/auth";
import { ApiClientError } from "@/lib/api";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Logo } from "@/components/ui/Logo";

export default function SignInScreen() {
  const router = useRouter();
  const { signIn } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async () => {
    setError(null);
    setSubmitting(true);
    try {
      await signIn(email.trim(), password);
      // The root layout will redirect to dashboard once state flips to authenticated.
    } catch (err) {
      if (err instanceof ApiClientError && err.status === 401) {
        setError("Email or password is incorrect.");
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Something went wrong. Please try again.");
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
          <View className="mb-8 flex-row items-center justify-between">
            <Logo size="md" />
            <Text
              className="text-sm font-semibold text-primary-700"
              onPress={() => router.back()}
            >
              Back
            </Text>
          </View>

          <Text className="text-3xl font-bold text-text-900">Welcome back</Text>
          <Text className="mt-2 text-base text-text-500">
            Log in to send money to Pakistan at the mid market rate.
          </Text>

          <View className="mt-8 gap-4">
            <Input
              label="Email"
              required
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              placeholder="you@example.com"
              value={email}
              onChangeText={setEmail}
            />
            <Input
              label="Password"
              required
              secureTextEntry
              autoComplete="password"
              placeholder="••••••••"
              value={password}
              onChangeText={setPassword}
            />

            {error && (
              <View className="rounded-xl bg-danger-100 px-4 py-3">
                <Text className="text-sm text-danger-500">{error}</Text>
              </View>
            )}

            <Button size="lg" loading={submitting} onPress={onSubmit}>
              Log in
            </Button>

            <View className="flex-row justify-center">
              <Text className="text-sm text-text-500">Don't have an account? </Text>
              <Link href="/signup" asChild>
                <Text className="text-sm font-semibold text-primary-700">Sign up</Text>
              </Link>
            </View>
          </View>

          <View className="mt-10 rounded-xl bg-primary-100 px-4 py-3">
            <Text className="text-xs font-semibold text-primary-900">Demo accounts</Text>
            <Text className="mt-1 text-xs text-primary-900">
              sender@zarpay.dev / password123 (approved sender){"\n"}
              newbie@example.com / password123 (unverified)
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
