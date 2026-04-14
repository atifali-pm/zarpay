import { requireAdmin } from "@/lib/auth-helpers";
import { AdminNav } from "@/components/admin/admin-nav";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await requireAdmin();
  return (
    <div className="min-h-screen flex bg-bg-50">
      <AdminNav name={user.fullName} role={user.role} />
      <main className="flex-1 min-w-0">{children}</main>
    </div>
  );
}
