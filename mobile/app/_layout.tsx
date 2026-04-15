import { useEffect } from "react";
import { View, ActivityIndicator } from "react-native";
import { Stack, useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { AuthProvider, useAuth } from "@/lib/auth";
import "../global.css";

/**
 * Root layout. Wraps the navigation stack in AuthProvider and routes
 * unauthenticated users back to the landing screen if they try to reach an
 * authenticated area, and routes authenticated users into the dashboard on
 * launch so they do not land on the marketing surface.
 */
function ProtectedStack() {
  const { state } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (state.status === "loading") return;

    const inProtectedArea = segments[0] === "(tabs)";
    const inOnboarding = segments[0] === "onboarding";

    if (state.status === "unauthenticated" && (inProtectedArea || inOnboarding)) {
      router.replace("/");
      return;
    }

    if (state.status === "authenticated") {
      const onAuthScreen = segments[0] === "signin" || segments[0] === "signup";
      // segments[0] for the landing screen (`app/index.tsx`) is `undefined`,
      // for `/signin` it is `"signin"`, for `/(tabs)/dashboard` it is `"(tabs)"`.
      const onPublicLanding = segments[0] === undefined;
      if (onPublicLanding || onAuthScreen) {
        if (state.user.kycStatus === "unverified") {
          router.replace("/onboarding/otp");
        } else {
          router.replace("/(tabs)/dashboard");
        }
      }
    }
  }, [state, segments, router]);

  if (state.status === "loading") {
    return (
      <View className="flex-1 items-center justify-center bg-bg-50">
        <ActivityIndicator size="large" color="#0B2545" />
      </View>
    );
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: "#F6F8FB" },
      }}
    />
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      <AuthProvider>
        <ProtectedStack />
      </AuthProvider>
    </SafeAreaProvider>
  );
}
