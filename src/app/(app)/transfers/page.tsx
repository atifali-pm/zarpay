import Link from "next/link";
import { requireUser } from "@/lib/auth-helpers";
import { prisma } from "@/lib/db";
import { Card, CardContent } from "@/components/ui/card";
import { Table, THead, TBody, TR, TH, TD } from "@/components/ui/table";
import { StatusPill } from "@/components/brand/status-pill";
import { formatGbp, formatPkr } from "@/lib/money";
import { formatDateTime } from "@/lib/format";
import { Button } from "@/components/ui/button";

export default async function TransfersPage() {
  const user = await requireUser();
  const transfers = await prisma.transfer.findMany({
    where: { senderId: user.id },
    orderBy: { createdAt: "desc" },
    include: { recipient: true },
  });

  return (
    <div className="container-app py-10 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-display-lg font-display font-bold">Transfers</h1>
          <p className="text-body text-text-500">All your transfers, newest first.</p>
        </div>
        <Button asChild>
          <Link href="/send">New transfer</Link>
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          {transfers.length === 0 ? (
            <p className="text-body text-text-500 text-center py-16">No transfers yet.</p>
          ) : (
            <Table>
              <THead>
                <TR>
                  <TH>Reference</TH>
                  <TH>Recipient</TH>
                  <TH>Send</TH>
                  <TH>Receive</TH>
                  <TH>Status</TH>
                  <TH>Created</TH>
                  <TH></TH>
                </TR>
              </THead>
              <TBody>
                {transfers.map((t) => (
                  <TR key={t.id}>
                    <TD>
                      <span className="font-mono text-caption">{t.reference}</span>
                    </TD>
                    <TD>{t.recipient.fullName}</TD>
                    <TD className="tabular-nums">{formatGbp(t.sendAmountGbp.toString())}</TD>
                    <TD className="tabular-nums">{formatPkr(t.receiveAmountPkr.toString())}</TD>
                    <TD>
                      <StatusPill status={t.status} />
                    </TD>
                    <TD className="text-caption text-text-500">{formatDateTime(t.createdAt)}</TD>
                    <TD>
                      <Link
                        href={`/transfers/${t.id}`}
                        className="text-caption text-primary-700 hover:underline"
                      >
                        View →
                      </Link>
                    </TD>
                  </TR>
                ))}
              </TBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
