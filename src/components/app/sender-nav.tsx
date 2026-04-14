"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo } from "@/components/brand/logo";
import { cn } from "@/lib/cn";
import { signOut } from "@/lib/auth-actions";
import { Button } from "@/components/ui/button";

const links = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/send", label: "Send money" },
  { href: "/recipients", label: "Recipients" },
  { href: "/transfers", label: "Transfers" },
];

export function SenderNav({ name, role }: { name: string; role: string }) {
  const pathname = usePathname();
  return (
    <header className="border-b border-border bg-white">
      <div className="container-app flex h-16 items-center justify-between">
        <div className="flex items-center gap-8">
          <Link href="/dashboard">
            <Logo size="md" />
          </Link>
          <nav className="hidden md:flex items-center gap-6">
            {links.map((l) => {
              const active = pathname === l.href || pathname.startsWith(l.href + "/");
              return (
                <Link
                  key={l.href}
                  href={l.href}
                  className={cn(
                    "text-body transition-colors",
                    active ? "text-primary-900 font-semibold" : "text-text-700 hover:text-primary-900",
                  )}
                >
                  {l.label}
                </Link>
              );
            })}
          </nav>
        </div>
        <div className="flex items-center gap-4">
          {(role === "reviewer" || role === "compliance" || role === "admin") && (
            <Link href="/admin" className="text-caption text-primary-700 hover:underline">
              Operations →
            </Link>
          )}
          <span className="hidden sm:inline text-caption text-text-500">{name}</span>
          <form action={signOut}>
            <Button type="submit" variant="ghost" size="sm">
              Log out
            </Button>
          </form>
        </div>
      </div>
    </header>
  );
}
