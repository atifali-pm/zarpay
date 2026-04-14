import Link from "next/link";
import { prisma } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatRelative } from "@/lib/format";
import { formatGbp } from "@/lib/money";
import { COMPLIANCE_THRESHOLDS } from "@/lib/compliance/rules";
import { clearFlagAction, escalateFlagAction, rejectFlagAction } from "./actions";

export default async function CompliancePage() {
  const flags = await prisma.complianceFlag.findMany({
    where: { status: { in: ["open", "escalated"] } },
    orderBy: [{ severity: "desc" }, { raisedAt: "desc" }],
    include: { transfer: { include: { sender: true, recipient: true } } },
  });

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-display-lg font-display font-bold">Compliance review</h1>
        <p className="text-body text-text-500">
          {flags.length} open or escalated flag{flags.length === 1 ? "" : "s"}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Active rules</CardTitle>
          <CardDescription>From environment</CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="grid gap-2 md:grid-cols-2 text-caption text-text-700">
            <li>· Single transfer ≥ £{COMPLIANCE_THRESHOLDS.singleGbp}</li>
            <li>· Daily aggregate ≥ £{COMPLIANCE_THRESHOLDS.dailyGbp}</li>
            <li>
              · {COMPLIANCE_THRESHOLDS.velocityCount}+ transfers in{" "}
              {COMPLIANCE_THRESHOLDS.velocityWindowHours}h
            </li>
            <li>· Manual sanctions watchlist (build only)</li>
          </ul>
        </CardContent>
      </Card>

      {flags.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <p className="text-body text-text-500">No flags right now.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {flags.map((f) => (
            <Card
              key={f.id}
              className={
                f.severity === "high"
                  ? "border-l-4 border-l-danger-500"
                  : f.severity === "medium"
                    ? "border-l-4 border-l-warning-500"
                    : ""
              }
            >
              <CardHeader>
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div>
                    <CardTitle className="text-heading-md">
                      <Link
                        href={`/admin/transfers/${f.transferId}`}
                        className="font-mono text-primary-700 hover:underline"
                      >
                        {f.transfer.reference}
                      </Link>{" "}
                      <span className="text-text-500 font-normal">
                        · {f.rule.replace(/_/g, " ")}
                      </span>
                    </CardTitle>
                    <CardDescription className="mt-1">
                      {f.transfer.sender.fullName} → {f.transfer.recipient.fullName} ·{" "}
                      {formatGbp(f.transfer.sendAmountGbp.toString())} ·{" "}
                      {formatRelative(f.raisedAt)}
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <SeverityBadge severity={f.severity} />
                    <Badge variant={f.status === "escalated" ? "warning" : "neutral"}>
                      {f.status}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-body text-text-700">{f.notes}</p>
                <div className="mt-4 flex gap-2 flex-wrap">
                  <form action={clearFlagAction}>
                    <input type="hidden" name="flagId" value={f.id} />
                    <Button type="submit" size="sm">
                      Clear
                    </Button>
                  </form>
                  <form action={escalateFlagAction}>
                    <input type="hidden" name="flagId" value={f.id} />
                    <Button type="submit" size="sm" variant="secondary">
                      Escalate
                    </Button>
                  </form>
                  <form action={rejectFlagAction}>
                    <input type="hidden" name="flagId" value={f.id} />
                    <Button type="submit" size="sm" variant="destructive">
                      Reject transfer
                    </Button>
                  </form>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function SeverityBadge({ severity }: { severity: "low" | "medium" | "high" }) {
  if (severity === "high") return <Badge variant="danger">High</Badge>;
  if (severity === "medium") return <Badge variant="warning">Medium</Badge>;
  return <Badge variant="neutral">Low</Badge>;
}
