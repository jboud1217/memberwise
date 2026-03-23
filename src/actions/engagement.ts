"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { tenantPrisma } from "@/lib/prisma-tenant";
import { revalidatePath } from "next/cache";

async function getTenantPrisma() {
  const session = await auth();
  if (!session?.user?.organizationId) throw new Error("Not authenticated");
  return { db: tenantPrisma(prisma, session.user.organizationId), orgId: session.user.organizationId };
}

// ─── Calculate Engagement Score ───────────────────────
// Scores members 0–100 based on activity signals

export async function calculateEngagementScores(): Promise<{ updated: number }> {
  const { db } = await getTenantPrisma();

  const members = await db.member.findMany({
    include: {
      payments: { orderBy: { createdAt: "desc" }, take: 5 },
      eventRegistrations: { orderBy: { createdAt: "desc" }, take: 10 },
      contacts: { select: { email: true } },
    },
  });

  let updated = 0;

  for (const member of members) {
    let score = 0;
    const now = new Date();

    // 1. Status (up to 20 pts)
    if (member.status === "ACTIVE") score += 20;
    else if (member.status === "PROSPECT") score += 5;

    // 2. Recency of membership (up to 15 pts)
    if (member.joinDate) {
      const daysSinceJoin = (now.getTime() - new Date(member.joinDate).getTime()) / (1000 * 60 * 60 * 24);
      if (daysSinceJoin < 90) score += 15;
      else if (daysSinceJoin < 365) score += 10;
      else score += 5; // Loyal long-term member
    }

    // 3. Payment history (up to 25 pts)
    const completedPayments = member.payments.filter((p) => p.status === "COMPLETED");
    if (completedPayments.length > 0) {
      score += Math.min(completedPayments.length * 5, 15);
      // Recent payment bonus
      const lastPayment = completedPayments[0];
      if (lastPayment) {
        const daysSincePayment = (now.getTime() - new Date(lastPayment.createdAt).getTime()) / (1000 * 60 * 60 * 24);
        if (daysSincePayment < 90) score += 10;
        else if (daysSincePayment < 180) score += 5;
      }
    }

    // 4. Event participation (up to 25 pts)
    const attendedEvents = member.eventRegistrations.filter(
      (r) => r.status === "CHECKED_IN" || r.status === "REGISTERED"
    );
    if (attendedEvents.length > 0) {
      score += Math.min(attendedEvents.length * 5, 15);
      // Recent event bonus
      const lastEvent = attendedEvents[0];
      if (lastEvent) {
        const daysSinceEvent = (now.getTime() - new Date(lastEvent.createdAt).getTime()) / (1000 * 60 * 60 * 24);
        if (daysSinceEvent < 60) score += 10;
        else if (daysSinceEvent < 180) score += 5;
      }
    }

    // 5. Has email (5 pts) — needed for communication
    const hasEmail = member.contacts.some((c) => c.email);
    if (hasEmail) score += 5;

    // 6. Renewal date proximity (up to 10 pts)
    if (member.renewalDate) {
      const daysUntilRenewal = (new Date(member.renewalDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
      if (daysUntilRenewal < 0) score -= 10; // Overdue = negative signal
      else if (daysUntilRenewal < 30) score += 5;
      else score += 10;
    }

    // Clamp to 0–100
    const finalScore = Math.max(0, Math.min(100, score));

    // Determine last engaged date
    const dates = [
      ...member.payments.map((p) => p.createdAt),
      ...member.eventRegistrations.map((r) => r.createdAt),
    ].sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

    const lastEngagedAt = dates[0] ? new Date(dates[0]) : null;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (db.member as any).update({
      where: { id: member.id },
      data: {
        engagementScore: finalScore,
        lastEngagedAt,
      },
    });
    updated++;
  }

  revalidatePath("/dashboard");
  revalidatePath("/members");
  return { updated };
}

// ─── Get Engagement Summary ───────────────────────────

export async function getEngagementSummary() {
  const { db } = await getTenantPrisma();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const members: any[] = await (db.member as any).findMany({
    select: {
      id: true,
      displayName: true,
      status: true,
      engagementScore: true,
      lastEngagedAt: true,
      renewalDate: true,
    },
    orderBy: { engagementScore: "desc" },
  });

  const total = members.length;
  if (total === 0) return { total: 0, avgScore: 0, distribution: { high: 0, medium: 0, low: 0, atRisk: 0 }, topMembers: [], atRiskMembers: [] };

  const avgScore = Math.round(members.reduce((sum: number, m: any) => sum + (m.engagementScore || 0), 0) / total); // eslint-disable-line @typescript-eslint/no-explicit-any

  const distribution = {
    high: members.filter((m: any) => (m.engagementScore || 0) >= 70).length, // eslint-disable-line @typescript-eslint/no-explicit-any
    medium: members.filter((m: any) => (m.engagementScore || 0) >= 40 && (m.engagementScore || 0) < 70).length, // eslint-disable-line @typescript-eslint/no-explicit-any
    low: members.filter((m: any) => (m.engagementScore || 0) >= 20 && (m.engagementScore || 0) < 40).length, // eslint-disable-line @typescript-eslint/no-explicit-any
    atRisk: members.filter((m: any) => (m.engagementScore || 0) < 20).length, // eslint-disable-line @typescript-eslint/no-explicit-any
  };

  return {
    total,
    avgScore,
    distribution,
    topMembers: members.slice(0, 5),
    atRiskMembers: members.filter((m: any) => (m.engagementScore || 0) < 20).slice(0, 10), // eslint-disable-line @typescript-eslint/no-explicit-any
  };
}
