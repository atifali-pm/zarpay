import { SignJWT, jwtVerify, type JWTPayload } from "jose";

const encoder = new TextEncoder();

function getSecret(): Uint8Array {
  const raw = process.env.AUTH_JWT_SECRET;
  if (!raw || raw.length < 32) {
    throw new Error("AUTH_JWT_SECRET is missing or shorter than 32 characters");
  }
  return encoder.encode(raw);
}

const ISSUER = process.env.AUTH_JWT_ISSUER ?? "zarpay";
const AUDIENCE = process.env.AUTH_JWT_AUDIENCE ?? "zarpay-mobile";
const EXPIRES_IN = process.env.AUTH_JWT_EXPIRES_IN ?? "30d";

export interface ZarpayTokenClaims extends JWTPayload {
  sub: string;
  email: string;
  role: string;
  kycStatus: string;
}

export async function signToken(claims: {
  sub: string;
  email: string;
  role: string;
  kycStatus: string;
}): Promise<string> {
  return new SignJWT({
    email: claims.email,
    role: claims.role,
    kycStatus: claims.kycStatus,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(claims.sub)
    .setIssuer(ISSUER)
    .setAudience(AUDIENCE)
    .setIssuedAt()
    .setExpirationTime(EXPIRES_IN)
    .sign(getSecret());
}

export async function verifyToken(token: string): Promise<ZarpayTokenClaims> {
  const { payload } = await jwtVerify(token, getSecret(), {
    issuer: ISSUER,
    audience: AUDIENCE,
  });
  if (typeof payload.sub !== "string") {
    throw new Error("token has no subject");
  }
  return payload as ZarpayTokenClaims;
}
