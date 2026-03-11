"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { LogOut } from "lucide-react";

const navigation = [
  { name: "Home", href: "/portal" },
  { name: "Dues", href: "/portal/dues" },
  { name: "Directory", href: "/portal/directory" },
  { name: "Profile", href: "/portal/profile" },
];

export function MinimalTopNav() {
  const pathname = usePathname();

  return (
    <header className="border-b border-[var(--border)]">
      <div className="mx-auto flex h-14 max-w-4xl items-center justify-between px-4">
        <Link href="/portal" className="text-base font-semibold text-[var(--foreground)]">
          MemberWise
        </Link>
        <nav className="hidden items-center gap-6 sm:flex">
          {navigation.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "text-sm transition-colors",
                  isActive
                    ? "font-medium text-[var(--foreground)]"
                    : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                )}
              >
                {item.name}
              </Link>
            );
          })}
        </nav>
        <form action="/api/auth/signout" method="POST">
          <button
            type="submit"
            className="text-sm text-[var(--muted-foreground)] transition-colors hover:text-[var(--foreground)]"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </form>
      </div>
    </header>
  );
}
