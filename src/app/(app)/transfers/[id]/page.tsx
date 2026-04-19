import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth-helpers";
import { prisma } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusPill } from "@/components/brand/status-pill";
import { TransferTimeline } from "@/components/transfers/transfer-timeline";
import { formatGbp, formatPkr } from "@/lib/money";
import { formatDateTime } from "@/lib/format";
import { cancelTransferAction } from "./actions";

export default async function TransferDetailPage({ params }: { params: { id: string } }) {
  const user = await requireUser();
  const transfer = await prisma.transfer.findFirst({
    where: { id: params.id, senderId: user.id },
    include: { recipient: true, events: { orderBy: { createdAt: "asc" } }, complianceFlags: true },
  });
  if (!transfer) notFound();

  const details = transfer.recipient.accountDetails as Record<string, string>;
  const canCancel = transfer.status === "pending_payment" || transfer.status === "quote_locked";

  return (
    <div className="container-app py-10">
      <div className="mx-auto max-w-3xl space-y-6">
        <div>
          <Link href="/transfers" className="text-caption text-text-500 hover:underline">
            ← All transfers
          </Link>
          <div className="mt-2 flex items-center gap-3 flex-wrap">
            <h1 className="text-display-lg font-display font-bold">{transfer.reference}</h1>
            <StatusPill status={transfer.status} />
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {transfer.status === "pending_payment" && transfer.paymentIntentId && (
              <Button asChild size="sm">
                <Link
                  href={`/dev/payment/${encodeURIComponent(transfer.paymentIntentId)}?ref=${encodeURIComponent(
                    transfer.reference,
                  )}`}
                >
                  Resume payment
                </Link>
              </Button>
            )}
            <Button asChild size="sm" variant="secondary">
              <a
                href={`/api/transfers/${transfer.id}/receipt`}
                target="_blank"
                rel="noopener noreferrer"
              >
                View receipt
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="ml-1.5 h-3.5 w-3.5"
                >
                  <path d="M15 3h6v6" />
                  <path d="M10 14 21 3" />
                  <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                </svg>
              </a>
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Amount</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6 md:grid-cols-2">
              <div>
                <p className="text-caption text-text-500">You sent</p>
                <p className="text-display-xl font-display font-bold tabular-nums">
                  {formatGbp(transfer.sendAmountGbp.toString())}
                </p>
              </div>
              <div>
                <p className="text-caption text-text-500">Recipient receives</p>
                <p className="text-display-xl font-display font-bold tabular-nums text-primary-900">
                  {formatPkr(transfer.receiveAmountPkr.toString())}
                </p>
              </div>
            </div>
            <div className="mt-6 grid gap-1 text-caption tabular-nums">
              <Row label="Exchange rate" value={`1 GBP = ${transfer.exchangeRate.toString()} PKR`} />
              <Row label="Spread" value={`${(transfer.spreadBps / 100).toFixed(2)}%`} />
              <Row label="Fee" value={formatGbp(transfer.feeGbp.toString())} />
              <Row label="Total charged" value={formatGbp(transfer.totalChargedGbp.toString())} bold />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recipient</CardTitle>
            <CardDescription>{transfer.recipient.fullName}</CardDescription>
          </CardHeader>
          <CardContent>
            <dl className="grid gap-1 text-caption tabular-nums">
              {transfer.recipient.payoutMethod === "bank" && (
                <>
                  <Row label="Method" value="Bank deposit" />
                  <Row label="Bank" value={details.bank_code} />
                  <Row label="Account" value={details.account_number} />
                  <Row label="Title" value={details.account_title} />
                </>
              )}
              {transfer.recipient.payoutMethod === "mobile_wallet" && (
                <>
                  <Row label="Method" value="Mobile wallet" />
                  <Row label="Wallet" value={details.provider} />
                  <Row label="Number" value={details.account_number} />
                </>
              )}
              {transfer.recipient.payoutMethod === "cash_pickup" && (
                <>
                  <Row label="Method" value="Cash pickup" />
                  <Row label="Network" value={details.network} />
                  <Row label="Pickup name" value={details.full_name} />
                </>
              )}
            </dl>
          </CardContent>
        </Card>

        {transfer.complianceFlags.length > 0 && (
          <Card className="border-l-4 border-l-warning-500">
            <CardHeader>
              <CardTitle>Compliance</CardTitle>
              <CardDescription>
                {transfer.complianceFlags.length} flag(s) raised on this transfer
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-caption">
                {transfer.complianceFlags.map((f) => (
                  <li key={f.id} className="text-text-700">
                    [{f.severity}] {f.notes}{" "}
                    <span className="text-text-500">({f.status})</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Timeline</CardTitle>
          </CardHeader>
          <CardContent>
            <TransferTimeline events={transfer.events} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Details</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid gap-1 text-caption tabular-nums">
              <Row label="Created" value={formatDateTime(transfer.createdAt)} />
              <Row label="Quote locked until" value={formatDateTime(transfer.quoteLockedUntil)} />
              <Row label="Funded" value={formatDateTime(transfer.fundedAt)} />
              <Row label="In transit" value={formatDateTime(transfer.inTransitAt)} />
              <Row label="Delivered" value={formatDateTime(transfer.deliveredAt)} />
              <Row label="Payment intent" value={transfer.paymentIntentId ?? "·"} />
              <Row label="Payout reference" value={transfer.payoutReference ?? "·"} />
            </dl>
            {canCancel && (
              <form action={cancelTransferAction} className="mt-6">
                <input type="hidden" name="id" value={transfer.id} />
                <Button type="submit" variant="ghost" size="sm">
                  Cancel transfer
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-text-500">{label}</dt>
      <dd className={bold ? "font-semibold text-text-900" : "text-text-700"}>{value}</dd>
    </div>
  );
}
