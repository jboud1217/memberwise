"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { tenantPrisma } from "@/lib/prisma-tenant";

async function getTenantPrisma() {
  const session = await auth();
  if (!session?.user?.organizationId) throw new Error("Not authenticated");
  return { db: tenantPrisma(prisma, session.user.organizationId), orgId: session.user.organizationId };
}

// ─── Member Reports ──────────────────────────────────

export async function getMembershipReport() {
  const { db, orgId } = await getTenantPrisma();

  const [byStatus, byTier, joinTrend, renewalsDue, expiringMembers] = await Promise.all([
    // Members by status
    db.member.groupBy({
      by: ["status"],
      _count: true,
    }),
    // Members by tier
    db.member.groupBy({
      by: ["tierId"],
      _count: true,
      where: { tierId: { not: null } },
    }),
    // Join trend (last 12 months)
    prisma.$queryRaw<{ month: string; count: bigint }[]>`
      SELECT to_char("joinDate", 'YYYY-MM') as month, COUNT(*) as count
      FROM "Member"
      WHERE "joinDate" IS NOT NULL
        AND "joinDate" >= NOW() - INTERVAL '12 months'
        AND "organizationId" = ${orgId}
      GROUP BY to_char("joinDate", 'YYYY-MM')
      ORDER BY month ASC
    `.catch(() => []),
    // Renewals due in next 30 days
    db.member.count({
      where: {
        renewalDate: {
          gte: new Date(),
          lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        },
        status: "ACTIVE",
      },
    }),
    // Expired/expiring members
    db.member.count({
      where: {
        expirationDate: { lte: new Date() },
        status: "ACTIVE",
      },
    }),
  ]);

  // Fetch tier names
  const tierIds = byTier.map((t) => t.tierId).filter(Boolean) as string[];
  const tiers = tierIds.length > 0
    ? await db.membershipTier.findMany({
        where: { id: { in: tierIds } },
        select: { id: true, name: true },
      })
    : [];
  const tierMap = new Map(tiers.map((t) => [t.id, t.name]));

  return {
    byStatus: byStatus.map((s) => ({ status: s.status, count: s._count })),
    byTier: byTier.map((t) => ({
      tierId: t.tierId,
      tierName: tierMap.get(t.tierId!) || "Unknown",
      count: t._count,
    })),
    joinTrend: joinTrend.map((j) => ({ month: j.month, count: Number(j.count) })),
    renewalsDue,
    expiringMembers,
  };
}

// ─── Revenue Reports ─────────────────────────────────

export async function getRevenueReport() {
  const { db, orgId } = await getTenantPrisma();
  const now = new Date();
  const yearStart = new Date(now.getFullYear(), 0, 1);

  const [totalRevenue, ytdRevenue, byMethod, monthlyRevenue, recentPayments] = await Promise.all([
    db.payment.aggregate({
      _sum: { amount: true },
      where: { status: "COMPLETED" },
    }),
    db.payment.aggregate({
      _sum: { amount: true },
      where: { status: "COMPLETED", paidAt: { gte: yearStart } },
    }),
    db.payment.groupBy({
      by: ["method"],
      _sum: { amount: true },
      _count: true,
      where: { status: "COMPLETED" },
    }),
    // Monthly revenue for current year
    prisma.$queryRaw<{ month: string; total: bigint }[]>`
      SELECT to_char("paidAt", 'YYYY-MM') as month, SUM(amount) as total
      FROM "Payment"
      WHERE status = 'COMPLETED'
        AND "paidAt" >= ${yearStart}
        AND "organizationId" = ${orgId}
      GROUP BY to_char("paidAt", 'YYYY-MM')
      ORDER BY month ASC
    `.catch(() => []),
    // Recent payments
    db.payment.findMany({
      where: { status: "COMPLETED" },
      orderBy: { paidAt: "desc" },
      take: 10,
      include: { member: { select: { id: true, displayName: true } } },
    }),
  ]);

  return {
    totalRevenue: totalRevenue._sum.amount || 0,
    ytdRevenue: ytdRevenue._sum.amount || 0,
    byMethod: byMethod.map((m) => ({
      method: m.method,
      total: m._sum.amount || 0,
      count: m._count,
    })),
    monthlyRevenue: monthlyRevenue.map((m) => ({ month: m.month, total: Number(m.total) })),
    recentPayments,
  };
}

// ─── Engagement Report ───────────────────────────────

