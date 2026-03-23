import type { Metadata } from "next";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { DomainSetup } from "./domain-setup";

const CNAME_TARGET = "proxy.memberwise.com";

export const metadata: Metadata = { title: "Domain" };

export default async function DomainSettingsPage() {
  const session = await auth();
  if (!session?.user?.organizationId) redirect("/login");

  const org = await prisma.organization.findUnique({
    where: { id: session.user.organizationId },
    select: {
      customDomain: true,
      domainVerified: true,
    },
  });
  if (!org) return null;

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Domain Settings</h1>
        <p className="text-[var(--muted-foreground)]">
          Configure your custom domain to point to MemberWise
        </p>
      </div>

      <DomainSetup
        customDomain={org.customDomain}
        domainVerified={org.domainVerified}
        cnameTarget={CNAME_TARGET}
      />
    </div>
  );
}
