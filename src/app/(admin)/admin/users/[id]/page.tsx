import Link from "next/link";
import { notFound } from "next/navigation";
import Decimal from "decimal.js";
import { prisma } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StatusPill } from "@/components/brand/status-pill";
import { formatGbp, formatPkr } from "@/lib/money";
import { formatDate, formatRelative } from "@/lib/format";
import { freezeUserAction } from "../actions";

export default async function AdminUserDetail({ params }: { params: { id: string } }) {
  const user = await prisma.user.findUnique({
    where: { id: params.id },
    include: {
      transfers: {
        orderBy: { createdAt: "desc" },
        take: 10,
        include: { recipient: true },
      },
      recipients: { where: { deletedAt: null } },
    },
  });
  if (!user) notFound();

  const totalSent = user.transfers.reduce(
    (acc, t) => acc.plus(new Decimal(t.sendAmountGbp.toString())),
    new Decimal(0),
  );

  return (
    <div className="p-8 space-y-6">
      <div>
        <Link href="/admin/users" className="text-caption text-text-500 hover:underline">
          ← All users
        </Link>
        <div className="mt-2 flex items-center gap-3 flex-wrap">
          <h1 className="text-display-lg font-display font-bold">{user.fullName}</h1>
          {user.frozen && <Badge variant="danger">Frozen</Badge>}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Recent transfers</CardTitle>
              <CardDescription>Most recent 10</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {user.transfers.length === 0 ? (
                <p className="text-body text-text-500">No transfers yet.</p>
              ) : (
                user.transfers.map((t) => (
                  <Link
                    href={`/admin/transfers/${t.id}`}
                    key={t.id}
                    className="flex items-center justify-between rounded-lg border border-border p-3 hover:bg-bg-50"
                  >
                    <div>
                      <p className="font-mono text-caption text-text-500">{t.reference}</p>
                      <p className="text-body font-semibold">{t.recipient.fullName}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold tabular-nums">
                        {formatGbp(t.sendAmountGbp.toString())}
                      </p>
                      <p className="text-caption text-text-500 tabular-nums">
                        {formatPkr(t.receiveAmountPkr.toString())}
                      </p>
                      <div className="mt-1">
                        <StatusPill status={t.status} />
                      </div>
                    </div>
                  </Link>
                ))
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Profile</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="grid gap-2 text-caption">
                <Row label="Email" value={user.email} />
                <Row label="Phone" value={user.phone ?? "·"} />
                <Row label="Role" value={user.role} />
                <Row label="KYC" value={user.kycStatus} />
                <Row label="KYC tier" value={String(user.kycTier)} />
                <Row label="Country" value={user.country} />
                <Row label="Joined" value={formatDate(user.createdAt)} />
                <Row label="Last update" value={formatRelative(user.updatedAt)} />
              </dl>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Stats</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="grid gap-2 text-caption">
                <Row label="Total sent" value={formatGbp(totalSent)} />
                <Row label="Recipients" value={String(user.recipients.length)} />
                <Row label="Transfers" value={String(user.transfers.length)} />
              </dl>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <form action={freezeUserAction}>
                <input type="hidden" name="id" value={user.id} />
                <Button type="submit" variant={user.frozen ? "primary" : "destructive"} width="full">
                  {user.frozen ? "Unfreeze account" : "Freeze account"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
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
