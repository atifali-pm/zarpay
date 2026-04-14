import * as React from "react";
import { cn } from "@/lib/cn";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "success" | "warning" | "danger" | "neutral";
}

export function Badge({ className, variant = "default", ...props }: BadgeProps) {
  const variants: Record<NonNullable<BadgeProps["variant"]>, string> = {
    default: "bg-primary-100 text-primary-900",
    success: "bg-success-100 text-success-500",
    warning: "bg-warning-100 text-warning-500",
    danger: "bg-danger-100 text-danger-500",
    neutral: "bg-bg-50 text-text-500",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-caption font-medium",
        variants[variant],
        className,
      )}
      {...props}
    />
  );
}
