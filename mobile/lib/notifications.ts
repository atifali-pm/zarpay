import { Platform } from "react-native";
import * as Notifications from "expo-notifications";

/**
 * Local notification helpers. For the demo, notifications are fired
 * client-side when the dashboard detects a transfer state change on
 * refresh. Production would use server-side Expo push via stored push
 * tokens. Zero cost either way (Expo push service is free).
 */

if (Platform.OS !== "web") {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
}

export async function requestNotificationPermission(): Promise<boolean> {
  if (Platform.OS === "web") return true;
  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("transfers", {
      name: "Transfers",
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
    });
  }
  const { status: existing } = await Notifications.getPermissionsAsync();
  if (existing === "granted") return true;
  const { status } = await Notifications.requestPermissionsAsync();
  return status === "granted";
}

export async function showTransferNotification(
  reference: string,
  status: string,
): Promise<void> {
  if (Platform.OS === "web") return;
  const statusLabels: Record<string, string> = {
    funded: "Payment received",
    compliance_hold: "Held for compliance review",
    in_transit: "On its way to the recipient",
    delivered: "Delivered",
    cancelled: "Cancelled",
    rejected: "Rejected",
  };
  const body = statusLabels[status] ?? `Status: ${status}`;
  await Notifications.scheduleNotificationAsync({
    content: {
      title: `Transfer ${reference}`,
      body,
      data: { reference, status },
    },
    trigger: null, // fire immediately
  });
}
