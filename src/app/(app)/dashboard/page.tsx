import Link from "next/link";
import { requireUser } from "@/lib/auth-helpers";
import { prisma } from "@/lib/db";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StatusPill } from "@/components/brand/status-pill";
import { formatGbp, formatPkr } from "@/lib/money";
import { formatRelative } from "@/lib/format";

export default async function DashboardPage() {
  const user = await requireUser();

  const [transfers, count, recipientsCount, totals] = await Promise.all([
    prisma.transfer.findMany({
      where: { senderId: user.id },
      orderBy: { createdAt: "desc" },
      take: 5,
      include: { recipient: true },
    }),
    prisma.transfer.count({ where: { senderId: user.id } }),
    prisma.recipient.count({ where: { userId: user.id, deletedAt: null } }),
    prisma.transfer.aggregate({
      where: {
        senderId: user.id,
        status: { notIn: ["cancelled", "rejected"] },
      },
      _sum: { sendAmountGbp: true },
    }),
  ]);

  const totalSent = totals._sum.sendAmountGbp ?? "0";

  const kycApproved = user.kycStatus === "approved";

  return (
    <div className="container-app py-10 space-y-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-display-lg font-display font-bold">
          Welcome back, {user.fullName.split(" ")[0]}
        </h1>
        <p className="text-body text-text-500">Here is what is happening with your transfers.</p>
      </div>

      {/* KYC banner */}
      {user.kycStatus === "unverified" && (
        <Card className="border-l-4 border-l-warning-500 bg-warning-100">
          <CardContent className="py-5">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h3 className="text-heading-md font-semibold text-text-900">
                  Verify your identity to start sending
                </h3>
                <p className="mt-1 text-body text-text-700">
                  We need a phone OTP and a photo of your ID. Takes about 3 minutes.
                </p>
              </div>
              <Button asChild>
                <Link href="/onboarding/otp">Start verification</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
      {user.kycStatus === "pending" && (
        <Card className="border-l-4 border-l-warning-500 bg-warning-100">
          <CardContent className="py-5">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h3 className="text-heading-md font-semibold text-text-900">
                  Your verification is under review
                </h3>
                <p className="mt-1 text-body text-text-700">
                  We will email you the moment a reviewer approves your documents.
                </p>
              </div>
              <Badge variant="warning">Pending review</Badge>
            </div>
          </CardContent>
        </Card>
      )}
      {user.kycStatus === "rejected" && (
        <Card className="border-l-4 border-l-danger-500 bg-danger-100">
          <CardContent className="py-5">
            <h3 className="text-heading-md font-semibold text-text-900">
              Your verification was not accepted
            </h3>
            <p className="mt-1 text-body text-text-700">
              Please re-upload fresh, clearly visible photos of your ID and a new selfie.
            </p>
            <div className="mt-3">
              <Button asChild>
                <Link href="/onboarding/kyc">Re-submit documents</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stat cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Stat label="Total sent" value={formatGbp(totalSent)} />
        <Stat label="Transfers" value={String(count)} />
        <Stat label="Recipients" value={String(recipientsCount)} />
      </div>

      {/* Send CTA */}
      <Card className="bg-primary-900 text-white">
        <CardContent className="py-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h3 className="text-heading-xl font-semibold text-white">Send money to Pakistan</h3>
              <p className="mt-1 text-body text-primary-100">
                {kycApproved
                  ? "Mid-market rate. Disclosed spread. Quote locked for 60 minutes."
                  : "You need to complete identity verification first."}
              </p>
            </div>
            <Button
              asChild
              variant="accent"
              size="lg"
              disabled={!kycApproved}
              className={!kycApproved ? "pointer-events-none opacity-60" : ""}
            >
              <Link href={kycApproved ? "/send" : "/dashboard"}>Start a transfer</Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Recent transfers */}
      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <div>
            <CardTitle>Recent transfers</CardTitle>
            <CardDescription>Your last 5 transfers</CardDescription>
          </div>
          <Link href="/transfers" className="text-caption text-primary-700 hover:underline">
            View all →
          </Link>
        </CardHeader>
        <CardContent>
          {transfers.length === 0 ? (
            <div className="py-10 flex flex-col items-center text-center">
              <div className="h-14 w-14 rounded-full bg-primary-100 flex items-center justify-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-7 w-7 text-primary-700"
                >
                  <path d="M22 2 11 13" />
                  <path d="M22 2 15 22l-4-9-9-4z" />
                </svg>
              </div>
              <p className="mt-4 text-body font-semibold text-text-900">
                No transfers yet
              </p>
              <p className="mt-1 text-caption text-text-500 max-w-sm">
                Send your first transfer to Pakistan. Quote locked for 60 minutes, mid-market rate, disclosed spread.
              </p>
              {kycApproved ? (
                <Button asChild size="sm" className="mt-4">
                  <Link href="/send">Start your first transfer →</Link>
                </Button>
              ) : (
                <p className="mt-4 text-caption text-text-500">
                  Complete KYC above to start sending.
                </p>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {transfers.map((t) => (
                <Link
                  href={`/transfers/${t.id}`}
                  key={t.id}
                  className="flex items-center justify-between rounded-lg border border-border p-4 hover:bg-bg-50 transition-colors"
                >
                  <div>
                    <p className="font-mono text-caption text-text-500">{t.reference}</p>
                    <p className="font-semibold text-text-900">{t.recipient.fullName}</p>
                    <p className="text-caption text-text-500">{formatRelative(t.createdAt)}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold tabular-nums">{formatGbp(t.sendAmountGbp.toString())}</p>
                    <p className="text-caption text-text-500 tabular-nums">
                      {formatPkr(t.receiveAmountPkr.toString())}
                    </p>
                    <div className="mt-1">
                      <StatusPill status={t.status} />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <Card>
      <CardContent className="pt-6">
        <p className="text-caption font-semibold uppercase tracking-wider text-text-500">
          {label}
        </p>
        <p className="mt-2 text-display-lg font-display font-bold tabular-nums">{value}</p>
      </CardContent>
    </Card>
  );
}
