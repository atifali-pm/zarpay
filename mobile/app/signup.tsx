import { useState } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Link, useRouter } from "expo-router";
import { useAuth } from "@/lib/auth";
import { ApiClientError } from "@/lib/api";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Logo } from "@/components/ui/Logo";

export default function SignUpScreen() {
  const router = useRouter();
  const { signUp } = useAuth();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async () => {
    setError(null);
    setFieldErrors({});
    setSubmitting(true);
    try {
      await signUp({
        fullName: fullName.trim(),
        email: email.trim(),
        phone: phone.replace(/\s|-/g, ""),
        password,
      });
      // Layout redirects to /onboarding/otp on first authenticated mount
      // because the new user has kycStatus === "unverified".
    } catch (err) {
      if (err instanceof ApiClientError) {
        if (err.code === "VALIDATION" && err.details) {
          const mapped: Record<string, string> = {};
          for (const [key, value] of Object.entries(err.details)) {
            mapped[key] = Array.isArray(value) ? value[0] : String(value);
          }
          setFieldErrors(mapped);
        } else if (err.code === "EMAIL_TAKEN") {
          setFieldErrors({ email: "An account with that email already exists." });
        } else {
          setError(err.message);
        }
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

          <Text className="text-3xl font-bold text-text-900">Create your account</Text>
          <Text className="mt-2 text-base text-text-500">
            We need a few details to verify who you are. This takes about 3 minutes.
          </Text>

          <View className="mt-8 gap-4">
            <Input
              label="Full name"
              required
              autoCapitalize="words"
              autoComplete="name"
              placeholder="Sara Khan"
              value={fullName}
              onChangeText={setFullName}
              errorText={fieldErrors.fullName}
            />
            <Input
              label="Email"
              required
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              placeholder="you@example.com"
              value={email}
              onChangeText={setEmail}
              errorText={fieldErrors.email}
            />
            <Input
              label="Phone (with country code)"
              required
              keyboardType="phone-pad"
              autoComplete="tel"
              placeholder="+447123456789"
              helperText="Include the country code so we can send you a verification code."
              value={phone}
              onChangeText={setPhone}
              errorText={fieldErrors.phone}
            />
            <Input
              label="Password"
              required
              secureTextEntry
              autoComplete="new-password"
              placeholder="At least 8 characters"
              value={password}
              onChangeText={setPassword}
              errorText={fieldErrors.password}
            />

            {error && (
              <View className="rounded-xl bg-danger-100 px-4 py-3">
                <Text className="text-sm text-danger-500">{error}</Text>
              </View>
            )}

            <Button size="lg" loading={submitting} onPress={onSubmit}>
              Create account
            </Button>

            <View className="flex-row justify-center">
              <Text className="text-sm text-text-500">Already have an account? </Text>
              <Link href="/signin" asChild>
                <Text className="text-sm font-semibold text-primary-700">Log in</Text>
              </Link>
            </View>

            <Text className="mt-2 text-center text-xs text-text-500">
              By signing up you agree to the placeholder Terms and Privacy notice. This is a
              portfolio build.
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
