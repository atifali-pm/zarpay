import Link from "next/link";
import { requireUser } from "@/lib/auth-helpers";
import { prisma } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { deleteRecipientAction } from "./actions";
import { maskAccount } from "@/lib/format";

export default async function RecipientsPage() {
  const user = await requireUser();
  const recipients = await prisma.recipient.findMany({
    where: { userId: user.id, deletedAt: null },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="container-app py-10 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-display-lg font-display font-bold">Recipients</h1>
          <p className="text-body text-text-500">People you send money to in Pakistan.</p>
        </div>
        <Button asChild>
          <Link href="/recipients/new">Add recipient</Link>
        </Button>
      </div>

      {recipients.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <p className="text-body text-text-500">No recipients yet.</p>
            <p className="text-caption text-text-500">Add one to get started.</p>
            <Button asChild className="mt-4">
              <Link href="/recipients/new">Add your first recipient</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {recipients.map((r) => {
            const details = r.accountDetails as Record<string, string>;
            return (
              <Card key={r.id}>
                <CardHeader>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <CardTitle className="text-heading-md">{r.fullName}</CardTitle>
                      <CardDescription>
                        {r.nickname && <>“{r.nickname}” · </>}
                        {r.relationship ?? "·"}
                      </CardDescription>
                    </div>
                    <PayoutBadge method={r.payoutMethod} />
                  </div>
                </CardHeader>
                <CardContent>
                  <dl className="text-caption space-y-1">
                    {r.payoutMethod === "bank" && (
                      <>
                        <Row label="Bank" value={details.bank_code} />
                        <Row label="Account" value={maskAccount(details.account_number)} />
                        <Row label="Title" value={details.account_title} />
                      </>
                    )}
                    {r.payoutMethod === "mobile_wallet" && (
                      <>
                        <Row label="Wallet" value={details.provider} />
                        <Row label="Number" value={maskAccount(details.account_number)} />
                      </>
                    )}
                    {r.payoutMethod === "cash_pickup" && (
                      <>
                        <Row label="Network" value={details.network} />
                        <Row label="Pickup name" value={details.full_name} />
                      </>
                    )}
                    {r.phone && <Row label="Phone" value={r.phone} />}
                    {details.contact_email && <Row label="Email" value={details.contact_email} />}
                  </dl>
                  <div className="mt-4 flex items-center gap-2">
                    <Button asChild variant="secondary" size="sm">
                      <Link href={`/send?recipient=${r.id}`}>Send</Link>
                    </Button>
                    <form action={deleteRecipientAction}>
                      <input type="hidden" name="id" value={r.id} />
                      <Button type="submit" variant="ghost" size="sm">
                        Remove
                      </Button>
                    </form>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-text-500">{label}</dt>
      <dd className="text-text-900 font-medium">{value}</dd>
    </div>
  );
}

function PayoutBadge({ method }: { method: "bank" | "mobile_wallet" | "cash_pickup" }) {
  const labels: Record<typeof method, string> = {
    bank: "Bank deposit",
    mobile_wallet: "Mobile wallet",
    cash_pickup: "Cash pickup",
  };
  return <Badge variant="default">{labels[method]}</Badge>;
}
