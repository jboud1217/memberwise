import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { ThemePicker } from "./theme-picker";

export default async function ThemeSettingsPage() {
  const session = await auth();
  if (!session?.user?.organizationId) return null;

  const org = await prisma.organization.findUnique({
    where: { id: session.user.organizationId },
    select: { theme: true },
  });

  return (
    <div>
      <div className="mb-8">
        <Link
          href="/settings"
          className="mb-2 inline-flex items-center text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
        >
          <ArrowLeft className="mr-1 h-4 w-4" />
          Back to Settings
        </Link>
        <h1 className="text-2xl font-bold">Portal Theme</h1>
        <p className="text-[var(--muted-foreground)]">
          Choose the visual theme for your member portal and public site.
        </p>
      </div>

      <ThemePicker currentTheme={org?.theme || "modern-minimal"} />
    </div>
  );
}
