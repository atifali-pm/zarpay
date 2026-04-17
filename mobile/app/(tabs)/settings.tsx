import { useCallback, useEffect, useState } from "react";
import { Alert, Pressable, ScrollView, Switch, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import Constants from "expo-constants";
import { useAuth } from "@/lib/auth";
import {
  isBiometricAvailable,
  isBiometricEnabled,
  promptBiometric,
  setBiometricEnabled,
} from "@/lib/biometric";
import { requestNotificationPermission } from "@/lib/notifications";
import { Logo } from "@/components/ui/Logo";
import { Button } from "@/components/ui/Button";
import { Card, CardBody } from "@/components/ui/Card";

export default function SettingsScreen() {
  const router = useRouter();
  const { state, signOut } = useAuth();
  const tabBarHeight = useBottomTabBarHeight();

  const [bioAvailable, setBioAvailable] = useState(false);
  const [bioEnabled, setBioEnabled] = useState(false);
  const [notifGranted, setNotifGranted] = useState(false);

  useEffect(() => {
    void (async () => {
      const avail = await isBiometricAvailable();
      setBioAvailable(avail);
      if (avail) {
        const on = await isBiometricEnabled();
        setBioEnabled(on);
      }
    })();
  }, []);

  const toggleBiometric = useCallback(async (newValue: boolean) => {
    if (newValue) {
      const ok = await promptBiometric();
      if (!ok) return;
    }
    await setBiometricEnabled(newValue);
    setBioEnabled(newValue);
  }, []);

  const enableNotifications = useCallback(async () => {
    const granted = await requestNotificationPermission();
    setNotifGranted(granted);
    if (granted) {
      Alert.alert(
        "Notifications enabled",
        "You will see local notifications when a transfer status changes. Production push notifications use the same Expo channel at zero cost.",
      );
    } else {
      Alert.alert(
        "Permission denied",
        "Open Android Settings for Expo Go and enable Notifications to receive transfer updates.",
      );
    }
  }, []);

  if (state.status !== "authenticated") return null;
  const user = state.user;

  return (
    <SafeAreaView className="flex-1 bg-bg-50">
      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
          paddingHorizontal: 24,
          paddingTop: 24,
          paddingBottom: tabBarHeight + 24,
        }}
      >
        <Logo size="md" />
        <Text className="mt-8 text-3xl font-bold text-text-900">Settings</Text>

        <Card className="mt-6">
          <CardBody>
            <Text style={{ fontSize: 11, fontWeight: "600", letterSpacing: 1, color: "#5B6B7F" }}>
              ACCOUNT
            </Text>
            <View style={{ marginTop: 12, gap: 8 }}>
              <Row label="Name" value={user.fullName} />
              <Row label="Email" value={user.email} />
              <Row label="Phone" value={user.phone ?? "Not set"} />
              <Row label="KYC" value={user.kycStatus} />
              <Row label="Role" value={user.role} />
            </View>
          </CardBody>
        </Card>

        <Card className="mt-4">
          <CardBody>
            <Text style={{ fontSize: 11, fontWeight: "600", letterSpacing: 1, color: "#5B6B7F" }}>
              SECURITY
            </Text>
            <View style={{ marginTop: 12, gap: 16 }}>
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 15, fontWeight: "600", color: "#0B1A2C" }}>
                    Biometric unlock
                  </Text>
                  <Text style={{ marginTop: 2, fontSize: 12, color: "#5B6B7F" }}>
                    {bioAvailable
                      ? "Use fingerprint or face to unlock the app"
                      : "Not available on this device"}
                  </Text>
                </View>
                <Switch
                  value={bioEnabled}
                  onValueChange={toggleBiometric}
                  disabled={!bioAvailable}
                  trackColor={{ false: "#C9D1DC", true: "#0B2545" }}
                  thumbColor="#FFFFFF"
                />
              </View>

              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 15, fontWeight: "600", color: "#0B1A2C" }}>
                    Transfer notifications
                  </Text>
                  <Text style={{ marginTop: 2, fontSize: 12, color: "#5B6B7F" }}>
                    Get notified when a transfer status changes
                  </Text>
                </View>
                <Pressable
                  onPress={enableNotifications}
                  style={{
                    backgroundColor: notifGranted ? "#E6F4F0" : "#E8EEF7",
                    paddingHorizontal: 12,
                    paddingVertical: 6,
                    borderRadius: 8,
                  }}
                >
                  <Text style={{ fontSize: 12, fontWeight: "600", color: notifGranted ? "#1F8A70" : "#0B2545" }}>
                    {notifGranted ? "Enabled" : "Enable"}
                  </Text>
                </Pressable>
              </View>
            </View>
          </CardBody>
        </Card>

        <Card className="mt-4">
          <CardBody>
            <Text style={{ fontSize: 11, fontWeight: "600", letterSpacing: 1, color: "#5B6B7F" }}>
              DEV INFO
            </Text>
            <View style={{ marginTop: 12, gap: 8 }}>
              <Row label="Expo SDK" value={Constants.expoConfig?.sdkVersion ?? "unknown"} />
              <Row label="App version" value={Constants.expoConfig?.version ?? "0.1.0"} />
              <Row label="API" value={Constants.expoConfig?.hostUri ?? "localhost"} />
              <Row label="Platform" value={`Android (React Native ${require("react-native/package.json").version})`} />
              <Row label="Providers" value="All dev stubs, zero cost" />
            </View>
          </CardBody>
        </Card>

        <View style={{ marginTop: 24 }}>
          <Button variant="destructive" onPress={() => {
            Alert.alert("Log out?", "You will need to sign in again.", [
              { text: "Cancel", style: "cancel" },
              { text: "Log out", style: "destructive", onPress: () => void signOut() },
            ]);
          }}>
            Log out
          </Button>
        </View>

        <Text style={{ marginTop: 24, textAlign: "center", fontSize: 11, color: "#9BA8B8" }}>
          Zarpay is a portfolio product. All payment, KYC, OTP, email, and SMS providers are dev
          stubs. No real money moves. Going live requires a UK FCA authorization and a Pakistani
          delivery partner.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
      <Text style={{ fontSize: 13, color: "#5B6B7F" }}>{label}</Text>
      <Text style={{ fontSize: 13, fontWeight: "500", color: "#0B1A2C", textAlign: "right", flexShrink: 1, marginLeft: 16 }}>
        {value}
      </Text>
    </View>
  );
}
