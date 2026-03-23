import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = { title: "Theme" };

/**
 * Theme editing is now part of the unified Site Builder.
 * Redirect to the template/site builder page.
 */
export default function ThemeSettingsPage() {
  redirect("/settings/template");
}
