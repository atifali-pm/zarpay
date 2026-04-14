import Link from "next/link";
import { requireUser } from "@/lib/auth-helpers";
import { prisma } from "@/lib/db";
import { getMidRate, getDefaultSpreadBps, getDefaultFeeGbp } from "@/lib/fx";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SendForm } from "./send-form";
import { Button } from "@/components/ui/button";

export default async function SendPage({
  searchParams,
}: {
  searchParams: { recipient?: string };
}) {
  const user = await requireUser();

  if (user.kycStatus !== "approved") {
    return (
      <div className="container-app py-12">
        <Card>
          <CardHeader>
            <CardTitle>Verify your identity first</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-body text-text-500">
              You need to complete identity verification before you can send money.
            </p>
            <div className="mt-4">
              <Button asChild>
                <Link href="/onboarding/otp">Continue verification</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const [recipients, fx] = await Promise.all([
    prisma.recipient.findMany({
      where: { userId: user.id, deletedAt: null },
      orderBy: { createdAt: "desc" },
    }),
    getMidRate("GBP", "PKR"),
  ]);

  if (recipients.length === 0) {
    return (
      <div className="container-app py-12">
        <Card>
          <CardHeader>
            <CardTitle>Add a recipient first</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-body text-text-500">
              You need at least one recipient saved before you can send a transfer.
            </p>
            <div className="mt-4">
              <Button asChild>
                <Link href="/recipients/new">Add a recipient</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container-app py-10">
      <div className="mx-auto max-w-2xl">
        <h1 className="text-display-lg font-display font-bold">Send money</h1>
        <p className="text-body text-text-500 mt-1">
          Mid-market rate, {(getDefaultSpreadBps() / 100).toFixed(2)}% spread, £
          {getDefaultFeeGbp().toString()} fee. Quote locked for 60 minutes once you confirm.
        </p>

        <div className="mt-8">
          <SendForm
            recipients={recipients.map((r) => ({
              id: r.id,
              fullName: r.fullName,
              nickname: r.nickname,
              payoutMethod: r.payoutMethod,
              accountDetails: r.accountDetails as Record<string, unknown>,
            }))}
            initialRecipientId={searchParams.recipient ?? recipients[0].id}
            rate={{
              midRate: fx.midRate.toString(),
              spreadBps: getDefaultSpreadBps(),
              feeGbp: getDefaultFeeGbp().toString(),
              source: fx.source,
            }}
          />
        </div>
      </div>
    </div>
  );
}
