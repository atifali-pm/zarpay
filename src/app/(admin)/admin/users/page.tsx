import Link from "next/link";
import { prisma } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, THead, TBody, TR, TH, TD } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

export default async function AdminUsersPage({ searchParams }: { searchParams: { q?: string } }) {
  const q = searchParams.q ?? "";
  const users = await prisma.user.findMany({
    where: q
      ? {
          OR: [
            { email: { contains: q, mode: "insensitive" } },
            { fullName: { contains: q, mode: "insensitive" } },
          ],
        }
      : {},
    orderBy: { createdAt: "desc" },
    take: 100,
    include: { _count: { select: { transfers: true } } },
  });

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-display-lg font-display font-bold">Users</h1>
        <p className="text-body text-text-500">{users.length} of latest 100</p>
      </div>

      <Card>
        <CardContent className="pt-6">
          <form className="max-w-md">
            <Input name="q" placeholder="Search by name or email…" defaultValue={q} />
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>All users</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <THead>
              <TR>
                <TH>Name</TH>
                <TH>Email</TH>
                <TH>Role</TH>
                <TH>KYC</TH>
                <TH>Transfers</TH>
                <TH>Status</TH>
              </TR>
            </THead>
            <TBody>
              {users.map((u) => (
                <TR key={u.id}>
                  <TD className="font-semibold">
                    <Link href={`/admin/users/${u.id}`} className="hover:underline">
                      {u.fullName}
                    </Link>
                  </TD>
                  <TD className="text-text-500">{u.email}</TD>
                  <TD className="capitalize">{u.role}</TD>
                  <TD>
                    <KycBadge status={u.kycStatus} />
                  </TD>
                  <TD>{u._count.transfers}</TD>
                  <TD>
                    {u.frozen ? <Badge variant="danger">Frozen</Badge> : <Badge variant="success">Active</Badge>}
                  </TD>
                </TR>
              ))}
            </TBody>
          </Table>
          {users.length === 0 && (
            <p className="text-body text-text-500 text-center py-8">No users match.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function KycBadge({ status }: { status: string }) {
  if (status === "approved") return <Badge variant="success">Approved</Badge>;
  if (status === "pending") return <Badge variant="warning">Pending</Badge>;
  if (status === "rejected") return <Badge variant="danger">Rejected</Badge>;
  return <Badge variant="neutral">Unverified</Badge>;
}
