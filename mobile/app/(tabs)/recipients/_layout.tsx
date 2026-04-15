import { Stack } from "expo-router";

export default function RecipientsStackLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: "#F6F8FB" },
      }}
    />
  );
}
