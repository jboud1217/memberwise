"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { MemberStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";

// Detect record type from Wild Apricot CSV (matches migrate_membership_db.py logic)
function isOrgRecord(row: Record<string, string>): boolean {
  const orgId = row["Organization ID"] || row["organization id"] || "";
  const linkToOrg = row["Link to organization ID"] || row["link to organization id"] || "";
  return orgId.trim() !== "" && linkToOrg.trim() === "";
}

function isContactRecord(row: Record<string, string>): boolean {
  const linkToOrg = row["Link to organization ID"] || row["link to organization id"] || "";
  return linkToOrg.trim() !== "";
}

// Status mapping
function mapStatus(status: string): MemberStatus {
  const s = status.toLowerCase().trim();
  if (s === "active") return "ACTIVE";
  if (s === "lapsed") return "LAPSED";
  if (s === "suspended") return "SUSPENDED";
  return "PROSPECT";
}

export async function importMembers(
  rows: Record<string, string>[],
  columnMapping: Record<string, { target: string; entity: string }>,
  importJobId: string
) {
  const session = await auth();
  if (!session?.user?.organizationId) throw new Error("Not authenticated");

  const orgId = session.user.organizationId;

  // Create import job
  await prisma.importJob.update({
    where: { id: importJobId },
    data: { status: "IMPORTING", totalRows: rows.length },
  });

  let processedRows = 0;
  let errorRows = 0;
  const errors: { row: number; error: string }[] = [];

  // First pass: create member records from org records and prospect-only records
  const memberIdMap: Record<string, string> = {}; // legacyId -> memberId

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    try {
      if (isOrgRecord(row) || !isContactRecord(row)) {
        // This is an organization (household) record or a standalone individual
        const mapped = mapRow(row, columnMapping, "member");
        const member = await prisma.member.create({
          data: {
            organizationId: orgId,
            displayName: mapped.organizationName || `${mapped.firstName || ""} ${mapped.lastName || ""}`.trim() || "Unknown",
            organizationName: mapped.organizationName || null,
            status: mapped.status ? mapStatus(mapped.status) : "PROSPECT",
            memberNumber: mapped.memberNumber || null,
            address1: mapped.address1 || null,
            city: mapped.city || null,
            state: mapped.state || null,
            zip: mapped.zip || null,
            country: mapped.country || null,
            legacyId: mapped.legacyId || null,
            legacyOrganizationId: mapped.legacyOrganizationId || null,
            memberSince: mapped.memberSince ? tryParseDate(mapped.memberSince) : null,
            renewalDate: mapped.renewalDate ? tryParseDate(mapped.renewalDate) : null,
            joinDate: mapped.memberSince ? tryParseDate(mapped.memberSince) : null,
          },
        });

        if (mapped.legacyOrganizationId) {
          memberIdMap[mapped.legacyOrganizationId] = member.id;
        }
        if (mapped.legacyId) {
          memberIdMap[mapped.legacyId] = member.id;
        }

        // If standalone (not org record), also create a contact
        if (!isOrgRecord(row)) {
          const contactMapped = mapRow(row, columnMapping, "contact");
          if (contactMapped.firstName || contactMapped.lastName) {
            await prisma.contact.create({
              data: {
                organizationId: orgId,
                firstName: contactMapped.firstName || "",
                lastName: contactMapped.lastName || "",
                email: contactMapped.email || null,
                phone: contactMapped.phone || null,
                mobile: contactMapped.mobile || null,
                isPrimary: true,
                memberId: member.id,
              },
            });
          }
        }
      }
      processedRows++;
    } catch (err) {
      errorRows++;
      errors.push({ row: i + 1, error: String(err) });
    }

    // Update progress every 50 rows
    if (i % 50 === 0) {
      await prisma.importJob.update({
        where: { id: importJobId },
        data: { processedRows, errorRows },
      });
    }
  }

  // Second pass: create contact records linked to their org member
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    try {
      if (isContactRecord(row)) {
        const contactMapped = mapRow(row, columnMapping, "contact");
        const memberMapped = mapRow(row, columnMapping, "member");
        const linkToOrg = row["Link to organization ID"] || row["link to organization id"] || "";
        const memberId = memberIdMap[linkToOrg.trim()] || null;

        await prisma.contact.create({
          data: {
            organizationId: orgId,
            firstName: contactMapped.firstName || "",
            lastName: contactMapped.lastName || "",
            email: contactMapped.email || null,
            phone: contactMapped.phone || null,
            mobile: contactMapped.mobile || null,
            isPrimary: false,
            memberId,
            legacyId: memberMapped.legacyId || null,
            legacyLinkToOrganizationId: linkToOrg.trim() || null,
          },
        });
        processedRows++;
      }
    } catch (err) {
      errorRows++;
      errors.push({ row: i + 1, error: String(err) });
    }
  }

  await prisma.importJob.update({
    where: { id: importJobId },
    data: {
      status: errorRows > 0 ? "COMPLETED" : "COMPLETED",
      processedRows,
      errorRows,
      errors: errors.length > 0 ? errors.slice(0, 100) : undefined,
      completedAt: new Date(),
    },
  });

  revalidatePath("/members");
  revalidatePath("/contacts");

  return { processedRows, errorRows, errors: errors.slice(0, 20) };
}

export async function createImportJob(fileName: string) {
  const session = await auth();
  if (!session?.user?.organizationId) throw new Error("Not authenticated");

  return prisma.importJob.create({
    data: {
      organizationId: session.user.organizationId,
      fileName,
      status: "PENDING",
    },
  });
}

function mapRow(
  row: Record<string, string>,
  columnMapping: Record<string, { target: string; entity: string }>,
  entity: "member" | "contact"
): Record<string, string> {
  const result: Record<string, string> = {};
  for (const [csvCol, mapping] of Object.entries(columnMapping)) {
    if (mapping.entity === entity && row[csvCol] !== undefined) {
      result[mapping.target] = row[csvCol];
    }
  }
  return result;
}

function tryParseDate(dateStr: string): Date | null {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  return isNaN(d.getTime()) ? null : d;
}
