import type { Config } from "tailwindcss";
import animate from "tailwindcss-animate";

const config: Config = {
  darkMode: ["class"],
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    container: {
      center: true,
      padding: "1rem",
      screens: {
        sm: "640px",
        md: "768px",
        lg: "1024px",
        xl: "1080px",
        "2xl": "1200px",
      },
    },
    extend: {
      colors: {
        primary: {
          900: "hsl(var(--primary-900))",
          700: "hsl(var(--primary-700))",
          100: "hsl(var(--primary-100))",
          DEFAULT: "hsl(var(--primary-900))",
          foreground: "hsl(var(--bg-0))",
        },
        accent: {
          500: "hsl(var(--accent-500))",
          600: "hsl(var(--accent-600))",
          DEFAULT: "hsl(var(--accent-500))",
          foreground: "hsl(var(--text-900))",
        },
        success: {
          500: "hsl(var(--success-500))",
          100: "hsl(var(--success-100))",
        },
        warning: {
          500: "hsl(var(--warning-500))",
          100: "hsl(var(--warning-100))",
        },
        danger: {
          500: "hsl(var(--danger-500))",
          100: "hsl(var(--danger-100))",
          600: "hsl(var(--danger-600))",
        },
        bg: {
          0: "hsl(var(--bg-0))",
          50: "hsl(var(--bg-50))",
        },
        text: {
          900: "hsl(var(--text-900))",
          700: "hsl(var(--text-700))",
          500: "hsl(var(--text-500))",
          300: "hsl(var(--text-300))",
        },
        border: "hsl(var(--border))",
        "border-strong": "hsl(var(--border-strong))",
        background: "hsl(var(--bg-0))",
        foreground: "hsl(var(--text-900))",
        muted: {
          DEFAULT: "hsl(var(--bg-50))",
          foreground: "hsl(var(--text-500))",
        },
        card: {
          DEFAULT: "hsl(var(--bg-0))",
          foreground: "hsl(var(--text-900))",
        },
        popover: {
          DEFAULT: "hsl(var(--bg-0))",
          foreground: "hsl(var(--text-900))",
        },
        destructive: {
          DEFAULT: "hsl(var(--danger-500))",
          foreground: "hsl(var(--bg-0))",
        },
        input: "hsl(var(--border-strong))",
        ring: "hsl(var(--primary-700))",
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        display: ["var(--font-display)", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "monospace"],
      },
      fontSize: {
        "display-2xl": ["3.75rem", { lineHeight: "1", letterSpacing: "-0.02em" }],
        "display-xl": ["3rem", { lineHeight: "1.1", letterSpacing: "-0.02em" }],
        "display-lg": ["2.25rem", { lineHeight: "1.15", letterSpacing: "-0.01em" }],
        "heading-xl": ["1.75rem", { lineHeight: "1.2", letterSpacing: "-0.01em" }],
        "heading-lg": ["1.375rem", { lineHeight: "1.25" }],
        "heading-md": ["1.125rem", { lineHeight: "1.3" }],
        "body-lg": ["1.0625rem", { lineHeight: "1.6" }],
        body: ["0.9375rem", { lineHeight: "1.55" }],
        caption: ["0.8125rem", { lineHeight: "1.5" }],
        micro: ["0.6875rem", { lineHeight: "1.4" }],
      },
      borderRadius: {
        lg: "0.5rem",
        xl: "0.75rem",
        "2xl": "1rem",
      },
      boxShadow: {
        sm: "0 1px 2px rgba(11, 26, 44, 0.04), 0 1px 3px rgba(11, 26, 44, 0.06)",
        md: "0 4px 6px -1px rgba(11, 26, 44, 0.06), 0 2px 4px -2px rgba(11, 26, 44, 0.06)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [animate],
};

export default config;
