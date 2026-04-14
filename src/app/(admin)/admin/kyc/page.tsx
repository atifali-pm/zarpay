import Link from "next/link";
import { prisma } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, THead, TBody, TR, TH, TD } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { formatRelative } from "@/lib/format";

export default async function KycQueuePage() {
  const pending = await prisma.user.findMany({
    where: { kycStatus: { in: ["pending", "rejected"] } },
    include: {
      kycDocuments: {
        orderBy: { createdAt: "desc" },
      },
    },
    orderBy: { updatedAt: "desc" },
  });

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-display-lg font-display font-bold">KYC review queue</h1>
        <p className="text-body text-text-500">
          {pending.length} user{pending.length === 1 ? "" : "s"} awaiting review
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Pending and rejected</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {pending.length === 0 ? (
            <p className="text-body text-text-500 text-center py-12">
              Inbox zero. Nothing to review.
            </p>
          ) : (
            <Table>
              <THead>
                <TR>
                  <TH>User</TH>
                  <TH>Email</TH>
                  <TH>Status</TH>
                  <TH>Documents</TH>
                  <TH>Submitted</TH>
                  <TH></TH>
                </TR>
              </THead>
              <TBody>
                {pending.map((u) => (
                  <TR key={u.id}>
                    <TD className="font-semibold">{u.fullName}</TD>
                    <TD className="text-text-500">{u.email}</TD>
                    <TD>
                      {u.kycStatus === "pending" ? (
                        <Badge variant="warning">Pending</Badge>
                      ) : (
                        <Badge variant="danger">Rejected</Badge>
                      )}
                    </TD>
                    <TD className="text-caption">{u.kycDocuments.length} files</TD>
                    <TD className="text-caption text-text-500">
                      {formatRelative(u.updatedAt)}
                    </TD>
                    <TD>
                      <Link
                        href={`/admin/kyc/${u.id}`}
                        className="text-caption text-primary-700 hover:underline"
                      >
                        Review →
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
