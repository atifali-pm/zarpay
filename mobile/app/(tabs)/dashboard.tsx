import { ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/Button";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Logo } from "@/components/ui/Logo";

type KycStatus = "unverified" | "pending" | "approved" | "rejected";

const KYC_LABEL: Record<KycStatus, string> = {
  unverified: "Verify your identity",
  pending: "Under review",
  approved: "Verified",
  rejected: "Rejected",
};

export default function DashboardScreen() {
  const router = useRouter();
  const { state, signOut } = useAuth();

  if (state.status !== "authenticated") {
    return null;
  }

  const user = state.user;
  const firstName = user.fullName.split(" ")[0];

  return (
    <SafeAreaView className="flex-1 bg-bg-50">
      <ScrollView contentContainerClassName="flex-grow px-6 pt-6 pb-12">
        <View className="flex-row items-start justify-between">
          <Logo size="md" />
          <Text
            className="text-sm font-semibold text-primary-700"
            onPress={() => {
              void signOut();
            }}
          >
            Log out
          </Text>
        </View>

        <Text className="mt-8 text-base text-text-500">Welcome back,</Text>
        <Text className="text-3xl font-bold text-text-900">{firstName}</Text>

        {user.kycStatus !== "approved" && (
          <View
            className={`mt-6 rounded-2xl p-5 ${
              user.kycStatus === "rejected" ? "bg-danger-100" : "bg-warning-100"
            }`}
          >
            <Text className="text-xs font-semibold uppercase tracking-widest text-text-500">
              Identity verification
            </Text>
            <Text className="mt-1 text-lg font-bold text-text-900">
              {KYC_LABEL[user.kycStatus as KycStatus]}
            </Text>
            <Text className="mt-1 text-sm text-text-700">
              {user.kycStatus === "unverified"
                ? "Verify your phone and upload your ID before sending your first transfer."
                : user.kycStatus === "pending"
                  ? "Your documents are under review. You will get an email the moment a reviewer decides."
                  : "Your verification was not accepted. Please re-submit fresh copies of your ID."}
            </Text>
            {user.kycStatus === "unverified" && (
              <View className="mt-4">
                <Button size="md" onPress={() => router.push("/onboarding/otp")}>
                  Continue verification
                </Button>
              </View>
            )}
          </View>
        )}

        <View className="mt-8 flex-row gap-3">
          <StatCard label="Total sent" value="£0.00" />
          <StatCard label="Transfers" value="0" />
        </View>

        <Card className="mt-6">
          <CardHeader title="Send money to Pakistan" description="Mid market rate, disclosed spread" />
          <CardBody>
            <Text className="text-sm text-text-500">
              Bank deposit, mobile wallet, or cash pickup. Quote locked for 60 minutes.
            </Text>
            <View className="mt-4">
              <Button
                size="lg"
                variant={user.kycStatus === "approved" ? "accent" : "secondary"}
                disabled={user.kycStatus !== "approved"}
                onPress={() => router.push("/(tabs)/dashboard")}
              >
                {user.kycStatus === "approved" ? "Start a transfer" : "Verify first to send"}
              </Button>
            </View>
          </CardBody>
        </Card>

        <Card className="mt-6">
          <CardHeader title="Recent transfers" description="Your last transfers will show here" />
          <CardBody>
            <Text className="text-center text-sm text-text-500">
              No transfers yet. Start your first one once identity verification is complete.
            </Text>
          </CardBody>
        </Card>

        <View className="mt-8 rounded-xl bg-primary-100 px-4 py-3">
          <Text className="text-xs font-semibold text-primary-900">Logged in as</Text>
          <Text className="mt-1 text-sm text-primary-900">{user.email}</Text>
          <Text className="text-xs text-primary-900">
            Role: {user.role} · KYC tier {user.kycTier}
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-1 rounded-2xl border border-border bg-white p-4">
      <Text className="text-xs font-semibold uppercase tracking-widest text-text-500">
        {label}
      </Text>
      <Text className="mt-2 text-2xl font-bold text-text-900">{value}</Text>
    </View>
  );
}
