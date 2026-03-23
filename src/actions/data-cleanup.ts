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

// ─── Address Standardization ────────────────────────

const STATE_ABBREVIATIONS: Record<string, string> = {
  alabama: "AL", alaska: "AK", arizona: "AZ", arkansas: "AR", california: "CA",
  colorado: "CO", connecticut: "CT", delaware: "DE", florida: "FL", georgia: "GA",
  hawaii: "HI", idaho: "ID", illinois: "IL", indiana: "IN", iowa: "IA",
  kansas: "KS", kentucky: "KY", louisiana: "LA", maine: "ME", maryland: "MD",
  massachusetts: "MA", michigan: "MI", minnesota: "MN", mississippi: "MS",
  missouri: "MO", montana: "MT", nebraska: "NE", nevada: "NV",
  "new hampshire": "NH", "new jersey": "NJ", "new mexico": "NM", "new york": "NY",
  "north carolina": "NC", "north dakota": "ND", ohio: "OH", oklahoma: "OK",
  oregon: "OR", pennsylvania: "PA", "rhode island": "RI", "south carolina": "SC",
  "south dakota": "SD", tennessee: "TN", texas: "TX", utah: "UT", vermont: "VT",
  virginia: "VA", washington: "WA", "west virginia": "WV", wisconsin: "WI",
  wyoming: "WY", "district of columbia": "DC",
};

const VALID_ABBREVIATIONS = new Set(Object.values(STATE_ABBREVIATIONS));

function standardizeState(state: string): string {
  const trimmed = state.trim();
  const upper = trimmed.toUpperCase();
  if (VALID_ABBREVIATIONS.has(upper)) return upper;
  return STATE_ABBREVIATIONS[trimmed.toLowerCase()] || trimmed;
}

function standardizeZip(zip: string): string {
  // Strip everything except digits and hyphens
  const cleaned = zip.replace(/[^\d-]/g, "");
  // If it's a 9-digit zip without hyphen, format as XXXXX-XXXX
  if (/^\d{9}$/.test(cleaned)) return `${cleaned.slice(0, 5)}-${cleaned.slice(5)}`;
  // If it's a 5-digit zip, keep it
  if (/^\d{5}(-\d{4})?$/.test(cleaned)) return cleaned;
  return cleaned || zip.trim();
}

function titleCase(str: string): string {
  return str.trim().replace(/\b\w/g, (c) => c.toUpperCase()).replace(/\b(Of|The|And|In|At|To|For)\b/g, (w) => w.toLowerCase());
}

export async function previewAddressStandardization() {
  const { db } = await getTenantPrisma();

  const members = await db.member.findMany({
    where: {
      OR: [
        { state: { not: null } },
        { zip: { not: null } },
        { city: { not: null } },
      ],
    },
    select: { id: true, displayName: true, address1: true, address2: true, city: true, state: true, zip: true },
  });

  const changes: Array<{
    memberId: string;
    displayName: string;
    field: string;
    before: string;
    after: string;
  }> = [];

  for (const m of members) {
    if (m.state) {
      const standardized = standardizeState(m.state);
      if (standardized !== m.state) {
        changes.push({ memberId: m.id, displayName: m.displayName || m.id, field: "state", before: m.state, after: standardized });
      }
    }
    if (m.zip) {
      const standardized = standardizeZip(m.zip);
      if (standardized !== m.zip) {
        changes.push({ memberId: m.id, displayName: m.displayName || m.id, field: "zip", before: m.zip, after: standardized });
      }
    }
    if (m.city) {
      const standardized = titleCase(m.city);
      if (standardized !== m.city) {
        changes.push({ memberId: m.id, displayName: m.displayName || m.id, field: "city", before: m.city, after: standardized });
      }
    }
  }

  return { totalMembers: members.length, changes };
}

