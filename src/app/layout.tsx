import type { Metadata } from "next";
import { Inter, Inter_Tight, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const sans = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const display = Inter_Tight({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});

const mono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Zarpay · UK to Pakistan money transfer",
    template: "%s · Zarpay",
  },
  description:
    "Send GBP from the UK and deliver PKR to a bank account, mobile wallet, or cash pickup point in Pakistan. Mid market rate, disclosed spread.",
  metadataBase: new URL("http://localhost:3010"),
  openGraph: {
    title: "Zarpay · UK to Pakistan money transfer",
    description:
      "Mid-market rate, disclosed spread, single corridor focus. Built for the British Pakistani diaspora.",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${sans.variable} ${display.variable} ${mono.variable}`}>
      <body className="min-h-screen bg-bg-50 text-text-900 font-sans antialiased">{children}</body>
    </html>
  );
}
