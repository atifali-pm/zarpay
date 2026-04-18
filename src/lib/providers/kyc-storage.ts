import { promises as fs } from "fs";
import path from "path";
import crypto from "crypto";

export interface KycStorageProvider {
  name: string;
  store(args: {
    userId: string;
    docType: string;
    fileName: string;
    bytes: Buffer;
    mimeType: string;
  }): Promise<{ filePath: string; sizeBytes: number }>;
  read(filePath: string): Promise<{ bytes: Buffer; mimeType: string } | null>;
}

class VercelBlobKycStorageProvider implements KycStorageProvider {
  name = "vercel_blob";

  async store(args: {
    userId: string;
    docType: string;
    fileName: string;
    bytes: Buffer;
    mimeType: string;
  }) {
    const { put } = await import("@vercel/blob");
    const ext = path.extname(args.fileName) || mimeToExt(args.mimeType);
    const key = `kyc/${args.userId}/${args.docType}-${crypto.randomBytes(6).toString("hex")}${ext}`;
    const blob = await put(key, args.bytes, {
      access: "public",
      contentType: args.mimeType,
      addRandomSuffix: false,
    });
    return { filePath: blob.url, sizeBytes: args.bytes.byteLength };
  }

  async read(filePath: string) {
    if (!/^https?:\/\//.test(filePath)) return null;
    const res = await fetch(filePath);
    if (!res.ok) return null;
    const mimeType = res.headers.get("content-type") ?? "application/octet-stream";
    const bytes = Buffer.from(await res.arrayBuffer());
    return { bytes, mimeType };
  }
}

class LocalKycStorageProvider implements KycStorageProvider {
  name = "local";
  private root = path.join(process.cwd(), "kyc-uploads");

  async store(args: {
    userId: string;
    docType: string;
    fileName: string;
    bytes: Buffer;
    mimeType: string;
  }) {
    const dir = path.join(this.root, args.userId);
    await fs.mkdir(dir, { recursive: true });
    const ext = path.extname(args.fileName) || mimeToExt(args.mimeType);
    const safeName = `${args.docType}-${crypto.randomBytes(6).toString("hex")}${ext}`;
    const fullPath = path.join(dir, safeName);
    await fs.writeFile(fullPath, args.bytes);
    return {
      filePath: path.relative(process.cwd(), fullPath),
      sizeBytes: args.bytes.byteLength,
    };
  }

  async read(filePath: string) {
    try {
      const bytes = await fs.readFile(path.join(process.cwd(), filePath));
      const mimeType = extToMime(path.extname(filePath));
      return { bytes, mimeType };
    } catch {
      return null;
    }
  }
}

function mimeToExt(mime: string): string {
  if (mime.includes("png")) return ".png";
  if (mime.includes("jpeg") || mime.includes("jpg")) return ".jpg";
  if (mime.includes("pdf")) return ".pdf";
  if (mime.includes("webp")) return ".webp";
  if (mime.includes("svg")) return ".svg";
  return ".bin";
}

function extToMime(ext: string): string {
  const e = ext.toLowerCase();
  if (e === ".png") return "image/png";
  if (e === ".jpg" || e === ".jpeg") return "image/jpeg";
  if (e === ".pdf") return "application/pdf";
  if (e === ".webp") return "image/webp";
  if (e === ".svg") return "image/svg+xml";
  return "application/octet-stream";
}

export function getKycStorageProvider(): KycStorageProvider {
  const choice = (process.env.KYC_STORAGE_PROVIDER ?? "local").toLowerCase();
  if (choice === "vercel_blob") return new VercelBlobKycStorageProvider();
  return new LocalKycStorageProvider();
}
