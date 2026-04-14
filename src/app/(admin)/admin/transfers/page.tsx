import Link from "next/link";
import { TransferStatus } from "@prisma/client";
import { prisma } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, THead, TBody, TR, TH, TD } from "@/components/ui/table";
import { StatusPill } from "@/components/brand/status-pill";
import { formatGbp, formatPkr } from "@/lib/money";
import { formatRelative } from "@/lib/format";

const STATUSES: TransferStatus[] = [
  "quote_locked",
  "pending_payment",
  "funded",
  "compliance_hold",
  "in_transit",
  "delivered",
  "cancelled",
  "rejected",
];

export default async function AdminTransfersPage({
  searchParams,
}: {
  searchParams: { status?: string };
}) {
  const filter = searchParams.status as TransferStatus | undefined;
  const transfers = await prisma.transfer.findMany({
    where: filter && STATUSES.includes(filter) ? { status: filter } : {},
    orderBy: { createdAt: "desc" },
    take: 100,
    include: { sender: true, recipient: true },
  });

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-display-lg font-display font-bold">Transfers</h1>
        <p className="text-body text-text-500">{transfers.length} of latest 100</p>
      </div>

      <div className="flex flex-wrap gap-2">
        <FilterLink current={filter} value={undefined} label="All" />
        {STATUSES.map((s) => (
          <FilterLink key={s} current={filter} value={s} label={s.replace(/_/g, " ")} />
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent transfers</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <THead>
              <TR>
                <TH>Reference</TH>
                <TH>Sender</TH>
                <TH>Recipient</TH>
                <TH>Send</TH>
                <TH>Receive</TH>
                <TH>Status</TH>
                <TH>Created</TH>
              </TR>
            </THead>
            <TBody>
              {transfers.map((t) => (
                <TR key={t.id}>
                  <TD>
                    <Link
                      href={`/admin/transfers/${t.id}`}
                      className="font-mono text-caption text-primary-700 hover:underline"
                    >
                      {t.reference}
                    </Link>
                  </TD>
                  <TD>{t.sender.fullName}</TD>
                  <TD>{t.recipient.fullName}</TD>
                  <TD className="tabular-nums">{formatGbp(t.sendAmountGbp.toString())}</TD>
                  <TD className="tabular-nums">{formatPkr(t.receiveAmountPkr.toString())}</TD>
                  <TD>
                    <StatusPill status={t.status} />
                  </TD>
                  <TD className="text-caption text-text-500">{formatRelative(t.createdAt)}</TD>
                </TR>
              ))}
            </TBody>
          </Table>
          {transfers.length === 0 && (
            <p className="text-body text-text-500 text-center py-12">No transfers match.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function FilterLink({
  current,
  value,
  label,
}: {
  current: string | undefined;
  value: TransferStatus | undefined;
  label: string;
}) {
  const active = current === value;
  const href = value ? `/admin/transfers?status=${value}` : "/admin/transfers";
  return (
    <Link
      href={href}
      className={`rounded-full px-3 py-1 text-caption ${
        active ? "bg-primary-900 text-white" : "bg-white border border-border text-text-700 hover:bg-bg-50"
      }`}
    >
      {label}
    </Link>
  );
}
