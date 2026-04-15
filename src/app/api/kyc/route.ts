import { NextResponse, type NextRequest } from "next/server";
import type { KycDocType } from "@prisma/client";
import { prisma } from "@/lib/db";
import { requireBearerUser, toPublicUser } from "@/lib/api-auth";
import { getKycStorageProvider } from "@/lib/providers/kyc-storage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ALLOWED_MIME = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
  "application/pdf",
]);
const MAX_BYTES = 8 * 1024 * 1024; // 8 MB per file
const ALLOWED_ID_TYPES = new Set(["passport", "driving_licence", "national_id"]);

export async function POST(req: NextRequest) {
  const auth = await requireBearerUser(req);
  if ("response" in auth) return auth.response;

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json(
      { error: "Expected multipart form data", code: "BAD_BODY" },
      { status: 400 },
    );
  }

  const idType = form.get("id_type");
  if (typeof idType !== "string" || !ALLOWED_ID_TYPES.has(idType)) {
    return NextResponse.json(
      { error: "Pick a valid id type (passport, driving_licence, national_id)", code: "VALIDATION" },
      { status: 400 },
    );
  }

  const entries: Array<[KycDocType, File]> = [];
  for (const docType of ["id_front", "id_back", "selfie"] as const) {
    const file = form.get(docType);
    if (!(file instanceof File)) {
      return NextResponse.json(
        { error: `${docType} is required`, code: "VALIDATION" },
        { status: 400 },
      );
    }
    if (!ALLOWED_MIME.has(file.type)) {
      return NextResponse.json(
        { error: `${docType}: unsupported file type ${file.type}`, code: "BAD_MIME" },
        { status: 400 },
      );
    }
    if (file.size > MAX_BYTES) {
      return NextResponse.json(
        { error: `${docType}: file is larger than 8 MB`, code: "TOO_LARGE" },
        { status: 413 },
      );
    }
    entries.push([docType, file]);
  }

  const storage = getKycStorageProvider();
  const userId = auth.user.id;

  // Drop any previously uploaded docs for this user so a re-submit replaces
  // the old set instead of stacking (local storage provider keeps files on
  // disk, they become orphaned but are safe to leave in dev).
  await prisma.kycDocument.deleteMany({ where: { userId } });

  for (const [docType, file] of entries) {
    const bytes = Buffer.from(await file.arrayBuffer());
    const stored = await storage.store({
      userId,
      docType,
      fileName: file.name || `${docType}.jpg`,
      bytes,
      mimeType: file.type,
    });
    await prisma.kycDocument.create({
      data: {
        userId,
        docType,
        filePath: stored.filePath,
        mimeType: file.type,
        sizeBytes: stored.sizeBytes,
        status: "pending",
        reviewNotes: docType === "id_front" ? `id_type=${idType}` : null,
      },
    });
  }

  const updated = await prisma.user.update({
    where: { id: userId },
    data: { kycStatus: "pending" },
  });

  return NextResponse.json({
    ok: true,
    user: toPublicUser(updated),
  });
}
