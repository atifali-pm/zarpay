"use server";

import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { getKycStorageProvider } from "@/lib/providers/kyc-storage";

export type KycState = { error?: string; success?: string };

const ALLOWED_MIME = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
const MAX_BYTES = 8 * 1024 * 1024;

export async function uploadKycAction(_prev: KycState, formData: FormData): Promise<KycState> {
  const session = await auth();
  if (!session?.user?.id) return { error: "Not signed in" };

  const idFront = formData.get("id_front") as File | null;
  const idBack = formData.get("id_back") as File | null;
  const selfie = formData.get("selfie") as File | null;
  const idType = (formData.get("id_type") as string) ?? "passport";

  if (!idFront || !idBack || !selfie) {
    return { error: "Please upload all three documents." };
  }
  for (const f of [idFront, idBack, selfie]) {
    if (!ALLOWED_MIME.includes(f.type)) {
      return { error: `${f.name}: unsupported file type. Use JPG, PNG, WebP, or PDF.` };
    }
    if (f.size > MAX_BYTES) {
      return { error: `${f.name}: file is larger than 8 MB.` };
    }
  }

  const storage = getKycStorageProvider();

  const userId = session.user.id;
  for (const [type, file] of [
    ["id_front" as const, idFront],
    ["id_back" as const, idBack],
    ["selfie" as const, selfie],
  ]) {
    const buf = Buffer.from(await file.arrayBuffer());
    const stored = await storage.store({
      userId,
      docType: type,
      fileName: file.name,
      bytes: buf,
      mimeType: file.type,
    });
    await prisma.kycDocument.create({
      data: {
        userId,
        docType: type,
        filePath: stored.filePath,
        mimeType: file.type,
        sizeBytes: stored.sizeBytes,
        status: "pending",
      },
    });
  }

  await prisma.user.update({
    where: { id: userId },
    data: { kycStatus: "pending" },
  });

  // Stash the id type in a placeholder note via the first doc (out of scope to model separately)
  await prisma.kycDocument.updateMany({
    where: { userId, docType: "id_front" },
    data: { reviewNotes: `id_type=${idType}` },
  });

  redirect("/dashboard");
}
