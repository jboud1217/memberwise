"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Sidebar } from "./sidebar";
import { CommandPalette } from "./command-palette";
import { KeyboardShortcuts } from "./keyboard-shortcuts";
import { FloatingActions } from "./floating-actions";
import { ToastProvider } from "@/components/ui/toast-provider";

export function DashboardShell({
  siteUrl,
  children,
}: {
  siteUrl: string;
  children: React.ReactNode;
}) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <ToastProvider>
      <Sidebar
        siteUrl={siteUrl}
        collapsed={collapsed}
        onToggleCollapse={() => setCollapsed(!collapsed)}
      />
      <main className={cn("relative z-10 transition-all duration-300", collapsed ? "lg:pl-[68px]" : "lg:pl-64")}>
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 page-enter">{children}</div>
      </main>
      <CommandPalette />
      <KeyboardShortcuts />
      <FloatingActions />
    </ToastProvider>
  );
}
