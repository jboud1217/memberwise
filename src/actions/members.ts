"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { tenantPrisma } from "@/lib/prisma-tenant";
import { memberSchema, type MemberInput } from "@/lib/validators/member";
import { revalidatePath } from "next/cache";

async function getTenantPrisma() {
  const session = await auth();
  if (!session?.user?.organizationId) throw new Error("Not authenticated");
  return { db: tenantPrisma(prisma, session.user.organizationId), session };
}

export async function getMembers({
  search,
  status,
  tierId,
  page = 1,
  pageSize = 20,
}: {
  search?: string;
  status?: string;
  tierId?: string;
  page?: number;
  pageSize?: number;
}) {
  const { db } = await getTenantPrisma();

  const where: Record<string, unknown> = {};
  if (search) {
    where.OR = [
      { displayName: { contains: search, mode: "insensitive" } },
      { organizationName: { contains: search, mode: "insensitive" } },
      { memberNumber: { contains: search, mode: "insensitive" } },
    ];
  }
  if (status) where.status = status;
  if (tierId) where.tierId = tierId;

  const [members, total] = await Promise.all([
    db.member.findMany({
      where,
      include: { tier: true, contacts: true },
      orderBy: { displayName: "asc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    db.member.count({ where }),
  ]);

  return {
    members,
    total,
    totalPages: Math.ceil(total / pageSize),
    page,
  };
}

export async function getMember(id: string) {
  const { db } = await getTenantPrisma();
  return db.member.findUnique({
    where: { id },
    include: { tier: true, contacts: true, payments: true },
  });
}

export async function createMember(data: MemberInput) {
  const { db } = await getTenantPrisma();

  const validated = memberSchema.safeParse(data);
  if (!validated.success) {
    return { error: validated.error.issues[0].message };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const member = await db.member.create({
    data: {
      ...validated.data,
      joinDate: validated.data.joinDate ? new Date(validated.data.joinDate) : null,
      renewalDate: validated.data.renewalDate ? new Date(validated.data.renewalDate) : null,
      expirationDate: validated.data.expirationDate ? new Date(validated.data.expirationDate) : null,
    } as any,
  });

  revalidatePath("/members");
  return { success: true, member };
}

export async function updateMember(id: string, data: MemberInput) {
  const { db } = await getTenantPrisma();

  const validated = memberSchema.safeParse(data);
  if (!validated.success) {
    return { error: validated.error.issues[0].message };
  }

  const member = await db.member.update({
    where: { id },
    data: {
      ...validated.data,
      joinDate: validated.data.joinDate ? new Date(validated.data.joinDate) : null,
      renewalDate: validated.data.renewalDate ? new Date(validated.data.renewalDate) : null,
      expirationDate: validated.data.expirationDate ? new Date(validated.data.expirationDate) : null,
    } as any,
  });

  revalidatePath("/members");
  revalidatePath(`/members/${id}`);
  return { success: true, member };
}

export async function deleteMember(id: string) {
  const { db } = await getTenantPrisma();
  await db.member.delete({ where: { id } });
  revalidatePath("/members");
  return { success: true };
}

export async function bulkUpdateMembers(ids: string[], data: { status?: string; tierId?: string }) {
  const { db } = await getTenantPrisma();

  await Promise.all(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ids.map((id) => db.member.update({ where: { id }, data: data as any }))
  );

  revalidatePath("/members");
  return { success: true };
}

export async function bulkDeleteMembers(ids: string[]) {
  const { db } = await getTenantPrisma();

  await Promise.all(
    ids.map((id) => db.member.delete({ where: { id } }))
  );

  revalidatePath("/members");
  return { success: true };
}
