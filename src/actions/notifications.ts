"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { tenantPrisma } from "@/lib/prisma-tenant";

async function getTenantPrisma() {
  const session = await auth();
  if (!session?.user?.organizationId) throw new Error("Not authenticated");
  return { db: tenantPrisma(prisma, session.user.organizationId), userId: session.user.id };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function notifModel(db: any) { return db.notification; }

export async function getNotifications(limit = 20) {
  const { db, userId } = await getTenantPrisma();
  return notifModel(db).findMany({
    where: {
      OR: [{ userId }, { userId: null }], // user-specific + broadcast
    },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}

export async function getUnreadCount(): Promise<number> {
  const { db, userId } = await getTenantPrisma();
  return notifModel(db).count({
    where: {
      read: false,
      OR: [{ userId }, { userId: null }],
    },
  });
}

export async function markAsRead(notificationId: string) {
  const { db } = await getTenantPrisma();
  await notifModel(db).update({
    where: { id: notificationId },
    data: { read: true },
  });
}

export async function markAllAsRead() {
  const { db, userId } = await getTenantPrisma();
  await notifModel(db).updateMany({
    where: {
      read: false,
      OR: [{ userId }, { userId: null }],
    },
    data: { read: true },
  });
}

export async function deleteNotification(notificationId: string) {
  const { db } = await getTenantPrisma();
  await notifModel(db).delete({ where: { id: notificationId } });
}

// ─── Create Notification (used by other actions) ──────

export async function createNotification(data: {
  type: string;
  title: string;
  message: string;
  link?: string;
  userId?: string; // null = broadcast to all org admins
  metadata?: Record<string, unknown>;
}) {
  const session = await auth();
  if (!session?.user?.organizationId) return;

  const db = tenantPrisma(prisma, session.user.organizationId);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await notifModel(db).create({
    data: {
      type: data.type,
      title: data.title,
      message: data.message,
      link: data.link,
      userId: data.userId,
      metadata: data.metadata as any,
    } as any,
  });
}
