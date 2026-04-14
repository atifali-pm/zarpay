import { Card } from "@/components/ui/card";

export const metadata = { title: "Security" };

export default function SecurityPage() {
  return (
    <div className="container-marketing py-16">
      <div className="max-w-3xl">
        <h1 className="text-display-lg font-display font-bold">Security and compliance</h1>
        <p className="mt-4 text-body-lg text-text-500">
          Money movement is a regulated activity. Here is how Zarpay treats it.
        </p>
      </div>

      <div className="mt-10 grid gap-6 md:grid-cols-2">
        <Item
          title="Sensitive data is segregated"
          body="KYC documents (ID, selfie) live in a separate storage location from transactional data. In production they sit in a dedicated bucket with KMS encryption and short-lived signed URLs for the operations panel only."
        />
        <Item
          title="Audit log on every action"
          body="Every approval, rejection, freeze, rate change, and manual transfer state change writes to an append-only audit log with the actor, the diff, and the timestamp."
        />
        <Item
          title="Append-only transfer events"
          body="Every transfer state change is recorded. The timeline you see in your transfer detail is the same data your reviewer sees and the same data an auditor would inspect."
        />
        <Item
          title="Provider interfaces, not vendor lock-in"
          body="Payment-in, payout, KYC, and OTP all sit behind clean TypeScript interfaces. We can swap providers without rewriting the application. Going live behind a licensed counterparty is a swap, not a rebuild."
        />
        <Item
          title="Decimal arithmetic on money"
          body="Every monetary value is stored as decimal in the database, never floats. Display rounding happens at the edge."
        />
        <Item
          title="AML rule engine"
          body="Single-transfer thresholds, daily aggregates, velocity limits, and a sanctions screening hook. Flags raise into a compliance review queue rather than silently blocking transfers."
        />
      </div>

      <Card className="mt-8 p-6 md:p-8 bg-bg-50">
        <h2 className="text-heading-lg font-semibold">Regulatory posture</h2>
        <p className="mt-3 text-body text-text-700">
          Live operation requires UK FCA authorization (or partnership with a licensed Authorised
          Payment Institution) and SBP-licensed delivery partners in Pakistan. The application is
          built end-to-end with provider interfaces so going live is an integration project, not a
          rewrite. This is the standard pattern for any pre-license fintech build.
        </p>
      </Card>
    </div>
  );
}

function Item({ title, body }: { title: string; body: string }) {
  return (
    <Card className="p-6">
      <h3 className="text-heading-md font-semibold text-text-900">{title}</h3>
      <p className="mt-2 text-body text-text-500">{body}</p>
    </Card>
  );
}
