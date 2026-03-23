"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { tenantPrisma } from "@/lib/prisma-tenant";
import { revalidatePath } from "next/cache";
import { logActivity } from "./activity";

async function getTenantPrisma() {
  const session = await auth();
  if (!session?.user?.organizationId) throw new Error("Not authenticated");
  return { db: tenantPrisma(prisma, session.user.organizationId), orgId: session.user.organizationId, session };
}

// ─── Donation Campaigns ──────────────────────────────

export async function getDonationCampaigns() {
  const { db } = await getTenantPrisma();
  return db.donationCampaign.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { donations: true } },
    },
  });
}

export async function getDonationCampaign(id: string) {
  const { db } = await getTenantPrisma();
  return db.donationCampaign.findUnique({
    where: { id },
    include: {
      donations: {
        orderBy: { createdAt: "desc" },
        take: 50,
        include: { member: { select: { id: true, displayName: true } } },
      },
      _count: { select: { donations: true } },
    },
  });
}

export async function createDonationCampaign(data: {
  name: string;
  description?: string;
  goalAmount?: number;
  startDate?: string;
  endDate?: string;
  coverImage?: string;
}) {
  const { db } = await getTenantPrisma();

  const campaign = await db.donationCampaign.create({
    data: {
      name: data.name,
      description: data.description || null,
      goalAmount: data.goalAmount || null,
      startDate: data.startDate ? new Date(data.startDate) : null,
      endDate: data.endDate ? new Date(data.endDate) : null,
      coverImage: data.coverImage || null,
    } as any,
  });

  await logActivity({
    type: "donation_campaign_created",
    description: `Created donation campaign "${campaign.name}"`,
    metadata: { campaignId: campaign.id },
  });

  revalidatePath("/donations");
  return campaign;
}

export async function updateDonationCampaign(id: string, data: {
  name?: string;
  description?: string;
  goalAmount?: number | null;
  isActive?: boolean;
  startDate?: string | null;
  endDate?: string | null;
  coverImage?: string | null;
}) {
  const { db } = await getTenantPrisma();

  const campaign = await db.donationCampaign.update({
    where: { id },
    data: {
      ...(data.name !== undefined && { name: data.name }),
      ...(data.description !== undefined && { description: data.description || null }),
      ...(data.goalAmount !== undefined && { goalAmount: data.goalAmount }),
      ...(data.isActive !== undefined && { isActive: data.isActive }),
      ...(data.startDate !== undefined && { startDate: data.startDate ? new Date(data.startDate) : null }),
      ...(data.endDate !== undefined && { endDate: data.endDate ? new Date(data.endDate) : null }),
      ...(data.coverImage !== undefined && { coverImage: data.coverImage }),
    },
  });

  revalidatePath("/donations");
  return campaign;
}

export async function deleteDonationCampaign(id: string) {
  const { db } = await getTenantPrisma();
  await db.donationCampaign.delete({ where: { id } });
  revalidatePath("/donations");
  return { success: true };
}

// ─── Donations ───────────────────────────────────────

export async function getDonations({
  campaignId,
  search,
  page = 1,
  pageSize = 25,
}: {
  campaignId?: string;
  search?: string;
  page?: number;
  pageSize?: number;
} = {}) {
  const { db } = await getTenantPrisma();
  pageSize = Math.min(pageSize, 100);

  const where: Record<string, unknown> = { status: "COMPLETED" };
  if (campaignId) where.campaignId = campaignId;
  if (search) {
    where.OR = [
      { donorName: { contains: search, mode: "insensitive" } },
      { donorEmail: { contains: search, mode: "insensitive" } },
    ];
  }

  const [donations, total] = await Promise.all([
    db.donation.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        member: { select: { id: true, displayName: true } },
        campaign: { select: { id: true, name: true } },
      },
    }),
    db.donation.count({ where }),
  ]);

  return { donations, total, pages: Math.ceil(total / pageSize) };
}

export async function recordDonation(data: {
  amount: number;
  donorName?: string;
  donorEmail?: string;
  isAnonymous?: boolean;
  message?: string;
  memberId?: string;
  campaignId?: string;
  type?: "ONE_TIME" | "RECURRING";
  method?: string;
}) {
  const { db } = await getTenantPrisma();

  const donation = await db.donation.create({
    data: {
      amount: data.amount,
      status: "COMPLETED",
      type: data.type || "ONE_TIME",
      donorName: data.donorName || null,
      donorEmail: data.donorEmail || null,
      isAnonymous: data.isAnonymous ?? false,
      message: data.message || null,
      memberId: data.memberId || null,
      campaignId: data.campaignId || null,
      paidAt: new Date(),
    } as any,
  });

  // Update campaign raised amount if linked
  if (data.campaignId) {
    await db.donationCampaign.update({
      where: { id: data.campaignId },
      data: { raisedAmount: { increment: data.amount } },
    });
  }

  await logActivity({
    type: "donation_received",
    description: `Donation of $${(data.amount / 100).toFixed(2)} received${data.donorName ? ` from ${data.donorName}` : ""}`,
    memberId: data.memberId || undefined,
    metadata: { donationId: donation.id, amount: data.amount },
  });

  revalidatePath("/donations");
  return donation;
}

// ─── Stats ───────────────────────────────────────────

export async function getDonationStats() {
  const { db } = await getTenantPrisma();
  const now = new Date();
  const yearStart = new Date(now.getFullYear(), 0, 1);
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const [totalRaised, ytdRaised, thisMonth, donorCount, activeCampaigns] = await Promise.all([
    db.donation.aggregate({ _sum: { amount: true }, where: { status: "COMPLETED" } }),
    db.donation.aggregate({ _sum: { amount: true }, where: { status: "COMPLETED", paidAt: { gte: yearStart } } }),
    db.donation.aggregate({ _sum: { amount: true }, where: { status: "COMPLETED", paidAt: { gte: monthStart } } }),
    db.donation.findMany({
      where: { status: "COMPLETED", donorEmail: { not: null } },
      select: { donorEmail: true },
      distinct: ["donorEmail"],
    }),
    db.donationCampaign.count({ where: { isActive: true } }),
  ]);

  return {
    totalRaised: totalRaised._sum.amount || 0,
    ytdRaised: ytdRaised._sum.amount || 0,
    thisMonth: thisMonth._sum.amount || 0,
    uniqueDonors: donorCount.length,
    activeCampaigns,
  };
}
