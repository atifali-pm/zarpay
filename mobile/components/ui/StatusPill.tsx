import { Text, View } from "react-native";
import { transferStatusColors, transferStatusLabel } from "@/lib/format";

export function StatusPill({ status }: { status: string }) {
  const colors = transferStatusColors(status);
  return (
    <View
      style={{
        backgroundColor: colors.bg,
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 999,
        alignSelf: "flex-start",
      }}
    >
      <Text style={{ fontSize: 11, fontWeight: "700", color: colors.fg }}>
        {transferStatusLabel(status)}
      </Text>
    </View>
  );
}
