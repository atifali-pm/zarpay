import Link from "next/link";
import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";

export function MarketingHeader() {
  return (
    <header className="border-b border-border bg-white">
      <div className="container-marketing flex h-16 items-center justify-between">
        <Link href="/" className="flex items-center">
          <Logo size="md" />
        </Link>
        <nav className="hidden items-center gap-8 md:flex">
          <Link href="/how-it-works" className="text-body text-text-700 hover:text-primary-900">
            How it works
          </Link>
          <Link href="/pricing" className="text-body text-text-700 hover:text-primary-900">
            Pricing
          </Link>
          <Link href="/security" className="text-body text-text-700 hover:text-primary-900">
            Security
          </Link>
          <Link href="/faq" className="text-body text-text-700 hover:text-primary-900">
            FAQ
          </Link>
        </nav>
        <div className="flex items-center gap-3">
          <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
            <Link href="/login">Log in</Link>
          </Button>
          <Button asChild size="sm">
            <Link href="/signup">Get started</Link>
          </Button>
        </div>
      </div>
    </header>
  );
}
