import type { DefaultSession } from "next-auth";
import type { UserRole, KycStatus } from "@prisma/client";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: UserRole;
      kycStatus: KycStatus;
    } & DefaultSession["user"];
  }

  interface User {
    role?: UserRole;
    kycStatus?: KycStatus;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    role?: UserRole;
    kycStatus?: KycStatus;
  }
}
