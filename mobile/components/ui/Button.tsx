import { ReactNode } from "react";
import { ActivityIndicator, Pressable, Text, View, type PressableProps } from "react-native";

type Variant = "primary" | "secondary" | "ghost" | "destructive" | "accent";
type Size = "sm" | "md" | "lg";

/**
 * NativeWind 4 does not reliably apply class names that come from a lookup
 * object on Pressable via the `className` prop (the styles render as text
 * without the background fill). Inline RN `style` props always work, so we
 * resolve colors and sizes that way instead. Layout-only utilities could
 * still use className, but keeping everything in style avoids surprises.
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
  ...rest
}: ButtonProps) {
  const isDisabled = disabled || loading;
  const variantStyle = VARIANT_STYLES[variant];
  const sizeStyle = SIZE_STYLES[size];

  return (
    <Pressable
      {...rest}
      disabled={isDisabled}
      style={({ pressed }) => ({
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
        opacity: isDisabled ? 0.5 : pressed ? 0.85 : 1,
      })}
    >
      {loading ? (
        <ActivityIndicator size="small" color={variantStyle.textColor} />
      ) : (
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <Text
            style={{
              color: variantStyle.textColor,
              fontSize: sizeStyle.fontSize,
              fontWeight: "600",
            }}
          >
            {children}
          </Text>
        </View>
      )}
    </Pressable>
  );
}
