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

// ─── Forms ───────────────────────────────────────────

export async function getForms({
  status,
  formType,
  page = 1,
  pageSize = 20,
}: {
  status?: string;
  formType?: string;
  page?: number;
  pageSize?: number;
} = {}) {
  const { db } = await getTenantPrisma();
  pageSize = Math.min(pageSize, 100);

  const where: Record<string, unknown> = {};
  if (status) where.status = status;
  if (formType) where.formType = formType;

  const [forms, total] = await Promise.all([
    db.form.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: { _count: { select: { responses: true } } },
    }),
    db.form.count({ where }),
  ]);

  return { forms, total, pages: Math.ceil(total / pageSize) };
}

export async function getForm(id: string) {
  const { db } = await getTenantPrisma();
  return db.form.findUnique({
    where: { id },
    include: { _count: { select: { responses: true } } },
  });
}

function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
}

export async function createForm(data: {
  title: string;
  description?: string;
  formType?: string;
  fields: {
    id: string;
    label: string;
    type: "text" | "textarea" | "email" | "number" | "select" | "multi_select" | "checkbox" | "date" | "file";
    required?: boolean;
    options?: string[];
    placeholder?: string;
  }[];
  settings?: {
    confirmationMessage?: string;
    redirectUrl?: string;
    notifyEmail?: string;
    limitResponses?: boolean;
  };
  maxResponses?: number;
  closesAt?: string;
}) {
  const { db, orgId } = await getTenantPrisma();

  let slug = generateSlug(data.title);
  const existing = await db.form.findUnique({
    where: { organizationId_slug: { organizationId: orgId, slug } },
  });
  if (existing) slug = `${slug}-${Date.now().toString(36)}`;

  const form = await db.form.create({
    data: {
      title: data.title,
      description: data.description || null,
      slug,
      formType: data.formType || "general",
      fields: data.fields,
      settings: data.settings || null,
      maxResponses: data.maxResponses || null,
      closesAt: data.closesAt ? new Date(data.closesAt) : null,
    } as any,
  });

  await logActivity({
    type: "form_created",
    description: `Created form "${form.title}"`,
    metadata: { formId: form.id, formType: form.formType },
  });

  revalidatePath("/forms");
  return form;
}

export async function updateForm(id: string, data: {
  title?: string;
  description?: string;
  fields?: unknown[];
  settings?: Record<string, unknown>;
  status?: "DRAFT" | "PUBLISHED" | "CLOSED";
  maxResponses?: number | null;
  closesAt?: string | null;
}) {
  const { db } = await getTenantPrisma();

  const form = await db.form.update({
    where: { id },
    data: {
      ...(data.title !== undefined && { title: data.title }),
      ...(data.description !== undefined && { description: data.description || null }),
      ...(data.fields !== undefined && { fields: data.fields }),
      ...(data.settings !== undefined && { settings: data.settings }),
      ...(data.status !== undefined && { status: data.status }),
      ...(data.maxResponses !== undefined && { maxResponses: data.maxResponses }),
      ...(data.closesAt !== undefined && { closesAt: data.closesAt ? new Date(data.closesAt) : null }),
    },
  });

  revalidatePath("/forms");
  return form;
}

export async function publishForm(id: string) {
  return updateForm(id, { status: "PUBLISHED" });
}

export async function closeForm(id: string) {
  return updateForm(id, { status: "CLOSED" });
}

export async function deleteForm(id: string) {
  const { db } = await getTenantPrisma();
  const form = await db.form.delete({ where: { id } });

  await logActivity({
    type: "form_deleted",
    description: `Deleted form "${form.title}"`,
  });

  revalidatePath("/forms");
  return { success: true };
}

// ─── Form Responses ──────────────────────────────────

export async function getFormResponses(formId: string, {
  page = 1,
  pageSize = 25,
}: {
  page?: number;
  pageSize?: number;
} = {}) {
  const { db } = await getTenantPrisma();
  pageSize = Math.min(pageSize, 100);

  const [responses, total] = await Promise.all([
    db.formResponse.findMany({
      where: { formId },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        member: { select: { id: true, displayName: true } },
      },
    }),
    db.formResponse.count({ where: { formId } }),
  ]);

  return { responses, total, pages: Math.ceil(total / pageSize) };
}

export async function submitFormResponse(data: {
  formId: string;
  answers: Record<string, unknown>;
  respondentName?: string;
  respondentEmail?: string;
  memberId?: string;
}) {
  const { db, orgId } = await getTenantPrisma();

  // Check form is accepting responses
  const form = await db.form.findUnique({ where: { id: data.formId } });
  if (!form) throw new Error("Form not found");
  if (form.status !== "PUBLISHED") throw new Error("Form is not accepting responses");
  if (form.maxResponses && form.responseCount >= form.maxResponses) {
    throw new Error("Form has reached its response limit");
  }
  if (form.closesAt && new Date() > new Date(form.closesAt)) {
    throw new Error("Form submission deadline has passed");
  }

  const response = await prisma.$transaction(async (tx) => {
    const resp = await tx.formResponse.create({
      data: {
        formId: data.formId,
        answers: data.answers as unknown as import("@prisma/client").Prisma.InputJsonValue,
        respondentName: data.respondentName || null,
        respondentEmail: data.respondentEmail || null,
        memberId: data.memberId || null,
        organizationId: orgId,
      },
    });

    await tx.form.update({
      where: { id: data.formId },
      data: { responseCount: { increment: 1 } },
    });

    return resp;
  });

  revalidatePath("/forms");
  return response;
}

export async function deleteFormResponse(id: string) {
  const { db } = await getTenantPrisma();

  const response = await db.formResponse.delete({ where: { id } });

  // Decrement form response count
  await db.form.update({
    where: { id: response.formId },
    data: { responseCount: { decrement: 1 } },
  });

  revalidatePath("/forms");
  return { success: true };
}

// ─── Stats ───────────────────────────────────────────

export async function getFormStats() {
  const { db } = await getTenantPrisma();

  const [totalForms, publishedForms, totalResponses] = await Promise.all([
    db.form.count(),
    db.form.count({ where: { status: "PUBLISHED" } }),
    db.formResponse.count(),
  ]);

  return { totalForms, publishedForms, totalResponses };
}
