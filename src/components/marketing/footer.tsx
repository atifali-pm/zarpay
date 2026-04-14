import Link from "next/link";
import { Logo } from "@/components/brand/logo";

export function MarketingFooter() {
  return (
    <footer className="border-t border-border bg-white">
      <div className="container-marketing py-12">
        <div className="grid gap-8 md:grid-cols-4">
          <div className="md:col-span-1">
            <Logo size="md" />
            <p className="mt-4 text-caption text-text-500 max-w-xs">
              Cross-border money transfer for the UK to Pakistan corridor. Mid-market rate, disclosed
              spread.
            </p>
          </div>
          <div>
            <h4 className="text-caption font-semibold uppercase tracking-wider text-text-500">
              Product
            </h4>
            <ul className="mt-3 space-y-2 text-body">
              <li>
                <Link href="/how-it-works" className="text-text-700 hover:text-primary-900">
                  How it works
                </Link>
              </li>
              <li>
                <Link href="/pricing" className="text-text-700 hover:text-primary-900">
                  Pricing
                </Link>
              </li>
              <li>
                <Link href="/security" className="text-text-700 hover:text-primary-900">
                  Security
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="text-caption font-semibold uppercase tracking-wider text-text-500">
              Company
            </h4>
            <ul className="mt-3 space-y-2 text-body">
              <li>
                <Link href="/faq" className="text-text-700 hover:text-primary-900">
                  FAQ
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-text-700 hover:text-primary-900">
                  Contact
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="text-caption font-semibold uppercase tracking-wider text-text-500">
              Legal
            </h4>
            <ul className="mt-3 space-y-2 text-body">
              <li>
                <span className="text-text-300">Terms (placeholder)</span>
              </li>
              <li>
                <span className="text-text-300">Privacy (placeholder)</span>
              </li>
              <li>
                <span className="text-text-300">Complaints (placeholder)</span>
              </li>
            </ul>
          </div>
        </div>
        <div className="mt-10 border-t border-border pt-6">
          <p className="text-micro text-text-500 max-w-3xl">
            Zarpay is a portfolio product. Live operation requires UK FCA authorization (or
            partnership with a licensed Authorised Payment Institution) and SBP-licensed delivery
            partners in Pakistan. All payment flows in this build use sandbox or development
            providers behind clean interfaces.
          </p>
          <p className="mt-2 text-micro text-text-300">© {new Date().getFullYear()} Zarpay</p>
        </div>
      </div>
    </footer>
  );
}
