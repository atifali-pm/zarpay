import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

/**
 * Bottom tab shell for the authenticated sender area.
 * Home + Send + Recipients so far. Transfers history comes in Evening 6.
 */
export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: "#0B2545",
        tabBarInactiveTintColor: "#9BA8B8",
        tabBarStyle: {
          borderTopColor: "#E6EAF0",
          paddingTop: 6,
          height: 64,
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
