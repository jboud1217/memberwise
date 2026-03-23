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

// ─── Opportunities ───────────────────────────────────

export async function getVolunteerOpportunities({
  active,
  page = 1,
  pageSize = 20,
}: {
  active?: boolean;
  page?: number;
  pageSize?: number;
} = {}) {
  const { db } = await getTenantPrisma();
  pageSize = Math.min(pageSize, 100);

  const where: Record<string, unknown> = {};
  if (active !== undefined) where.isActive = active;

  const [opportunities, total] = await Promise.all([
    db.volunteerOpportunity.findMany({
      where,
      orderBy: { date: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: { _count: { select: { logs: true } } },
    }),
    db.volunteerOpportunity.count({ where }),
  ]);

  return { opportunities, total, pages: Math.ceil(total / pageSize) };
}

export async function createVolunteerOpportunity(data: {
  title: string;
  description?: string;
  location?: string;
  date?: string;
  startTime?: string;
  endTime?: string;
  spotsAvailable?: number;
  skills?: string[];
}) {
  const { db } = await getTenantPrisma();

  const opportunity = await db.volunteerOpportunity.create({
    data: {
      title: data.title,
      description: data.description || null,
      location: data.location || null,
      date: data.date ? new Date(data.date) : null,
      startTime: data.startTime ? new Date(data.startTime) : null,
      endTime: data.endTime ? new Date(data.endTime) : null,
      spotsAvailable: data.spotsAvailable || null,
      skills: data.skills || [],
    } as any,
  });

  await logActivity({
    type: "volunteer_opportunity_created",
    description: `Created volunteer opportunity "${opportunity.title}"`,
    metadata: { opportunityId: opportunity.id },
  });

  revalidatePath("/volunteers");
  return opportunity;
}

export async function updateVolunteerOpportunity(id: string, data: {
  title?: string;
  description?: string;
  location?: string;
  date?: string | null;
  spotsAvailable?: number | null;
  skills?: string[];
  isActive?: boolean;
}) {
  const { db } = await getTenantPrisma();

  const opportunity = await db.volunteerOpportunity.update({
    where: { id },
    data: {
      ...(data.title !== undefined && { title: data.title }),
      ...(data.description !== undefined && { description: data.description || null }),
      ...(data.location !== undefined && { location: data.location || null }),
      ...(data.date !== undefined && { date: data.date ? new Date(data.date) : null }),
      ...(data.spotsAvailable !== undefined && { spotsAvailable: data.spotsAvailable }),
      ...(data.skills !== undefined && { skills: data.skills }),
      ...(data.isActive !== undefined && { isActive: data.isActive }),
    },
  });

  revalidatePath("/volunteers");
  return opportunity;
}

export async function deleteVolunteerOpportunity(id: string) {
  const { db } = await getTenantPrisma();
  await db.volunteerOpportunity.delete({ where: { id } });
  revalidatePath("/volunteers");
  return { success: true };
}

// ─── Volunteer Logs ──────────────────────────────────

export async function getVolunteerLogs({
  memberId,
  opportunityId,
  approved,
  page = 1,
  pageSize = 25,
}: {
  memberId?: string;
  opportunityId?: string;
  approved?: boolean;
  page?: number;
  pageSize?: number;
} = {}) {
  const { db } = await getTenantPrisma();
  pageSize = Math.min(pageSize, 100);

  const where: Record<string, unknown> = {};
  if (memberId) where.memberId = memberId;
  if (opportunityId) where.opportunityId = opportunityId;
  if (approved !== undefined) where.approved = approved;

  const [logs, total] = await Promise.all([
    db.volunteerLog.findMany({
      where,
      orderBy: { date: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        member: { select: { id: true, displayName: true } },
        opportunity: { select: { id: true, title: true } },
      },
    }),
    db.volunteerLog.count({ where }),
  ]);

  return { logs, total, pages: Math.ceil(total / pageSize) };
}

export async function logVolunteerHours(data: {
  memberId: string;
  hours: number;
  date: string;
  description?: string;
  opportunityId?: string;
}) {
  const { db, session } = await getTenantPrisma();

  const log = await db.volunteerLog.create({
    data: {
      memberId: data.memberId,
      hours: data.hours,
      date: new Date(data.date),
      description: data.description || null,
      opportunityId: data.opportunityId || null,
    } as any,
    include: { member: { select: { displayName: true } } },
  });

  await logActivity({
    type: "volunteer_hours_logged",
    description: `${log.member.displayName} logged ${data.hours}h volunteer time`,
    memberId: data.memberId,
    metadata: { logId: log.id, hours: data.hours },
  });

  revalidatePath("/volunteers");
  return log;
}

export async function approveVolunteerLog(id: string) {
  const { db, session } = await getTenantPrisma();

  const log = await db.volunteerLog.update({
    where: { id },
    data: { approved: true, approvedById: session.user?.id || null },
  });

  revalidatePath("/volunteers");
  return log;
}

export async function deleteVolunteerLog(id: string) {
  const { db } = await getTenantPrisma();
  await db.volunteerLog.delete({ where: { id } });
  revalidatePath("/volunteers");
  return { success: true };
}

// ─── Stats ───────────────────────────────────────────

export async function getVolunteerStats() {
  const { db } = await getTenantPrisma();
  const now = new Date();
  const yearStart = new Date(now.getFullYear(), 0, 1);

  const [totalHours, ytdHours, activeVolunteers, activeOpportunities, pendingApproval] = await Promise.all([
    db.volunteerLog.aggregate({ _sum: { hours: true }, where: { approved: true } }),
    db.volunteerLog.aggregate({ _sum: { hours: true }, where: { approved: true, date: { gte: yearStart } } }),
    db.volunteerLog.findMany({
      where: { date: { gte: yearStart } },
      select: { memberId: true },
      distinct: ["memberId"],
    }),
    db.volunteerOpportunity.count({ where: { isActive: true } }),
    db.volunteerLog.count({ where: { approved: false } }),
  ]);

  return {
    totalHours: totalHours._sum.hours || 0,
    ytdHours: ytdHours._sum.hours || 0,
    activeVolunteers: activeVolunteers.length,
    activeOpportunities,
    pendingApproval,
  };
}
