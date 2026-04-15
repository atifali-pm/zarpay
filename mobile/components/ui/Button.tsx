import { ReactNode } from "react";
import { ActivityIndicator, Pressable, Text, View, type PressableProps } from "react-native";

type Variant = "primary" | "secondary" | "ghost" | "destructive" | "accent" | "dark";
type Size = "sm" | "md" | "lg";

/**
 * Button uses a View wrapper for visual styling and an inner Pressable for
 * touch handling. NativeWind 4's JSX interop patches Pressable to accept
 * className and, in doing so, does not reliably pass through function-form
 * style props (style={({ pressed }) => ({ ... })}) in some contexts. Putting
 * backgroundColor, borderRadius, height, etc. on the outer View with a plain
 * object style avoids the issue entirely and is functionally identical to the
 * previous approach.
 */
const VARIANT_STYLES: Record<
  Variant,
  { backgroundColor: string; borderColor?: string; borderWidth?: number; textColor: string }
> = {
  primary: { backgroundColor: "#0B2545", textColor: "#FFFFFF" },
  secondary: {
    backgroundColor: "#FFFFFF",
    borderColor: "#C9D1DC",
    borderWidth: 1,
    textColor: "#0B1A2C",
  },
  ghost: { backgroundColor: "transparent", textColor: "#0B2545" },
  destructive: { backgroundColor: "#D64545", textColor: "#FFFFFF" },
  accent: { backgroundColor: "#FFB400", textColor: "#0B1A2C" },
  dark: { backgroundColor: "#111827", textColor: "#FFFFFF" },
};

const SIZE_STYLES: Record<
  Size,
  { height: number; paddingHorizontal: number; fontSize: number }
> = {
  sm: { height: 40, paddingHorizontal: 16, fontSize: 14 },
  md: { height: 48, paddingHorizontal: 20, fontSize: 16 },
  lg: { height: 56, paddingHorizontal: 24, fontSize: 18 },
};

interface ButtonProps extends Omit<PressableProps, "children" | "style"> {
  children: ReactNode;
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  fullWidth?: boolean;
}

export function Button({
  children,
  variant = "primary",
  size = "md",
  loading,
  disabled,
  fullWidth = true,
  onPress,
  ...rest
}: ButtonProps) {
  const isDisabled = disabled || loading;
  const variantStyle = VARIANT_STYLES[variant];
  const sizeStyle = SIZE_STYLES[size];

  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        borderRadius: 14,
        height: sizeStyle.height,
        paddingHorizontal: sizeStyle.paddingHorizontal,
        width: fullWidth ? "100%" : undefined,
        backgroundColor: variantStyle.backgroundColor,
        borderColor: variantStyle.borderColor,
        borderWidth: variantStyle.borderWidth ?? 0,
        opacity: isDisabled ? 0.75 : 1,
        overflow: "hidden",
      }}
    >
      <Pressable
        {...rest}
        onPress={isDisabled ? undefined : onPress}
        style={{
          width: "100%",
          height: "100%",
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {loading ? (
          <ActivityIndicator size="small" color={variantStyle.textColor} />
        ) : (
          <Text
            style={{
              color: variantStyle.textColor,
              fontSize: sizeStyle.fontSize,
              fontWeight: "600",
            }}
          >
            {children}
          </Text>
        )}
      </Pressable>
    </View>
  );
}
