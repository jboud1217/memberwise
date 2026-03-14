"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Sidebar } from "./sidebar";

export function DashboardShell({
  siteUrl,
  children,
}: {
  siteUrl: string;
  children: React.ReactNode;
}) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <>
      <Sidebar
        siteUrl={siteUrl}
        collapsed={collapsed}
        onToggleCollapse={() => setCollapsed(!collapsed)}
      />
      <main className={cn("relative z-10 transition-all duration-300", collapsed ? "lg:pl-[68px]" : "lg:pl-64")}>
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">{children}</div>
      </main>
    </>
  );
}
