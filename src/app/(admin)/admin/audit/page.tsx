import { prisma } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, THead, TBody, TR, TH, TD } from "@/components/ui/table";
import { formatDateTime } from "@/lib/format";

export default async function AuditPage() {
  const entries = await prisma.auditLog.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
    include: { actor: true },
  });

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-display-lg font-display font-bold">Audit log</h1>
        <p className="text-body text-text-500">Latest 100 administrative actions</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent activity</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <THead>
              <TR>
                <TH>When</TH>
                <TH>Actor</TH>
                <TH>Action</TH>
                <TH>Target</TH>
              </TR>
            </THead>
            <TBody>
              {entries.map((e) => (
                <TR key={e.id}>
                  <TD className="text-caption text-text-500">{formatDateTime(e.createdAt)}</TD>
                  <TD>{e.actor.fullName}</TD>
                  <TD>
                    <span className="font-mono text-caption">{e.action}</span>
                  </TD>
                  <TD className="text-caption text-text-500">
                    {e.targetType} · <span className="font-mono">{e.targetId.slice(0, 8)}…</span>
                  </TD>
                </TR>
              ))}
            </TBody>
          </Table>
          {entries.length === 0 && (
            <p className="text-body text-text-500 text-center py-8">No audit entries yet.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
