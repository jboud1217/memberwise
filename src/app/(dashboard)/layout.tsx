import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { DashboardShell } from "@/components/layout/dashboard-shell";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  let siteUrl = "/";

  if (session?.user?.organizationId) {
    const org = await prisma.organization.findUnique({
      where: { id: session.user.organizationId },
      select: { onboardingCompleted: true, slug: true, customDomain: true, domainVerified: true },
    });
    if (org && !org.onboardingCompleted) {
      redirect("/onboarding");
    }
    if (org) {
      if (org.customDomain && org.domainVerified) {
        siteUrl = `https://${org.customDomain}`;
      } else {
        const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
        siteUrl = `${appUrl}?site=${org.slug}`;
      }
    }
  }

  return (
    <div className="min-h-screen bg-[var(--background)]">
      {/* Subtle top gradient glow */}
      <div
        className="pointer-events-none fixed inset-x-0 top-0 z-0 h-[500px] opacity-50"
        style={{
          background:
            "radial-gradient(ellipse 80% 60% at 50% -20%, rgba(99,102,241,0.08) 0%, transparent 70%)",
        }}
      />
      <DashboardShell siteUrl={siteUrl}>{children}</DashboardShell>
    </div>
  );
}
