import Link from "next/link";
import Decimal from "decimal.js";
import { prisma } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { StatusPill } from "@/components/brand/status-pill";
import { formatGbp, formatPkr } from "@/lib/money";
import { formatRelative } from "@/lib/format";

export default async function AdminDashboardPage() {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const [todayTransfers, pendingKyc, openFlags, recentTransfers] = await Promise.all([
    prisma.transfer.findMany({
      where: { createdAt: { gte: startOfDay }, status: { notIn: ["cancelled", "rejected"] } },
      select: { sendAmountGbp: true },
    }),
    prisma.user.count({ where: { kycStatus: "pending" } }),
    prisma.complianceFlag.count({ where: { status: "open" } }),
    prisma.transfer.findMany({
      orderBy: { createdAt: "desc" },
      take: 8,
      include: { sender: true, recipient: true },
    }),
  ]);

  const todayVolume = todayTransfers.reduce(
    (acc, t) => acc.plus(new Decimal(t.sendAmountGbp.toString())),
    new Decimal(0),
  );

  return (
    <div className="p-8 space-y-8">
      <div>
        <h1 className="text-display-lg font-display font-bold">Operations</h1>
        <p className="text-body text-text-500">Live status of the Zarpay platform.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Stat label="Volume today" value={formatGbp(todayVolume)} href="/admin/transfers" />
        <Stat label="Transfers today" value={String(todayTransfers.length)} href="/admin/transfers" />
        <Stat label="Pending KYC" value={String(pendingKyc)} href="/admin/kyc" tone={pendingKyc > 0 ? "warning" : undefined} />
        <Stat label="Open compliance flags" value={String(openFlags)} href="/admin/compliance" tone={openFlags > 0 ? "warning" : undefined} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent activity</CardTitle>
          <CardDescription>Latest transfers across the platform</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {recentTransfers.map((t) => (
              <Link
                href={`/admin/transfers/${t.id}`}
                key={t.id}
                className="flex items-center justify-between rounded-lg border border-border p-4 hover:bg-bg-50 transition-colors"
              >
                <div>
                  <p className="font-mono text-caption text-text-500">{t.reference}</p>
                  <p className="text-body font-semibold text-text-900">
                    {t.sender.fullName} → {t.recipient.fullName}
                  </p>
                  <p className="text-caption text-text-500">{formatRelative(t.createdAt)}</p>
                </div>
                <div className="text-right">
                  <p className="text-body font-semibold tabular-nums">
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
            ))}
            {recentTransfers.length === 0 && (
              <p className="text-body text-text-500 text-center py-8">No transfers yet.</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function Stat({
  label,
  value,
  href,
  tone,
}: {
  label: string;
  value: string;
  href: string;
  tone?: "warning";
}) {
  return (
    <Link href={href}>
      <Card className={tone === "warning" ? "border-l-4 border-l-warning-500" : ""}>
        <CardContent className="pt-6">
          <p className="text-caption font-semibold uppercase tracking-wider text-text-500">
            {label}
          </p>
          <p className="mt-2 text-display-lg font-display font-bold tabular-nums">{value}</p>
        </CardContent>
      </Card>
    </Link>
  );
}
