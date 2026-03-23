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

// ─── Folders ─────────────────────────────────────────

export async function getDocumentFolders() {
  const { db } = await getTenantPrisma();
  return db.documentFolder.findMany({
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    include: {
      _count: { select: { documents: true, children: true } },
    },
  });
}

export async function createDocumentFolder(data: {
  name: string;
  description?: string;
  parentId?: string;
  isPublic?: boolean;
  memberOnly?: boolean;
  allowedTierIds?: string[];
}) {
  const { db } = await getTenantPrisma();

  const folder = await db.documentFolder.create({
    data: {
      name: data.name,
      description: data.description || null,
      parentId: data.parentId || null,
      isPublic: data.isPublic ?? false,
      memberOnly: data.memberOnly ?? true,
      allowedTierIds: data.allowedTierIds || [],
    } as any,
  });

  revalidatePath("/documents");
  return folder;
}

export async function updateDocumentFolder(id: string, data: {
  name?: string;
  description?: string;
  isPublic?: boolean;
  memberOnly?: boolean;
  allowedTierIds?: string[];
}) {
  const { db } = await getTenantPrisma();

  const folder = await db.documentFolder.update({
    where: { id },
    data: {
      ...(data.name !== undefined && { name: data.name }),
      ...(data.description !== undefined && { description: data.description || null }),
      ...(data.isPublic !== undefined && { isPublic: data.isPublic }),
      ...(data.memberOnly !== undefined && { memberOnly: data.memberOnly }),
      ...(data.allowedTierIds !== undefined && { allowedTierIds: data.allowedTierIds }),
    },
  });

  revalidatePath("/documents");
  return folder;
}

export async function deleteDocumentFolder(id: string) {
  const { db } = await getTenantPrisma();
  await db.documentFolder.delete({ where: { id } });
  revalidatePath("/documents");
  return { success: true };
}

// ─── Documents ───────────────────────────────────────

export async function getDocuments({
  folderId,
  search,
  page = 1,
  pageSize = 25,
}: {
  folderId?: string;
  search?: string;
  page?: number;
  pageSize?: number;
} = {}) {
  const { db } = await getTenantPrisma();
  pageSize = Math.min(pageSize, 100);

  const where: Record<string, unknown> = {};
  if (folderId) where.folderId = folderId;
  if (folderId === null) where.folderId = null; // root level
  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { description: { contains: search, mode: "insensitive" } },
    ];
  }

  const [documents, total] = await Promise.all([
    db.document.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: { folder: { select: { id: true, name: true } } },
    }),
    db.document.count({ where }),
  ]);

  return { documents, total, pages: Math.ceil(total / pageSize) };
}

export async function createDocument(data: {
  name: string;
  description?: string;
  fileName: string;
  fileUrl: string;
  fileSize: number;
  mimeType?: string;
  folderId?: string;
  isPublic?: boolean;
  memberOnly?: boolean;
}) {
  const { db, session } = await getTenantPrisma();

  const doc = await db.document.create({
    data: {
      name: data.name,
      description: data.description || null,
      fileName: data.fileName,
      fileUrl: data.fileUrl,
      fileSize: data.fileSize,
      mimeType: data.mimeType || null,
      folderId: data.folderId || null,
      isPublic: data.isPublic ?? false,
      memberOnly: data.memberOnly ?? true,
      uploadedById: session.user?.id || null,
    } as any,
  });

  await logActivity({
    type: "document_uploaded",
    description: `Uploaded document "${doc.name}"`,
    metadata: { documentId: doc.id },
  });

  revalidatePath("/documents");
  return doc;
}

export async function updateDocument(id: string, data: {
  name?: string;
  description?: string;
  folderId?: string | null;
  isPublic?: boolean;
  memberOnly?: boolean;
}) {
  const { db } = await getTenantPrisma();

  const doc = await db.document.update({
    where: { id },
    data: {
      ...(data.name !== undefined && { name: data.name }),
      ...(data.description !== undefined && { description: data.description || null }),
      ...(data.folderId !== undefined && { folderId: data.folderId }),
      ...(data.isPublic !== undefined && { isPublic: data.isPublic }),
      ...(data.memberOnly !== undefined && { memberOnly: data.memberOnly }),
    },
  });

  revalidatePath("/documents");
  return doc;
}

export async function deleteDocument(id: string) {
  const { db } = await getTenantPrisma();
  const doc = await db.document.delete({ where: { id } });

  await logActivity({
    type: "document_deleted",
    description: `Deleted document "${doc.name}"`,
  });

  revalidatePath("/documents");
  return { success: true };
}

export async function trackDocumentDownload(id: string) {
  const { db } = await getTenantPrisma();
  await db.document.update({
    where: { id },
    data: { downloadCount: { increment: 1 } },
  });
}

// ─── Stats ───────────────────────────────────────────

export async function getDocumentStats() {
  const { db } = await getTenantPrisma();

  const [totalDocuments, totalFolders, totalDownloads] = await Promise.all([
    db.document.count(),
    db.documentFolder.count(),
    db.document.aggregate({ _sum: { downloadCount: true } }),
  ]);

  return {
    totalDocuments,
    totalFolders,
    totalDownloads: totalDownloads._sum.downloadCount || 0,
  };
}
