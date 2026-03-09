"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { tenantPrisma } from "@/lib/prisma-tenant";
import { contactSchema, type ContactInput } from "@/lib/validators/member";
import { revalidatePath } from "next/cache";

async function getTenantPrisma() {
  const session = await auth();
  if (!session?.user?.organizationId) throw new Error("Not authenticated");
  return { db: tenantPrisma(prisma, session.user.organizationId), session };
}

export async function getContacts({
  search,
  memberId,
  page = 1,
  pageSize = 20,
}: {
  search?: string;
  memberId?: string;
  page?: number;
  pageSize?: number;
}) {
  const { db } = await getTenantPrisma();

  const where: Record<string, unknown> = {};
  if (search) {
    where.OR = [
      { firstName: { contains: search, mode: "insensitive" } },
      { lastName: { contains: search, mode: "insensitive" } },
      { email: { contains: search, mode: "insensitive" } },
    ];
  }
  if (memberId) where.memberId = memberId;

  const [contacts, total] = await Promise.all([
    db.contact.findMany({
      where,
      include: { member: true },
      orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    db.contact.count({ where }),
  ]);

  return { contacts, total, totalPages: Math.ceil(total / pageSize), page };
}

export async function createContact(data: ContactInput) {
  const { db } = await getTenantPrisma();
  const validated = contactSchema.safeParse(data);
  if (!validated.success) return { error: validated.error.issues[0].message };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const contact = await db.contact.create({ data: validated.data as any });
  revalidatePath("/contacts");
  if (data.memberId) revalidatePath(`/members/${data.memberId}`);
  return { success: true, contact };
}

export async function updateContact(id: string, data: ContactInput) {
  const { db } = await getTenantPrisma();
  const validated = contactSchema.safeParse(data);
  if (!validated.success) return { error: validated.error.issues[0].message };

  const contact = await db.contact.update({ where: { id }, data: validated.data });
  revalidatePath("/contacts");
  return { success: true, contact };
}

export async function deleteContact(id: string) {
  const { db } = await getTenantPrisma();
  await db.contact.delete({ where: { id } });
  revalidatePath("/contacts");
  return { success: true };
}
