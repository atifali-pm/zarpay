import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { approveKycAction, rejectKycAction } from "./actions";

const DOC_LABELS: Record<string, string> = {
  id_front: "ID front",
  id_back: "ID back",
  selfie: "Selfie",
  proof_of_address: "Proof of address",
};

export default async function KycReviewPage({ params }: { params: { id: string } }) {
  const user = await prisma.user.findUnique({
    where: { id: params.id },
    include: { kycDocuments: { orderBy: { docType: "asc" } } },
  });
  if (!user) notFound();

  return (
    <div className="p-8 space-y-6">
      <div>
        <Link href="/admin/kyc" className="text-caption text-text-500 hover:underline">
          ← Back to queue
        </Link>
        <div className="mt-2 flex items-center gap-3 flex-wrap">
          <h1 className="text-display-lg font-display font-bold">{user.fullName}</h1>
          {user.kycStatus === "pending" && <Badge variant="warning">Pending</Badge>}
          {user.kycStatus === "rejected" && <Badge variant="danger">Rejected</Badge>}
          {user.kycStatus === "approved" && <Badge variant="success">Approved</Badge>}
        </div>
        <p className="text-body text-text-500 mt-1">{user.email}</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Documents</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                {user.kycDocuments.map((doc) => (
                  <div key={doc.id} className="rounded-lg border border-border p-3">
                    <p className="text-caption font-semibold text-text-700">
                      {DOC_LABELS[doc.docType] ?? doc.docType}
                    </p>
                    <div className="mt-2 aspect-[4/3] bg-bg-50 rounded flex items-center justify-center overflow-hidden">
                      {doc.mimeType.startsWith("image/") ? (
                        <img
                          src={`/api/kyc/${doc.id}`}
                          alt={doc.docType}
                          className="w-full h-full object-contain"
                        />
                      ) : (
                        <a
                          href={`/api/kyc/${doc.id}`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-caption text-primary-700 hover:underline"
                        >
                          Open file ({doc.mimeType})
                        </a>
                      )}
                    </div>
                    <p className="mt-2 text-micro text-text-500">
                      {(doc.sizeBytes / 1024).toFixed(0)} KB · {doc.mimeType}
                    </p>
                  </div>
                ))}
                {user.kycDocuments.length === 0 && (
                  <p className="text-body text-text-500">No documents uploaded.</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>User profile</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="space-y-2 text-caption">
                <Row label="Phone" value={user.phone ?? "·"} />
                <Row label="Country" value={user.country} />
                <Row label="KYC tier" value={String(user.kycTier)} />
                <Row label="Joined" value={user.createdAt.toISOString().slice(0, 10)} />
              </dl>
            </CardContent>
          </Card>

          {user.kycStatus !== "approved" && user.kycDocuments.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Decision</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <form action={approveKycAction}>
                  <input type="hidden" name="userId" value={user.id} />
                  <Button type="submit" variant="primary" width="full">
                    Approve
                  </Button>
                </form>
                <form action={rejectKycAction} className="space-y-3">
                  <input type="hidden" name="userId" value={user.id} />
                  <div>
                    <Label htmlFor="reason">Reason (sent to user)</Label>
                    <Textarea
                      id="reason"
                      name="reason"
                      placeholder="ID expired, photo too dark, name does not match…"
                    />
                  </div>
                  <Button type="submit" variant="destructive" width="full">
                    Reject
                  </Button>
                </form>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-text-500">{label}</dt>
      <dd className="text-text-900 font-medium">{value}</dd>
    </div>
  );
}
