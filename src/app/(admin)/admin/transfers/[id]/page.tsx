import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusPill } from "@/components/brand/status-pill";
import { TransferTimeline } from "@/components/transfers/transfer-timeline";
import { formatGbp, formatPkr } from "@/lib/money";
import { formatDateTime } from "@/lib/format";
import { adminMarkDelivered, adminMarkInTransit, adminReject } from "./actions";

export default async function AdminTransferDetail({ params }: { params: { id: string } }) {
  const t = await prisma.transfer.findUnique({
    where: { id: params.id },
    include: {
      sender: true,
      recipient: true,
      events: { orderBy: { createdAt: "asc" } },
      complianceFlags: { include: { reviewedBy: true } },
    },
  });
  if (!t) notFound();

  const details = t.recipient.accountDetails as Record<string, string>;

  return (
    <div className="p-8 space-y-6">
      <div>
        <Link href="/admin/transfers" className="text-caption text-text-500 hover:underline">
          ← All transfers
        </Link>
        <div className="mt-2 flex items-center gap-3 flex-wrap">
          <h1 className="text-display-lg font-display font-bold">{t.reference}</h1>
          <StatusPill status={t.status} />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Amount</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6 md:grid-cols-2">
                <div>
                  <p className="text-caption text-text-500">Sender pays</p>
                  <p className="text-display-xl font-display font-bold tabular-nums">
                    {formatGbp(t.sendAmountGbp.toString())}
                  </p>
                </div>
                <div>
                  <p className="text-caption text-text-500">Recipient gets</p>
                  <p className="text-display-xl font-display font-bold tabular-nums text-primary-900">
                    {formatPkr(t.receiveAmountPkr.toString())}
                  </p>
                </div>
              </div>
              <div className="mt-6 grid gap-1 text-caption tabular-nums">
                <Row label="Rate" value={`1 GBP = ${t.exchangeRate.toString()} PKR`} />
                <Row label="Spread" value={`${(t.spreadBps / 100).toFixed(2)}%`} />
                <Row label="Fee" value={formatGbp(t.feeGbp.toString())} />
                <Row label="Total charged" value={formatGbp(t.totalChargedGbp.toString())} bold />
              </div>
            </CardContent>
          </Card>

          {t.complianceFlags.length > 0 && (
            <Card className="border-l-4 border-l-warning-500">
              <CardHeader>
                <CardTitle>Compliance flags</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-caption">
                  {t.complianceFlags.map((f) => (
                    <li key={f.id} className="text-text-700">
                      [{f.severity}] {f.notes} <span className="text-text-500">({f.status})</span>
                    </li>
                  ))}
                </ul>
                {t.status === "compliance_hold" && (
                  <p className="mt-3 text-caption text-text-500">
                    Manage flags from the{" "}
                    <Link href="/admin/compliance" className="text-primary-700 underline">
                      compliance review page
                    </Link>
                    .
                  </p>
                )}
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              <TransferTimeline events={t.events} />
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Sender</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="font-semibold">{t.sender.fullName}</p>
              <p className="text-caption text-text-500">{t.sender.email}</p>
              <p className="text-caption text-text-500">{t.sender.phone ?? "·"}</p>
              <Link
                href={`/admin/users/${t.sender.id}`}
                className="mt-2 inline-block text-caption text-primary-700 hover:underline"
              >
                View profile →
              </Link>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recipient</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="font-semibold">{t.recipient.fullName}</p>
              <dl className="mt-2 grid gap-1 text-caption">
                {t.recipient.payoutMethod === "bank" && (
                  <>
                    <Row label="Bank" value={details.bank_code} />
                    <Row label="Account" value={details.account_number} />
                  </>
                )}
                {t.recipient.payoutMethod === "mobile_wallet" && (
                  <>
                    <Row label="Wallet" value={details.provider} />
                    <Row label="Number" value={details.account_number} />
                  </>
                )}
                {t.recipient.payoutMethod === "cash_pickup" && (
                  <>
                    <Row label="Network" value={details.network} />
                  </>
                )}
              </dl>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Manual actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {(t.status === "funded" || t.status === "compliance_hold") && (
                <form action={adminMarkInTransit}>
                  <input type="hidden" name="id" value={t.id} />
                  <Button type="submit" width="full" variant="secondary">
                    Mark in transit
                  </Button>
                </form>
              )}
              {t.status === "in_transit" && (
                <form action={adminMarkDelivered}>
                  <input type="hidden" name="id" value={t.id} />
                  <Button type="submit" width="full">
                    Mark delivered
                  </Button>
                </form>
              )}
              {t.status !== "delivered" &&
                t.status !== "cancelled" &&
                t.status !== "rejected" && (
                  <form action={adminReject}>
                    <input type="hidden" name="id" value={t.id} />
                    <input type="hidden" name="reason" value="Manually rejected by admin" />
                    <Button type="submit" width="full" variant="destructive">
                      Reject
                    </Button>
                  </form>
                )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Details</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="grid gap-1 text-caption tabular-nums">
                <Row label="Created" value={formatDateTime(t.createdAt)} />
                <Row label="Funded" value={formatDateTime(t.fundedAt)} />
                <Row label="In transit" value={formatDateTime(t.inTransitAt)} />
                <Row label="Delivered" value={formatDateTime(t.deliveredAt)} />
                <Row label="Payout ref" value={t.payoutReference ?? "·"} />
              </dl>
            </CardContent>
          </Card>
        </div>
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
