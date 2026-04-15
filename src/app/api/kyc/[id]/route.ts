import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { getKycStorageProvider } from "@/lib/providers/kyc-storage";

export const runtime = "nodejs";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userRole = session.user.role;
  const isAdmin = userRole === "reviewer" || userRole === "compliance" || userRole === "admin";

  const doc = await prisma.kycDocument.findUnique({ where: { id: params.id } });
  if (!doc) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Only admins or the doc's owner can view
  if (!isAdmin && doc.userId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const storage = getKycStorageProvider();
  const file = await storage.read(doc.filePath);
  if (!file) return NextResponse.json({ error: "File missing" }, { status: 404 });

  return new NextResponse(new Uint8Array(file.bytes), {
    headers: {
      "Content-Type": file.mimeType,
      "Cache-Control": "private, no-store",
    },
  });
}
