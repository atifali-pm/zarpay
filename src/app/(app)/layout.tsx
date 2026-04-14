import { requireUser } from "@/lib/auth-helpers";
import { SenderNav } from "@/components/app/sender-nav";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  return (
    <div className="min-h-screen flex flex-col bg-bg-50">
      <SenderNav name={user.fullName} role={user.role} />
      <main className="flex-1">{children}</main>
    </div>
  );
}
