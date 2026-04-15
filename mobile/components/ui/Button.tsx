import { ReactNode } from "react";
import { ActivityIndicator, Pressable, Text, type PressableProps } from "react-native";

type Variant = "primary" | "secondary" | "ghost" | "destructive" | "accent";
type Size = "sm" | "md" | "lg";

const VARIANT_CLASS: Record<Variant, string> = {
  primary: "bg-primary-900 active:bg-primary-700",
  secondary: "bg-white border border-border-strong active:bg-bg-50",
  ghost: "bg-transparent active:bg-primary-100",
  destructive: "bg-danger-500 active:bg-danger-600",
  accent: "bg-accent-500 active:bg-accent-600",
};

const VARIANT_TEXT_CLASS: Record<Variant, string> = {
  primary: "text-white",
  secondary: "text-text-900",
  ghost: "text-primary-900",
  destructive: "text-white",
  accent: "text-text-900",
};

const SIZE_CLASS: Record<Size, string> = {
  sm: "h-10 px-4",
  md: "h-12 px-5",
  lg: "h-14 px-6",
};

const SIZE_TEXT_CLASS: Record<Size, string> = {
  sm: "text-sm",
  md: "text-base",
  lg: "text-lg",
};

interface ButtonProps extends Omit<PressableProps, "children"> {
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
  return (
    <Pressable
      {...rest}
      disabled={isDisabled}
      className={[
        "flex-row items-center justify-center rounded-xl",
        VARIANT_CLASS[variant],
        SIZE_CLASS[size],
        fullWidth ? "w-full" : "",
        isDisabled ? "opacity-50" : "",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={variant === "primary" || variant === "destructive" ? "#ffffff" : "#0B2545"}
        />
      ) : (
        <Text className={`font-semibold ${SIZE_TEXT_CLASS[size]} ${VARIANT_TEXT_CLASS[variant]}`}>
          {children}
        </Text>
      )}
    </Pressable>
  );
}
