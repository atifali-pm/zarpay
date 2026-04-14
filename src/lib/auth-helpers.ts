import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";

export async function requireUser() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }
  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user || user.deletedAt) {
    redirect("/login");
  }
  return user;
}

export async function requireKycApprovedUser() {
  const user = await requireUser();
  if (user.kycStatus !== "approved") {
    redirect("/dashboard");
  }
  return user;
}

export async function requireAdmin() {
  const user = await requireUser();
  if (user.role !== "reviewer" && user.role !== "compliance" && user.role !== "admin") {
    redirect("/dashboard");
  }
  return user;
}

export async function requireRole(roles: Array<"reviewer" | "compliance" | "admin">) {
  const user = await requireUser();
  if (!roles.includes(user.role as never)) {
    redirect("/dashboard");
  }
  return user;
}

export async function getOptionalUser() {
  const session = await auth();
  if (!session?.user?.id) return null;
  return prisma.user.findUnique({ where: { id: session.user.id } });
}
