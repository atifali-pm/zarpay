import { Tabs } from "expo-router";
import { Text } from "react-native";

/**
 * Bottom tab shell for the authenticated sender area. Only Dashboard is wired
 * in Evening 2. Send / Recipients / Transfers / Profile come in later evenings.
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
          tabBarIcon: ({ color }) => <TabLabel color={color}>●</TabLabel>,
        }}
      />
    </Tabs>
  );
}

function TabLabel({ color, children }: { color: string; children: string }) {
  return <Text style={{ color, fontSize: 18 }}>{children}</Text>;
}
