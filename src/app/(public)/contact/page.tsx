import { Card } from "@/components/ui/card";

export const metadata = { title: "Contact" };

export default function ContactPage() {
  return (
    <div className="container-marketing py-16">
      <div className="max-w-2xl">
        <h1 className="text-display-lg font-display font-bold">Get in touch</h1>
        <p className="mt-4 text-body-lg text-text-500">
          Zarpay is currently in private development. The fastest way to reach the team is by
          email.
        </p>
      </div>
      <Card className="mt-10 p-8 max-w-2xl">
        <dl className="space-y-4">
          <div>
            <dt className="text-caption font-semibold uppercase tracking-wider text-text-500">
              General
            </dt>
            <dd className="mt-1 text-body text-text-900">hello@zarpay.dev</dd>
          </div>
          <div>
            <dt className="text-caption font-semibold uppercase tracking-wider text-text-500">
              Support
            </dt>
            <dd className="mt-1 text-body text-text-900">support@zarpay.dev</dd>
          </div>
          <div>
            <dt className="text-caption font-semibold uppercase tracking-wider text-text-500">
              Compliance
            </dt>
            <dd className="mt-1 text-body text-text-900">compliance@zarpay.dev</dd>
          </div>
        </dl>
      </Card>
    </div>
  );
}
