import { Text, View } from "react-native";

interface LogoProps {
  size?: "sm" | "md" | "lg";
}

const SIZES: Record<NonNullable<LogoProps["size"]>, string> = {
  sm: "text-xl",
  md: "text-2xl",
  lg: "text-4xl",
};

export function Logo({ size = "md" }: LogoProps) {
  return (
    <View className="flex-row">
      <Text className={`font-bold ${SIZES[size]} text-accent-500`}>Z</Text>
      <Text className={`font-bold ${SIZES[size]} text-primary-900`}>arpay</Text>
    </View>
  );
}
