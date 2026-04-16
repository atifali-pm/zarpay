import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

/**
 * Bottom tab shell for the authenticated sender area.
 * Home + Send + History + Recipients.
 *
 * Height expands to include the device's bottom safe area so the tap
 * targets sit above Android's gesture navigation bar. Without this, a
 * fixed height pushes the icons into the system nav area and taps are
 * swallowed by the OS.
 */
export default function TabsLayout() {
  const insets = useSafeAreaInsets();
  const bottomInset = Math.max(insets.bottom, 8);
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: "#0B2545",
        tabBarInactiveTintColor: "#9BA8B8",
        tabBarStyle: {
          borderTopColor: "#E6EAF0",
          paddingTop: 8,
          paddingBottom: bottomInset,
          height: 58 + bottomInset,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "600",
        },
      }}
    >
      <Tabs.Screen
        name="dashboard"
        options={{
          title: "Home",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home-outline" size={size ?? 22} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="send"
        options={{
          title: "Send",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="paper-plane-outline" size={size ?? 22} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="transfers"
        options={{
          title: "History",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="time-outline" size={size ?? 22} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="recipients"
        options={{
          title: "Recipients",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="people-outline" size={size ?? 22} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
