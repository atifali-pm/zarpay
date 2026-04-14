import { Card } from "@/components/ui/card";
import { getDefaultSpreadBps, getDefaultFeeGbp } from "@/lib/fx";

export const metadata = { title: "Pricing" };

export default function PricingPage() {
  const spreadPct = (getDefaultSpreadBps() / 100).toFixed(2);
  const fee = getDefaultFeeGbp().toString();

  return (
    <div className="container-marketing py-16">
      <div className="max-w-3xl">
        <span className="inline-flex items-center rounded-full bg-primary-100 px-3 py-1 text-caption font-medium text-primary-900">
          Pricing
        </span>
        <h1 className="mt-4 text-display-lg font-display font-bold">Two numbers. Both visible.</h1>
        <p className="mt-4 text-body-lg text-text-500">
          We charge a small spread on the mid-market rate plus a flat fee. Both are shown on every
          quote before you pay. Nothing else.
        </p>
      </div>

      <div className="mt-10 grid gap-6 md:grid-cols-2">
        <Card className="p-8">
          <span className="text-caption font-semibold uppercase tracking-wider text-text-500">
            Spread
          </span>
          <p className="mt-2 text-display-xl font-display font-bold tabular-nums text-primary-900">
            {spreadPct}%
          </p>
          <p className="mt-3 text-body text-text-500">
            Applied to the mid-market rate from a public FX source. This is how we earn on the
            currency conversion. It is the only place we make money on FX.
          </p>
        </Card>

        <Card className="p-8">
          <span className="text-caption font-semibold uppercase tracking-wider text-text-500">
            Flat fee
          </span>
          <p className="mt-2 text-display-xl font-display font-bold tabular-nums text-primary-900">
            £{fee}
          </p>
          <p className="mt-3 text-body text-text-500">
            One fee per transfer. Same on £50 or £5,000. No tiered pricing, no surprise charges
            once your recipient picks up the funds.
          </p>
        </Card>
      </div>

      <Card className="mt-6 p-8">
        <h2 className="text-heading-xl font-semibold">Worked example</h2>
        <p className="mt-2 text-body text-text-500">
          You send £500 when the mid-market GBP/PKR is 365.42:
        </p>
        <div className="mt-4 space-y-2 tabular-nums">
          <Row label="Mid-market rate" value="365.42" />
          <Row label={`Spread (${spreadPct}%)`} value="−4.39" />
          <Row label="Our rate" value="361.04" />
          <Row label="You send" value="£500.00" />
          <Row label="Fee" value={`£${fee}`} />
          <div className="border-t border-border pt-2">
            <Row label="Total charged" value={`£${(500 + parseFloat(fee)).toFixed(2)}`} bold />
            <Row label="Recipient gets" value="PKR 180,520" bold />
          </div>
        </div>
      </Card>

      <Card className="mt-6 p-8">
        <h2 className="text-heading-xl font-semibold">What we do not charge for</h2>
        <ul className="mt-4 space-y-3 text-body text-text-700">
          <li>· No charge to sign up or verify your identity</li>
          <li>· No charge to add a recipient</li>
          <li>· No charge for SMS notifications to your recipient</li>
          <li>· No surprise FX margin on the recipient side</li>
        </ul>
      </Card>
    </div>
  );
}

function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className="flex items-center justify-between text-body">
      <span className="text-text-500">{label}</span>
      <span className={bold ? "font-semibold text-text-900" : "text-text-700"}>{value}</span>
    </div>
  );
}
