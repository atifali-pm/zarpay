import { type ReactNode } from "react";
import { Text, View, type ViewProps } from "react-native";

interface CardProps extends ViewProps {
  children: ReactNode;
}

export function Card({ children, className, ...rest }: CardProps) {
  return (
    <View
      {...rest}
      className={`rounded-2xl border border-border bg-white ${className ?? ""}`}
    >
      {children}
    </View>
  );
}

interface CardHeaderProps {
  title: string;
  description?: string;
}

export function CardHeader({ title, description }: CardHeaderProps) {
  return (
    <View className="border-b border-border px-5 pb-4 pt-5">
      <Text className="text-lg font-bold text-text-900">{title}</Text>
      {description && <Text className="mt-1 text-sm text-text-500">{description}</Text>}
    </View>
  );
}

interface CardBodyProps {
  children: ReactNode;
  className?: string;
}

export function CardBody({ children, className }: CardBodyProps) {
  return <View className={`p-5 ${className ?? ""}`}>{children}</View>;
}