export async function getEngagementReport() {
  const { db } = await getTenantPrisma();

  const [scoreDistribution, topEngaged, disengaged, recentActivity] = await Promise.all([
    // Score distribution buckets
    Promise.all([
      db.member.count({ where: { engagementScore: { gte: 80 } } }),
      db.member.count({ where: { engagementScore: { gte: 50, lt: 80 } } }),
      db.member.count({ where: { engagementScore: { gte: 20, lt: 50 } } }),
      db.member.count({ where: { engagementScore: { lt: 20 } } }),
    ]),
    // Top engaged members
    db.member.findMany({
      where: { status: "ACTIVE" },
      orderBy: { engagementScore: "desc" },
      take: 10,
      select: { id: true, displayName: true, engagementScore: true, lastEngagedAt: true },
    }),
    // Disengaged members (active but low score)
    db.member.count({
      where: { status: "ACTIVE", engagementScore: { lt: 20 } },
    }),
    // Activity count last 30 days
    db.activityLog.count({
      where: { createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } },
    }),
  ]);

  return {
    scoreDistribution: {
      high: scoreDistribution[0],
      medium: scoreDistribution[1],
      low: scoreDistribution[2],
      inactive: scoreDistribution[3],
    },
    topEngaged,
    disengagedCount: disengaged,
    recentActivityCount: recentActivity,
  };
}

// ─── Export Data ──────────────────────────────────────

export async function exportMembersCSV() {
  const { db } = await getTenantPrisma();

  const members = await db.member.findMany({
    include: {
      tier: { select: { name: true } },
      contacts: {
        where: { isPrimary: true },
        take: 1,
        select: { firstName: true, lastName: true, email: true, phone: true },
      },
    },
    orderBy: { displayName: "asc" },
  });

  // Build CSV
  const headers = [
    "Member Number", "Display Name", "Status", "Tier",
    "First Name", "Last Name", "Email", "Phone",
    "Address", "City", "State", "ZIP",
    "Join Date", "Renewal Date", "Engagement Score",
  ];

  const rows = members.map((m) => {
    const primary = m.contacts[0];
    return [
      m.memberNumber || "",
      m.displayName,
      m.status,
      m.tier?.name || "",
      primary?.firstName || "",
      primary?.lastName || "",
      primary?.email || "",
      primary?.phone || "",
      m.address1 || "",
      m.city || "",
      m.state || "",
      m.zip || "",
      m.joinDate ? m.joinDate.toISOString().split("T")[0] : "",
      m.renewalDate ? m.renewalDate.toISOString().split("T")[0] : "",
      String(m.engagementScore),
    ];
  });

  const csvContent = [
    headers.join(","),
    ...rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")),
  ].join("\n");

  return csvContent;
}

export async function exportPaymentsCSV(opts?: { startDate?: string; endDate?: string }) {
  const { db } = await getTenantPrisma();

  const where: Record<string, unknown> = { status: "COMPLETED" };
  if (opts?.startDate || opts?.endDate) {
    where.paidAt = {
      ...(opts?.startDate && { gte: new Date(opts.startDate) }),
      ...(opts?.endDate && { lte: new Date(opts.endDate) }),
    };
  }

  const payments = await db.payment.findMany({
    where,
    orderBy: { paidAt: "desc" },
    include: { member: { select: { displayName: true, memberNumber: true } } },
  });

  const headers = ["Date", "Member", "Member Number", "Amount", "Method", "Description", "Status"];
  const rows = payments.map((p) => [
    p.paidAt ? p.paidAt.toISOString().split("T")[0] : "",
    p.member.displayName,
    p.member.memberNumber || "",
    (p.amount / 100).toFixed(2),
    p.method,
    p.description || "",
    p.status,
  ]);

  const csvContent = [
    headers.join(","),
    ...rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")),
  ].join("\n");

  return csvContent;
}

export async function exportDonationsCSV() {
  const { db } = await getTenantPrisma();

  const donations = await db.donation.findMany({
    where: { status: "COMPLETED" },
    orderBy: { paidAt: "desc" },
    include: {
      member: { select: { displayName: true } },
      campaign: { select: { name: true } },
    },
  });

  const headers = ["Date", "Donor Name", "Email", "Amount", "Type", "Campaign", "Anonymous", "Message"];
  const rows = donations.map((d) => [
    d.paidAt ? d.paidAt.toISOString().split("T")[0] : "",
    d.donorName || d.member?.displayName || "",
    d.donorEmail || "",
    (d.amount / 100).toFixed(2),
    d.type,
    d.campaign?.name || "",
    d.isAnonymous ? "Yes" : "No",
    d.message || "",
  ]);

  const csvContent = [
    headers.join(","),
    ...rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")),
  ].join("\n");

  return csvContent;
}
