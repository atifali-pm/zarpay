"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { signOut } from "@/lib/auth-actions";
import { cn } from "@/lib/cn";

const links = [
  { href: "/admin", label: "Overview" },
  { href: "/admin/kyc", label: "KYC queue" },
  { href: "/admin/transfers", label: "Transfers" },
  { href: "/admin/compliance", label: "Compliance" },
  { href: "/admin/rates", label: "Rates" },
  { href: "/admin/users", label: "Users" },
  { href: "/admin/audit", label: "Audit log" },
];

export function AdminNav({ name, role }: { name: string; role: string }) {
  const pathname = usePathname();

  return (
    <aside className="w-64 border-r border-border bg-white flex-shrink-0 hidden md:flex flex-col">
      <div className="px-6 py-5 border-b border-border">
        <Link href="/admin" className="flex items-center gap-2">
          <Logo size="md" />
          <Badge variant="default" className="text-micro">
            OPS
          </Badge>
        </Link>
      </div>
      <nav className="flex-1 py-4">
        {links.map((l) => {
          const active = pathname === l.href || (l.href !== "/admin" && pathname.startsWith(l.href));
          return (
            <Link
              key={l.href}
              href={l.href}
              className={cn(
                "block px-6 py-2.5 text-body transition-colors",
                active
                  ? "bg-primary-100 text-primary-900 font-semibold border-l-4 border-l-primary-900"
                  : "text-text-700 hover:bg-bg-50 border-l-4 border-l-transparent",
              )}
            >
              {l.label}
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-border p-4">
        <p className="text-caption text-text-900 font-medium">{name}</p>
        <p className="text-micro text-text-500 capitalize">{role}</p>
        <div className="mt-2 flex gap-2">
          <Link href="/dashboard" className="text-micro text-primary-700 hover:underline">
            Sender view
          </Link>
          <form action={signOut} className="ml-auto">
            <Button type="submit" variant="ghost" size="sm" className="h-7 px-2 text-micro">
              Log out
            </Button>
          </form>
        </div>
      </div>
    </aside>
  );
}
