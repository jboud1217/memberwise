"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { tenantPrisma } from "@/lib/prisma-tenant";
import { revalidatePath } from "next/cache";
import { logActivity } from "./activity";

async function getTenantPrisma() {
  const session = await auth();
  if (!session?.user?.organizationId) throw new Error("Not authenticated");
  return { db: tenantPrisma(prisma, session.user.organizationId), session };
}

export async function recordPayment(data: {
  memberId: string;
  amount: number; // dollars
  method: "CHECK" | "CASH" | "STRIPE" | "OTHER";
  description?: string;
  paidAt?: string;
}) {
  const { db } = await getTenantPrisma();

  const member = await db.member.findUnique({ where: { id: data.memberId } });
  if (!member) return { error: "Member not found" };

  const amountCents = Math.round(data.amount * 100);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const payment = await db.payment.create({
    data: {
      memberId: data.memberId,
      amount: amountCents,
      method: data.method,
      status: "COMPLETED",
      description: data.description || null,
      paidAt: data.paidAt ? new Date(data.paidAt) : new Date(),
    } as any,
  });

  await logActivity({
    type: "payment_recorded",
    description: `Recorded $${data.amount.toFixed(2)} payment from ${member.displayName}`,
    memberId: data.memberId,
    metadata: { amount: amountCents, method: data.method },
  });

  revalidatePath("/billing");
  revalidatePath(`/members/${data.memberId}`);
  return { success: true, payment };
}

export async function getRevenueStats() {
  const { db } = await getTenantPrisma();

  const now = new Date();
  const startOfYear = new Date(now.getFullYear(), 0, 1);
  const startOfLastYear = new Date(now.getFullYear() - 1, 0, 1);
  const endOfLastYear = new Date(now.getFullYear() - 1, 11, 31);

  // Monthly revenue for current year
  const payments = await db.payment.findMany({
    where: { status: "COMPLETED", paidAt: { gte: startOfYear } },
    select: { amount: true, paidAt: true },
  });

  const monthlyRevenue: number[] = Array(12).fill(0);
  for (const p of payments) {
    if (p.paidAt) {
      const month = p.paidAt.getMonth();
      monthlyRevenue[month] += p.amount;
    }
  }

  const totalYTD = monthlyRevenue.reduce((a, b) => a + b, 0);

  // Last year total
  const lastYearResult = await db.payment.aggregate({
    _sum: { amount: true },
    where: { status: "COMPLETED", paidAt: { gte: startOfLastYear, lte: endOfLastYear } },
  });
  const totalLastYear = lastYearResult._sum.amount || 0;

  // By method
  const byMethod = await db.payment.groupBy({
    by: ["method"],
    _sum: { amount: true },
    _count: true,
    where: { status: "COMPLETED" },
  });

  return { monthlyRevenue, totalYTD, totalLastYear, byMethod };
}
