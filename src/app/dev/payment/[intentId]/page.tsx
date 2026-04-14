import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth-helpers";
import { prisma } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatGbp } from "@/lib/money";
import { confirmDevPayment, declineDevPayment } from "./actions";

export default async function DevPaymentPage({ params }: { params: { intentId: string } }) {
  const user = await requireUser();
  const intentId = decodeURIComponent(params.intentId);
  const transfer = await prisma.transfer.findFirst({
    where: { paymentIntentId: intentId, senderId: user.id },
    include: { recipient: true },
  });
  if (!transfer) notFound();

  return (
    <div className="min-h-screen bg-bg-50 py-12">
      <div className="container-marketing">
        <div className="mx-auto max-w-md">
          <div className="text-center mb-6">
            <p className="text-caption text-text-500">DEV PAYMENT GATEWAY</p>
            <p className="text-body text-text-500">
              In production this is your card processor's checkout page.
            </p>
          </div>
          <Card>
            <CardHeader>
              <CardTitle>Pay {formatGbp(transfer.totalChargedGbp.toString())}</CardTitle>
              <CardDescription>
                Transfer {transfer.reference} to {transfer.recipient.fullName}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-lg bg-bg-50 p-4 text-caption">
                <p className="text-text-500">Sandbox card</p>
                <p className="font-mono text-text-900">4242 4242 4242 4242</p>
                <p className="text-text-500">Any expiry, any CVC.</p>
              </div>
              <form action={confirmDevPayment}>
                <input type="hidden" name="intentId" value={intentId} />
                <Button type="submit" width="full" size="lg">
                  Pay {formatGbp(transfer.totalChargedGbp.toString())}
                </Button>
              </form>
              <form action={declineDevPayment}>
                <input type="hidden" name="intentId" value={intentId} />
                <Button type="submit" variant="ghost" width="full">
                  Cancel
                </Button>
              </form>
            </CardContent>
          </Card>
          <p className="mt-4 text-center text-micro text-text-500">
            This is a development sandbox. No real card is charged.
          </p>
        </div>
      </div>
    </div>
  );
}
