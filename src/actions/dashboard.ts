"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { tenantPrisma } from "@/lib/prisma-tenant";

export async function getDashboardStats() {
  const session = await auth();
  if (!session?.user?.organizationId) return null;
  const db = tenantPrisma(prisma, session.user.organizationId);

  const [
    totalMembers,
    activeMembers,
    lapsedMembers,
    totalContacts,
    revenueResult,
    tiersCount,
    hasDomain,
    hasCampaign,
  ] = await Promise.all([
    db.member.count({}),
    db.member.count({ where: { status: "ACTIVE" } }),
    db.member.count({ where: { status: "LAPSED" } }),
    db.contact.count({}),
    db.payment.aggregate({ _sum: { amount: true }, where: { status: "COMPLETED" } }),
    db.membershipTier.count({}),
    prisma.organization.findUnique({
      where: { id: session.user.organizationId },
      select: { customDomain: true, domainVerified: true, stripeConnectOnboarded: true },
    }),
    db.emailCampaign.count({ where: { status: "SENT" } }),
  ]);

  const revenueYTD = revenueResult._sum.amount || 0;

  // Getting Started completion
  const steps = {
    tiers: tiersCount > 0,
    members: totalMembers > 0,
    stripe: hasDomain?.stripeConnectOnboarded ?? false,
    email: hasCampaign > 0,
    domain: !!(hasDomain?.customDomain && hasDomain?.domainVerified),
  };
  const completedSteps = Object.values(steps).filter(Boolean).length;

  return {
    totalMembers,
    activeMembers,
    lapsedMembers,
    totalContacts,
    revenueYTD,
    steps,
    completedSteps,
  };
}
