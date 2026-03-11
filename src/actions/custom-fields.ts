"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_|_$/g, "")
    .slice(0, 64);
}

export async function getCustomFields() {
  const session = await auth();
  if (!session?.user?.organizationId) throw new Error("Not authenticated");

  return prisma.customField.findMany({
    where: { organizationId: session.user.organizationId },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
  });
}

export async function createCustomField(data: {
  name: string;
  type: "TEXT" | "NUMBER" | "DATE" | "BOOLEAN" | "SELECT" | "MULTI_SELECT" | "URL" | "EMAIL" | "PHONE";
  entity: "MEMBER" | "CONTACT";
  description?: string;
  required?: boolean;
  options?: string[];
}) {
  const session = await auth();
  if (!session?.user?.organizationId) throw new Error("Not authenticated");
  const orgId = session.user.organizationId;

  // Generate unique key from name
  let key = slugify(data.name);
  if (!key) key = "field";

  // Check for key collision and append number if needed
  const existing = await prisma.customField.findUnique({
    where: { organizationId_key: { organizationId: orgId, key } },
  });
  if (existing) {
    const count = await prisma.customField.count({
      where: { organizationId: orgId, key: { startsWith: key } },
    });
    key = `${key}_${count + 1}`;
  }

  // Get next sort order
  const maxSort = await prisma.customField.aggregate({
    where: { organizationId: orgId },
    _max: { sortOrder: true },
  });

  const field = await prisma.customField.create({
    data: {
      organizationId: orgId,
      name: data.name,
      key,
      type: data.type,
      entity: data.entity,
      description: data.description || null,
      required: data.required || false,
      options: data.options || [],
      sortOrder: (maxSort._max.sortOrder ?? -1) + 1,
    },
  });

  revalidatePath("/settings/custom-fields");
  return field;
}

export async function updateCustomField(
  fieldId: string,
  data: {
    name?: string;
    description?: string;
    required?: boolean;
    options?: string[];
    isActive?: boolean;
  }
) {
  const session = await auth();
  if (!session?.user?.organizationId) throw new Error("Not authenticated");

  const field = await prisma.customField.findUnique({ where: { id: fieldId } });
  if (!field || field.organizationId !== session.user.organizationId) {
    throw new Error("Field not found");
  }

  const updated = await prisma.customField.update({
    where: { id: fieldId },
    data: {
      name: data.name ?? field.name,
      description: data.description !== undefined ? (data.description || null) : field.description,
      required: data.required ?? field.required,
      options: data.options ?? field.options,
      isActive: data.isActive ?? field.isActive,
    },
  });

  revalidatePath("/settings/custom-fields");
  return updated;
}

export async function deleteCustomField(fieldId: string) {
  const session = await auth();
  if (!session?.user?.organizationId) throw new Error("Not authenticated");

  const field = await prisma.customField.findUnique({ where: { id: fieldId } });
  if (!field || field.organizationId !== session.user.organizationId) {
    throw new Error("Field not found");
  }

  await prisma.customField.delete({ where: { id: fieldId } });

  revalidatePath("/settings/custom-fields");
}

export async function reorderCustomFields(fieldIds: string[]) {
  const session = await auth();
  if (!session?.user?.organizationId) throw new Error("Not authenticated");

  for (let i = 0; i < fieldIds.length; i++) {
    await prisma.customField.update({
      where: { id: fieldIds[i] },
      data: { sortOrder: i },
    });
  }

  revalidatePath("/settings/custom-fields");
}