export async function applyAddressStandardization() {
  const { db } = await getTenantPrisma();

  const members = await db.member.findMany({
    where: {
      OR: [
        { state: { not: null } },
        { zip: { not: null } },
        { city: { not: null } },
      ],
    },
    select: { id: true, city: true, state: true, zip: true },
  });

  let updated = 0;
  for (const m of members) {
    const data: Record<string, string> = {};
    if (m.state) {
      const s = standardizeState(m.state);
      if (s !== m.state) data.state = s;
    }
    if (m.zip) {
      const z = standardizeZip(m.zip);
      if (z !== m.zip) data.zip = z;
    }
    if (m.city) {
      const c = titleCase(m.city);
      if (c !== m.city) data.city = c;
    }
    if (Object.keys(data).length > 0) {
      await db.member.update({ where: { id: m.id }, data });
      updated++;
    }
  }

  await logActivity({
    type: "data_cleanup",
    description: `Standardized addresses for ${updated} members`,
  });

  revalidatePath("/members");
  revalidatePath("/settings/data-cleanup");
  return { updated };
}

// ─── Duplicate Detection ────────────────────────────

export async function findDuplicateMembers() {
  const { db } = await getTenantPrisma();

  const members = await db.member.findMany({
    select: {
      id: true,
      displayName: true,
      status: true,
      contacts: { select: { email: true, firstName: true, lastName: true, phone: true } },
    },
  });

  // Group by normalized email
  const emailMap = new Map<string, typeof members>();
  // Group by normalized name
  const nameMap = new Map<string, typeof members>();

  for (const m of members) {
    for (const c of m.contacts) {
      if (c.email) {
        const key = c.email.toLowerCase().trim();
        if (!emailMap.has(key)) emailMap.set(key, []);
        emailMap.get(key)!.push(m);
      }
      const name = `${(c.firstName || "").toLowerCase().trim()} ${(c.lastName || "").toLowerCase().trim()}`.trim();
      if (name.length > 2) {
        if (!nameMap.has(name)) nameMap.set(name, []);
        nameMap.get(name)!.push(m);
      }
    }
  }

  const duplicates: Array<{
    matchType: "email" | "name";
    matchValue: string;
    members: Array<{ id: string; displayName: string; status: string; email?: string }>;
  }> = [];

  const seen = new Set<string>();

  for (const [email, group] of emailMap) {
    if (group.length > 1) {
      const key = group.map((m) => m.id).sort().join(",");
      if (!seen.has(key)) {
        seen.add(key);
        duplicates.push({
          matchType: "email",
          matchValue: email,
          members: group.map((m) => ({
            id: m.id,
            displayName: m.displayName || "Unknown",
            status: m.status,
            email,
          })),
        });
      }
    }
  }

  for (const [name, group] of nameMap) {
    if (group.length > 1) {
      const key = group.map((m) => m.id).sort().join(",");
      if (!seen.has(key)) {
        seen.add(key);
        duplicates.push({
          matchType: "name",
          matchValue: name,
          members: group.map((m) => ({
            id: m.id,
            displayName: m.displayName || "Unknown",
            status: m.status,
          })),
        });
      }
    }
  }

  return { duplicates, totalMembers: members.length };
}

// ─── Unused Custom Fields ───────────────────────────

export async function findUnusedCustomFields() {
  const { db } = await getTenantPrisma();

  const fields = await db.customField.findMany({
    include: {
      _count: { select: { values: true } },
    },
    orderBy: { sortOrder: "asc" },
  });

  return fields.map((f) => ({
    id: f.id,
    name: f.name,
    key: f.key,
    type: f.type,
    entity: f.entity,
    isActive: f.isActive,
    valueCount: f._count.values,
    createdAt: f.createdAt,
  }));
}

export async function deactivateCustomField(fieldId: string) {
  const { db } = await getTenantPrisma();

  await db.customField.update({
    where: { id: fieldId },
    data: { isActive: false },
  });

  await logActivity({
    type: "data_cleanup",
    description: `Deactivated custom field`,
    metadata: { fieldId },
  });

  revalidatePath("/settings/data-cleanup");
  return { success: true };
}

export async function deleteCustomField(fieldId: string) {
  const { db } = await getTenantPrisma();

  // Delete all values first, then the field
  // CustomFieldValue doesn't have organizationId — use prisma directly
  await prisma.customFieldValue.deleteMany({ where: { fieldId } });
  await db.customField.delete({ where: { id: fieldId } });

  await logActivity({
    type: "data_cleanup",
    description: `Deleted custom field and its values`,
    metadata: { fieldId },
  });

  revalidatePath("/settings/data-cleanup");
  return { success: true };
}
