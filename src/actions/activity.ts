"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { tenantPrisma } from "@/lib/prisma-tenant";

async function getTenantPrisma() {
  const session = await auth();
  if (!session?.user?.organizationId) throw new Error("Not authenticated");
  return { db: tenantPrisma(prisma, session.user.organizationId), session };
}

export async function logActivity(opts: {
  type: string;
  description: string;
  memberId?: string;
  contactId?: string;
  metadata?: Record<string, unknown>;
}) {
  const { db, session } = await getTenantPrisma();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return db.activityLog.create({
    data: {
      type: opts.type,
      description: opts.description,
      memberId: opts.memberId || null,
      contactId: opts.contactId || null,
      userId: session.user?.id || null,
      metadata: opts.metadata ? JSON.parse(JSON.stringify(opts.metadata)) : undefined,
    } as any,
  });
}

export async function getRecentActivity(limit = 20) {
  const { db } = await getTenantPrisma();
  return db.activityLog.findMany({
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}

export async function getActivityForMember(memberId: string, limit = 50) {
  const { db } = await getTenantPrisma();
  return db.activityLog.findMany({
    where: { memberId },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}
