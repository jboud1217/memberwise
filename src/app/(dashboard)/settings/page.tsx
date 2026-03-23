import type { Metadata } from "next";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { SettingsGrid } from "./settings-grid";

export const metadata: Metadata = { title: "Settings" };

export default async function SettingsPage() {
  const session = await auth();
  if (!session?.user?.organizationId) redirect("/login");

  const [org, customFieldCount] = await Promise.all([
    prisma.organization.findUnique({
      where: { id: session.user.organizationId },
    }),
    prisma.customField.count({
      where: { organizationId: session.user.organizationId },
    }),
  ]);
  if (!org) return null;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="mt-1 text-sm text-[var(--muted-foreground)]">
          Manage your organization settings and integrations
        </p>
      </div>

      <SettingsGrid
        orgName={org.name}
        stripeConnected={org.stripeConnectOnboarded}
        domainVerified={org.domainVerified}
        customDomain={org.customDomain}
        emailProvider={org.emailProvider}
        customFieldCount={customFieldCount}
        theme={org.theme}
        layoutTemplate={org.layoutTemplate}
      />
    </div>
  );
}
