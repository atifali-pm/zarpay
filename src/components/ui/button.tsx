import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/cn";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 rounded-lg text-body font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        primary: "bg-primary-900 text-white hover:bg-primary-700",
        secondary: "bg-white border border-border-strong text-text-900 hover:bg-bg-50",
        ghost: "bg-transparent text-primary-900 hover:bg-primary-100",
        destructive: "bg-danger-500 text-white hover:bg-danger-600",
        accent: "bg-accent-500 text-text-900 hover:bg-accent-600",
        link: "text-primary-700 underline-offset-4 hover:underline",
      },
      size: {
        sm: "h-9 px-3 text-caption",
        md: "h-11 px-5",
        lg: "h-12 px-6 text-body-lg",
        icon: "h-10 w-10",
      },
      width: {
        auto: "",
        full: "w-full",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
      width: "auto",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, width, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, width, className }))}
        ref={ref}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";

export { buttonVariants };
