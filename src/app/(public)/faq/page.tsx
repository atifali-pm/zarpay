import { Card } from "@/components/ui/card";

export const metadata = { title: "FAQ" };

const faqs: Array<{ q: string; a: string }> = [
  {
    q: "Why only the UK to Pakistan corridor?",
    a: "Most remittance apps stretch across dozens of corridors and lose the plot on each one. Zarpay does one route well: GBP to PKR. Deeper integrations on the Pakistan side, sharper UX for the British Pakistani diaspora, and pricing that holds up when compared honestly.",
  },
  {
    q: "How long does a transfer take?",
    a: "Bank deposits via 1Link / Raast and mobile wallet credits to Easypaisa, JazzCash, and NayaPay typically settle within minutes once payment is funded. Cash pickup is available immediately on instruction.",
  },
  {
    q: "What is the rate lock?",
    a: "Once you start a transfer, the rate is locked for 60 minutes. The rate cannot move on you while you are paying. If your payment does not complete in time, you can pull a fresh quote.",
  },
  {
    q: "What is the fee?",
    a: "A small spread on the mid-market rate plus a flat fee per transfer. Both are shown on every quote before you pay. See the pricing page for a worked example.",
  },
  {
    q: "Do I have to verify my identity?",
    a: "Yes. Money transmission is a regulated activity. We need a photo of a government-issued ID and a selfie. This is a one-time step that takes a few minutes.",
  },
  {
    q: "What happens if a transfer fails?",
    a: "If a transfer cannot be delivered (wrong account, declined by the receiving bank), it is returned to you in full. You will see the status reflected in your transfer detail and you will receive an email.",
  },
  {
    q: "Is my money safe?",
    a: "Customer funds are held with a regulated payment institution and segregated from operating funds, in line with the UK Payment Services Regulations 2017 safeguarding requirements.",
  },
  {
    q: "Can I cancel a transfer?",
    a: "You can cancel a transfer that is awaiting payment. Once payment is funded and the payout is instructed, cancellation is no longer possible.",
  },
];

export default function FaqPage() {
  return (
    <div className="container-marketing py-16">
      <h1 className="text-display-lg font-display font-bold">Frequently asked questions</h1>
      <div className="mt-10 grid gap-4 max-w-3xl">
        {faqs.map((f) => (
          <Card key={f.q} className="p-6">
            <h3 className="text-heading-md font-semibold text-text-900">{f.q}</h3>
            <p className="mt-2 text-body text-text-500">{f.a}</p>
          </Card>
        ))}
      </div>
    </div>
  );
}
