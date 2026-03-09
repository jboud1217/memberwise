"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { tenantPrisma } from "@/lib/prisma-tenant";
import { tierSchema, type TierInput } from "@/lib/validators/member";
import { revalidatePath } from "next/cache";

async function getTenantPrisma() {
  const session = await auth();
  if (!session?.user?.organizationId) throw new Error("Not authenticated");
  return { db: tenantPrisma(prisma, session.user.organizationId), session };
}

export async function getTiers() {
  const { db } = await getTenantPrisma();
  return db.membershipTier.findMany({
    orderBy: { sortOrder: "asc" },
    include: { _count: { select: { members: true } } },
  });
}

export async function createTier(data: TierInput) {
  const { db } = await getTenantPrisma();
  const validated = tierSchema.safeParse(data);
  if (!validated.success) return { error: validated.error.issues[0].message };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const tier = await db.membershipTier.create({
    data: {
      ...validated.data,
      price: Math.round(validated.data.price * 100),
    } as any,
  });

  revalidatePath("/tiers");
  return { success: true, tier };
}

export async function updateTier(id: string, data: TierInput) {
  const { db } = await getTenantPrisma();
  const validated = tierSchema.safeParse(data);
  if (!validated.success) return { error: validated.error.issues[0].message };

  const tier = await db.membershipTier.update({
    where: { id },
    data: {
      ...validated.data,
      price: Math.round(validated.data.price * 100),
    },
  });

  revalidatePath("/tiers");
  return { success: true, tier };
}

export async function deleteTier(id: string) {
  const { db } = await getTenantPrisma();
  await db.membershipTier.delete({ where: { id } });
  revalidatePath("/tiers");
  return { success: true };
}
