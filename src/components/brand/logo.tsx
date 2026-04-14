import { cn } from "@/lib/cn";

export function Logo({ className, size = "md" }: { className?: string; size?: "sm" | "md" | "lg" }) {
  const sizes = {
    sm: "text-heading-md",
    md: "text-heading-lg",
    lg: "text-heading-xl",
  };
  return (
    <span className={cn("font-display font-bold tracking-tight", sizes[size], className)}>
      <span className="text-accent-500">Z</span>
      <span className="text-primary-900">arpay</span>
    </span>
  );
}
