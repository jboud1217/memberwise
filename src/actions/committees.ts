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

// ─── Committees ──────────────────────────────────────

export async function getCommittees() {
  const { db } = await getTenantPrisma();
  return db.committee.findMany({
    orderBy: { name: "asc" },
    include: {
      _count: { select: { members: true } },
    },
  });
}

export async function getCommittee(id: string) {
  const { db } = await getTenantPrisma();
  return db.committee.findUnique({
    where: { id },
    include: {
      members: {
        include: {
          member: { select: { id: true, displayName: true, status: true } },
          contact: { select: { id: true, firstName: true, lastName: true, email: true } },
        },
        orderBy: { role: "asc" },
      },
    },
  });
}

export async function createCommittee(data: {
  name: string;
  description?: string;
  purpose?: string;
  meetingSchedule?: string;
  meetingLocation?: string;
  meetingUrl?: string;
}) {
  const { db } = await getTenantPrisma();

  const committee = await db.committee.create({
    data: {
      name: data.name,
      description: data.description || null,
      purpose: data.purpose || null,
      meetingSchedule: data.meetingSchedule || null,
      meetingLocation: data.meetingLocation || null,
      meetingUrl: data.meetingUrl || null,
    } as any,
  });

  await logActivity({
    type: "committee_created",
    description: `Created committee "${committee.name}"`,
    metadata: { committeeId: committee.id },
  });

  revalidatePath("/committees");
  return committee;
}

export async function updateCommittee(id: string, data: {
  name?: string;
  description?: string;
  purpose?: string;
  meetingSchedule?: string;
  meetingLocation?: string;
  meetingUrl?: string;
  isActive?: boolean;
}) {
  const { db } = await getTenantPrisma();

  const committee = await db.committee.update({
    where: { id },
    data: {
      ...(data.name !== undefined && { name: data.name }),
      ...(data.description !== undefined && { description: data.description || null }),
      ...(data.purpose !== undefined && { purpose: data.purpose || null }),
      ...(data.meetingSchedule !== undefined && { meetingSchedule: data.meetingSchedule || null }),
      ...(data.meetingLocation !== undefined && { meetingLocation: data.meetingLocation || null }),
      ...(data.meetingUrl !== undefined && { meetingUrl: data.meetingUrl || null }),
      ...(data.isActive !== undefined && { isActive: data.isActive }),
    },
  });

  revalidatePath("/committees");
  return committee;
}

export async function deleteCommittee(id: string) {
  const { db } = await getTenantPrisma();
  const committee = await db.committee.delete({ where: { id } });

  await logActivity({
    type: "committee_deleted",
    description: `Deleted committee "${committee.name}"`,
  });

  revalidatePath("/committees");
  return { success: true };
}

// ─── Committee Members ───────────────────────────────

export async function addCommitteeMember(data: {
  committeeId: string;
  memberId: string;
  contactId?: string;
  role?: "CHAIR" | "VICE_CHAIR" | "SECRETARY" | "TREASURER" | "MEMBER";
  startDate?: string;
}) {
  const { db, orgId } = await getTenantPrisma();

  const cm = await db.committeeMember.create({
    data: {
      committeeId: data.committeeId,
      memberId: data.memberId,
      contactId: data.contactId || null,
      role: data.role || "MEMBER",
      startDate: data.startDate ? new Date(data.startDate) : new Date(),
      organizationId: orgId,
    } as any,
    include: {
      member: { select: { displayName: true } },
      committee: { select: { name: true } },
    },
  });

  await logActivity({
    type: "committee_member_added",
    description: `Added ${cm.member.displayName} to ${cm.committee.name} as ${data.role || "MEMBER"}`,
    memberId: data.memberId,
    metadata: { committeeId: data.committeeId },
  });

  revalidatePath("/committees");
  return cm;
}

export async function updateCommitteeMemberRole(id: string, role: "CHAIR" | "VICE_CHAIR" | "SECRETARY" | "TREASURER" | "MEMBER") {
  const { db } = await getTenantPrisma();

  const cm = await db.committeeMember.update({
    where: { id },
    data: { role },
  });

  revalidatePath("/committees");
  return cm;
}

export async function removeCommitteeMember(id: string) {
  const { db } = await getTenantPrisma();

  // Set end date instead of hard delete for historical tracking
  const cm = await db.committeeMember.update({
    where: { id },
    data: { endDate: new Date() },
    include: {
      member: { select: { displayName: true } },
      committee: { select: { name: true } },
    },
  });

  await logActivity({
    type: "committee_member_removed",
    description: `Removed ${cm.member.displayName} from ${cm.committee.name}`,
    memberId: cm.memberId,
    metadata: { committeeId: cm.committeeId },
  });

  revalidatePath("/committees");
  return cm;
}

// ─── Stats ───────────────────────────────────────────

export async function getCommitteeStats() {
  const { db } = await getTenantPrisma();

  const [totalCommittees, activeCommittees, totalMembers] = await Promise.all([
    db.committee.count(),
    db.committee.count({ where: { isActive: true } }),
    db.committeeMember.count({ where: { endDate: null } }),
  ]);

  return { totalCommittees, activeCommittees, totalMembers };
}
