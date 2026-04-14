import { Card } from "@/components/ui/card";

export const metadata = { title: "How it works" };

export default function HowItWorksPage() {
  return (
    <div className="container-marketing py-16">
      <div className="max-w-3xl">
        <h1 className="text-display-lg font-display font-bold">How Zarpay works</h1>
        <p className="mt-4 text-body-lg text-text-500">
          From quote to delivery, here is exactly what happens to your money.
        </p>
      </div>

      <div className="mt-10 grid gap-6">
        <Step
          n={1}
          title="Get your quote"
          body="Type an amount on the homepage calculator. We pull the mid-market GBP/PKR rate from a public FX source, apply our disclosed spread, and add the flat fee. You see the recipient amount before doing anything else."
        />
        <Step
          n={2}
          title="Sign up and verify"
          body="Create an account with email and phone. We send a one-time code to your phone. You upload a photo of your ID and a selfie. Verification typically completes in minutes for the build, hours in production."
        />
        <Step
          n={3}
          title="Add your recipient"
          body="Save your recipient with their bank account, mobile wallet number, or cash pickup name. We support all major Pakistani banks, the three major wallets (Easypaisa, JazzCash, NayaPay), and Western Union and MoneyGram cash pickup."
        />
        <Step
          n={4}
          title="Lock the quote"
          body="When you confirm, we lock the quote for 60 minutes. The rate cannot move on you while you are paying. If you do not pay in time, you can pull a fresh quote with one click."
        />
        <Step
          n={5}
          title="Pay"
          body="Pay with your debit or credit card. We use a regulated payment provider for the card processing. You never enter card details into Zarpay directly."
        />
        <Step
          n={6}
          title="We instruct the payout"
          body="As soon as your payment is captured, we instruct our Pakistani delivery partner. For bank deposits via 1Link / Raast this is typically minutes. For wallet credits, also minutes. For cash pickup, the recipient sees the funds available the moment we instruct."
        />
        <Step
          n={7}
          title="Recipient gets a notification"
          body="Your recipient gets an SMS in English or Urdu the moment funds land. You see the same status update on your transfer detail page, with a timeline of every state change."
        />
      </div>
    </div>
  );
}

function Step({ n, title, body }: { n: number; title: string; body: string }) {
  return (
    <Card className="p-6 md:p-8">
      <div className="flex gap-5">
        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-primary-100 font-display font-bold text-primary-900">
          {n}
        </div>
        <div>
          <h3 className="text-heading-lg font-semibold text-text-900">{title}</h3>
          <p className="mt-2 text-body text-text-500">{body}</p>
        </div>
      </div>
    </Card>
  );
}
