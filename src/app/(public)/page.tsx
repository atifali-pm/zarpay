import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RateCalculator } from "@/components/marketing/rate-calculator";
import { getMidRate, getDefaultFeeGbp, getDefaultSpreadBps } from "@/lib/fx";

export default async function LandingPage() {
  const fx = await getMidRate("GBP", "PKR");

  return (
    <>
      {/* Hero */}
      <section className="bg-white border-b border-border">
        <div className="container-marketing py-16 md:py-24">
          <div className="grid gap-12 lg:grid-cols-2 lg:gap-16 lg:items-center">
            <div>
              <span className="inline-flex items-center rounded-full bg-primary-100 px-3 py-1 text-caption font-medium text-primary-900">
                UK → Pakistan corridor
              </span>
              <h1 className="mt-4 font-display font-bold text-display-xl text-text-900 tracking-tight">
                Send to Pakistan{" "}
                <span className="text-accent-500">at the real rate.</span>
              </h1>
              <p className="mt-5 text-body-lg text-text-500 max-w-xl">
                Mid market rate, disclosed spread, no hidden margin. Built for the British
                Pakistani diaspora. Bank deposit, mobile wallet, or cash pickup, anywhere in
                Pakistan.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
                <Button asChild size="lg">
                  <Link href="/signup">Send your first transfer</Link>
                </Button>
                <Button asChild variant="ghost" size="lg">
                  <Link href="/how-it-works">See how it works</Link>
                </Button>
              </div>
              <div className="mt-8 flex flex-wrap gap-x-8 gap-y-3 text-caption text-text-500">
                <span className="inline-flex items-center gap-2">
                  <CheckDot /> Bank, wallet & cash pickup
                </span>
                <span className="inline-flex items-center gap-2">
                  <CheckDot /> 60-minute rate lock
                </span>
                <span className="inline-flex items-center gap-2">
                  <CheckDot /> SMS to your recipient on delivery
                </span>
              </div>
            </div>
            <div>
              <RateCalculator
                initialRate={{
                  midRate: fx.midRate.toString(),
                  spreadBps: getDefaultSpreadBps(),
                  feeGbp: getDefaultFeeGbp().toString(),
                  source: fx.source,
                  fetchedAt: fx.fetchedAt.toISOString(),
                }}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Trust band */}
      <section className="border-b border-border bg-bg-50">
        <div className="container-marketing py-12">
          <div className="grid gap-6 md:grid-cols-3">
            <TrustItem
              title="Mid-market rate"
              body="The exact rate banks use between themselves. Plus a small disclosed spread we keep, never hidden."
            />
            <TrustItem
              title="Disclosed fees"
              body="One flat fee shown before you pay. No surprise charges on the recipient side."
            />
            <TrustItem
              title="Audit trail"
              body="Every transfer state change is logged. You see the timeline. Auditors see the same."
            />
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="bg-white">
        <div className="container-marketing py-16">
          <h2 className="text-display-lg font-display font-semibold text-center">
            Three steps. Done in minutes.
          </h2>
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            <Step n={1} title="Quote your transfer">
              Type the amount on the calculator above. See exactly what your recipient gets.
            </Step>
            <Step n={2} title="Verify once">
              Sign up, verify your phone, upload a photo of your ID. One time, in under 5 minutes.
            </Step>
            <Step n={3} title="Pay and track">
              Pay with your card. Track every step from initiated to delivered. Your recipient gets
              an SMS when funds land.
            </Step>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-primary-900">
        <div className="container-marketing py-16 text-center">
          <h2 className="text-display-lg font-display font-semibold text-white">
            One corridor, done properly.
          </h2>
          <p className="mt-4 text-body-lg text-primary-100 max-w-2xl mx-auto">
            Zarpay focuses on GBP to PKR. That focus is the whole product. Nothing else competes
            for engineering attention or pricing share.
          </p>
          <div className="mt-8">
            <Button asChild variant="accent" size="lg">
              <Link href="/signup">Get started</Link>
            </Button>
          </div>
        </div>
      </section>
    </>
  );
}

function CheckDot() {
  return <span className="inline-block h-1.5 w-1.5 rounded-full bg-success-500" />;
}

function TrustItem({ title, body }: { title: string; body: string }) {
  return (
    <Card className="p-6">
      <h3 className="text-heading-md font-semibold text-text-900">{title}</h3>
      <p className="mt-2 text-body text-text-500">{body}</p>
    </Card>
  );
}

function Step({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-4">
      <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-primary-100 font-display font-bold text-primary-900">
        {n}
      </div>
      <div>
        <h3 className="text-heading-md font-semibold text-text-900">{title}</h3>
        <p className="mt-1 text-body text-text-500">{children}</p>
      </div>
    </div>
  );
}
