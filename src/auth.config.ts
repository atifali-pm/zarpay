import type { NextAuthConfig } from "next-auth";

/**
 * Edge-safe auth config (no Node-only modules like bcrypt/PrismaClient).
 * Used by middleware. Full config in src/auth.ts extends this.
 */
export const authConfig = {
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
    maxAge: 60 * 60 * 24 * 30,
  },
  trustHost: true,
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as { role?: string }).role;
        token.kycStatus = (user as { kycStatus?: string }).kycStatus;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && token) {
        (session.user as { id?: string }).id = token.id as string;
        (session.user as { role?: string }).role = token.role as string;
        (session.user as { kycStatus?: string }).kycStatus = token.kycStatus as string;
      }
      return session;
    },
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const path = nextUrl.pathname;
      const role = (auth?.user as { role?: string } | undefined)?.role;

      const isAppArea =
        path.startsWith("/dashboard") ||
        path.startsWith("/onboarding") ||
        path.startsWith("/recipients") ||
        path.startsWith("/send") ||
        path.startsWith("/transfers");
      const isAdminArea = path.startsWith("/admin");

      if (isAdminArea) {
        if (!isLoggedIn) return false;
        if (role === "reviewer" || role === "compliance" || role === "admin") return true;
        return false;
      }
      if (isAppArea) {
        return isLoggedIn;
      }
      return true;
    },
  },
  providers: [],
} satisfies NextAuthConfig;
