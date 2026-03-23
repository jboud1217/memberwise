"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

const SHORTCUTS: Record<string, string> = {
  d: "/dashboard",
  m: "/members",
  c: "/contacts",
  t: "/tiers",
  b: "/billing",
  o: "/donations",
  v: "/events",
  e: "/email",
  w: "/automations",
  r: "/documents",
  l: "/volunteers",
  g: "/committees",
  q: "/forms",
  p: "/reports",
  a: "/analytics",
  f: "/assets",
  s: "/settings/template",
};

export function KeyboardShortcuts() {
  const router = useRouter();

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      // Don't trigger if user is typing in an input, textarea, or contenteditable
      const target = e.target as HTMLElement;
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.tagName === "SELECT" ||
        target.isContentEditable ||
        target.closest("dialog[open]") ||
        target.closest("[role='dialog']")
      ) {
        return;
      }

      // Don't trigger with modifier keys (except for Cmd+K which is handled by command palette)
      if (e.metaKey || e.ctrlKey || e.altKey) return;

      const key = e.key.toLowerCase();
      const href = SHORTCUTS[key];

      if (href) {
        e.preventDefault();
        router.push(href);
      }

      // "?" to show keyboard shortcuts help
      if (e.key === "?") {
        e.preventDefault();
        // Dispatch a custom event the command palette can listen for
        window.dispatchEvent(new CustomEvent("show-shortcuts-help"));
      }

      // "n" for quick create (go to add member)
      if (key === "n") {
        e.preventDefault();
        router.push("/members/new");
      }

      // "i" for import
      if (key === "i") {
        e.preventDefault();
        router.push("/members/import");
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [router]);

  return null;
}
