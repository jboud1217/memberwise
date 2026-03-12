"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { tenantPrisma } from "@/lib/prisma-tenant";
import { revalidatePath } from "next/cache";
import { randomBytes } from "crypto";
import { logActivity } from "./activity";

async function getTenantPrisma() {
  const session = await auth();
  if (!session?.user?.organizationId) throw new Error("Not authenticated");
  return { db: tenantPrisma(prisma, session.user.organizationId), session };
}

export async function inviteTeamMember(data: { email: string; role: "ADMIN" | "STAFF" }) {
  const { db, session } = await getTenantPrisma();

  // Check if user already exists in this org
  const existing = await db.user.findFirst({ where: { email: data.email } });
  if (existing) return { error: "A user with this email already exists in your organization" };

  // Check for pending invite
  const existingInvite = await db.teamInvite.findFirst({
    where: { email: data.email, expiresAt: { gt: new Date() } },
  });
  if (existingInvite) return { error: "An invite has already been sent to this email" };

  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await db.teamInvite.create({
    data: {
      email: data.email,
      role: data.role,
      token,
      expiresAt,
    } as any,
  });

  await logActivity({
    type: "team_invite_sent",
    description: `Invited ${data.email} as ${data.role}`,
    metadata: { email: data.email, role: data.role },
  });

  // In production, send an invite email here
  revalidatePath("/settings/team");
  return { success: true, token };
}

export async function getPendingInvites() {
  const { db } = await getTenantPrisma();
  return db.teamInvite.findMany({
    where: { expiresAt: { gt: new Date() } },
    orderBy: { createdAt: "desc" },
  });
}

export async function cancelInvite(inviteId: string) {
  const { db } = await getTenantPrisma();
  await db.teamInvite.delete({ where: { id: inviteId } });
  revalidatePath("/settings/team");
  return { success: true };
}

export async function removeTeamMember(userId: string) {
  const { db, session } = await getTenantPrisma();

  // Prevent removing yourself
  if (userId === session.user?.id) return { error: "You cannot remove yourself" };

  const user = await db.user.findUnique({ where: { id: userId } });
  if (!user) return { error: "User not found" };
  if (user.role === "OWNER") return { error: "Cannot remove the organization owner" };

  await db.user.delete({ where: { id: userId } });

  await logActivity({
    type: "team_member_removed",
    description: `Removed team member ${user.name || user.email}`,
  });

  revalidatePath("/settings/team");
  return { success: true };
}
