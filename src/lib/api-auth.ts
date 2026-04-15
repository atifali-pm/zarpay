import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { verifyToken } from "@/lib/jwt";
import type { User } from "@prisma/client";
import type { PublicUser } from "@zarpay/types";

/**
 * Extract the bearer token from the Authorization header, verify it,
 * and load the corresponding user from the database. Returns null if
 * there is no valid token.
 */
export async function getBearerUser(req: NextRequest): Promise<User | null> {
  const header = req.headers.get("authorization") ?? req.headers.get("Authorization");
  if (!header) return null;
  const match = /^Bearer (.+)$/i.exec(header.trim());
  if (!match) return null;
  try {
    const claims = await verifyToken(match[1]);
    const user = await prisma.user.findUnique({ where: { id: claims.sub } });
    if (!user || user.deletedAt || user.frozen) return null;
    return user;
  } catch {
    return null;
  }
}

/**
 * Require a bearer-authenticated user. If absent or invalid, returns a
 * NextResponse the caller should return directly. If present, returns the
 * User object and the caller continues.
 */
export async function requireBearerUser(
  req: NextRequest,
): Promise<{ user: User } | { response: NextResponse }> {
  const user = await getBearerUser(req);
  if (!user) {
    return {
      response: NextResponse.json(
        { error: "Unauthorized", code: "UNAUTHORIZED" },
        { status: 401 },
      ),
    };
  }
  return { user };
}

/**
 * Same as requireBearerUser but also enforces approved KYC. Use this on
 * endpoints that create or read transfers, recipients, etc.
 */
export async function requireKycApprovedUser(
  req: NextRequest,
): Promise<{ user: User } | { response: NextResponse }> {
  const result = await requireBearerUser(req);
  if ("response" in result) return result;
  if (result.user.kycStatus !== "approved") {
    return {
      response: NextResponse.json(
        { error: "KYC not approved", code: "KYC_REQUIRED" },
        { status: 403 },
      ),
    };
  }
  return { user: result.user };
}

/**
 * Project a Prisma User into the PublicUser DTO the client sees.
 */
export function toPublicUser(user: User): PublicUser {
  return {
    id: user.id,
    email: user.email,
    fullName: user.fullName,
    phone: user.phone,
    role: user.role,
    kycStatus: user.kycStatus,
    kycTier: user.kycTier,
    country: user.country,
  };
}
