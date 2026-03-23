"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import {
  type ColumnMapping,
  getRecordType,
  getMappedValue,
  mapStatus,
  parseMemberType,
  smartParseDate,
} from "@/lib/import-utils";

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

export async function importMembers(
  rows: Record<string, string>[],
  mapping: Record<string, ColumnMapping>,
  headers: string[],
  importJobId: string
) {
  const session = await auth();
  if (!session?.user?.organizationId) throw new Error("Not authenticated");
  const orgId = session.user.organizationId;

  await prisma.importJob.update({
    where: { id: importJobId },
    data: { status: "IMPORTING", totalRows: rows.length },
  });

  let processedRows = 0;
  let errorRows = 0;
  const errors: { row: number; error: string }[] = [];

  // ─── Step 1: Auto-create membership tiers from Member Type values ───
  const tierMap: Record<string, string> = {}; // tierName -> tierId
  const seenTypes = new Set<string>();

  for (const row of rows) {
    const memberType = getMappedValue(row, mapping, "memberType", headers);
    if (memberType) seenTypes.add(memberType);
  }

  // Parse unique member types into tiers
  const tierDedup: Record<string, { name: string; interval: string; price: number }> = {};
  for (const typeStr of seenTypes) {
    const parsed = parseMemberType(typeStr);
    if (!parsed) continue;

    const key = `${parsed.name}|${parsed.interval}`;
    if (!tierDedup[key] || parsed.price > tierDedup[key].price) {
      tierDedup[key] = { name: parsed.name, interval: parsed.interval, price: parsed.price };
    }
    // Map both the raw type string and the cleaned name to this tier key
    tierMap[typeStr] = key;
  }

  // Create tiers in DB
  const tierIdMap: Record<string, string> = {}; // key -> tierId
  let sortOrder = 0;
  for (const [key, tier] of Object.entries(tierDedup)) {
    const created = await prisma.membershipTier.create({
      data: {
        organizationId: orgId,
        name: tier.name,
        price: tier.price,
        billingInterval: tier.interval as "ANNUAL" | "TWO_YEAR" | "MONTHLY",
        isActive: true,
        sortOrder: sortOrder++,
        benefits: [],
      },
    });
    tierIdMap[key] = created.id;
  }

  // ─── Step 2: Create member records (org records + standalone prospects) ───
  const memberIdByLegacyId: Record<string, string> = {}; // legacyOrgId -> memberId

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const recordType = getRecordType(row, headers);

    if (recordType === "contact") continue; // handled in step 3

    try {
      const get = (field: string) => getMappedValue(row, mapping, field, headers);

      const orgName = get("organizationName");
      const firstName = get("firstName");
      const lastName = get("lastName");
      const fullName = get("fullName");
      const contactName = get("contactName");
      const status = get("status");
      const memberType = get("memberType");

      // Build display name: prefer org name, then full name, then first+last, then address
      let displayName = orgName
        || fullName
        || contactName
        || [firstName, lastName].filter(Boolean).join(" ")
        || get("address1")
        || "Unknown";

      // Resolve tier
      const tierKey = memberType ? tierMap[memberType] : undefined;
      const tierId = tierKey ? tierIdMap[tierKey] : undefined;

      const member = await prisma.member.create({
        data: {
          organizationId: orgId,
          displayName,
          organizationName: orgName || null,
          status: status ? mapStatus(status) : "PROSPECT",
          memberNumber: get("memberNumber") || null,
          tierId: tierId || null,
          // Address: prefer primary, fall back to preferred
          address1: get("address1") || get("addressPreferred1") || null,
          address2: get("address2") || get("addressPreferred2") || null,
          city: get("city") || get("cityPreferred") || null,
          state: get("state") || get("statePreferred") || null,
          zip: get("zip") || get("zipPreferred") || null,
          country: get("country") || get("countryPreferred") || null,
          // Dates
          joinDate: smartParseDate(get("joinDate")),
          expirationDate: smartParseDate(get("expirationDate")),
          renewalDate: smartParseDate(get("renewalDate")),
          memberSince: smartParseDate(get("joinDate") || get("createdDate")),
          // Legacy IDs
          legacyId: get("legacyId") || null,
          legacyOrganizationId: get("legacyOrganizationId") || null,
          // Notes: store committees and other custom data
          notes: [
            get("committees") ? `Committees: ${get("committees")}` : "",
          ].filter(Boolean).join("\n") || null,
        },
      });

      // Track legacy ID for linking contacts
      const legacyOrgId = get("legacyOrganizationId");
      if (legacyOrgId) memberIdByLegacyId[legacyOrgId] = member.id;
      const legacyId = get("legacyId");
      if (legacyId) memberIdByLegacyId[legacyId] = member.id;

      // For standalone records (not org records), also create a contact
      if (recordType === "standalone" && (firstName || lastName)) {
        await prisma.contact.create({
          data: {
            organizationId: orgId,
            firstName: firstName || "",
            lastName: lastName || "",
            email: get("email") || null,
            phone: get("phone") || get("phonePreferred") || null,
            mobile: get("mobile") || null,
            isPrimary: true,
            memberId: member.id,
          },
        });
      }

      // Create payment record if dues data exists
      const duesStr = get("dues");
      if (duesStr) {
        const duesAmount = parseFloat(duesStr.replace(/[$,]/g, ""));
        if (!isNaN(duesAmount) && duesAmount > 0) {
          await prisma.payment.create({
            data: {
              organizationId: orgId,
              memberId: member.id,
              amount: Math.round(duesAmount * 100),
              status: "COMPLETED",
              method: "OTHER",
              description: `Imported dues${get("duesYearsPaid") ? ` (${get("duesYearsPaid")} years)` : ""}`,
              paidAt: smartParseDate(get("paymentDate") || get("postingDate")),
            },
          });
        }
      }

      // Save custom field values for member entity
      for (const [colHeader, m] of Object.entries(mapping)) {
        if (m.entity !== "custom" || !m.customFieldId) continue;
        const val = (row[colHeader] || "").trim();
        if (!val) continue;

        // Determine if this custom field is for MEMBER or CONTACT
        // We save on member here; contact custom fields are handled in step 3
        await prisma.customFieldValue.upsert({
          where: { fieldId_memberId: { fieldId: m.customFieldId, memberId: member.id } },
          create: { fieldId: m.customFieldId, memberId: member.id, value: val },
          update: { value: val },
        });
      }

      processedRows++;
    } catch (err) {
      errorRows++;
      errors.push({ row: i + 2, error: String(err).slice(0, 200) });
    }

    if (i % 25 === 0) {
      await prisma.importJob.update({
        where: { id: importJobId },
        data: { processedRows, errorRows },
      });
    }
  }

  // ─── Step 3: Create contact records linked to their household ───
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    if (getRecordType(row, headers) !== "contact") continue;

    try {
      const get = (field: string) => getMappedValue(row, mapping, field, headers);
      const linkToOrgId = get("linkToOrganizationId");
      const memberId = linkToOrgId ? memberIdByLegacyId[linkToOrgId] : null;

      const firstName = get("firstName");
      const lastName = get("lastName");

      const contact = await prisma.contact.create({
        data: {
          organizationId: orgId,
          firstName: firstName || "",
          lastName: lastName || "",
          email: get("email") || null,
          phone: get("phone") || get("phonePreferred") || null,
          mobile: get("mobile") || null,
          isPrimary: get("keyContact")?.toLowerCase() === "true",
          memberId: memberId || null,
          legacyId: get("legacyId") || null,
          legacyLinkToOrganizationId: linkToOrgId || null,
        },
      });

      // Save custom field values for contact entity
      for (const [colHeader, m] of Object.entries(mapping)) {
        if (m.entity !== "custom" || !m.customFieldId) continue;
        const val = (row[colHeader] || "").trim();
        if (!val) continue;

        await prisma.customFieldValue.upsert({
          where: { fieldId_contactId: { fieldId: m.customFieldId, contactId: contact.id } },
          create: { fieldId: m.customFieldId, contactId: contact.id, value: val },
          update: { value: val },
        });
      }

      processedRows++;
    } catch (err) {
      errorRows++;
      errors.push({ row: i + 2, error: String(err).slice(0, 200) });
    }
  }

  // ─── Finalize ───
  const tiersCreated = Object.keys(tierDedup).length;
  const membersCreated = Object.keys(memberIdByLegacyId).length +
    rows.filter((r) => getRecordType(r, headers) === "standalone").length;

  await prisma.importJob.update({
    where: { id: importJobId },
    data: {
      status: "COMPLETED",
      processedRows,
      errorRows,
      errors: errors.length > 0 ? errors.slice(0, 100) : undefined,
      completedAt: new Date(),
    },
  });

  revalidatePath("/members");
  revalidatePath("/contacts");
  revalidatePath("/tiers");
  revalidatePath("/dashboard");

  return {
    processedRows,
    errorRows,
    errors: errors.slice(0, 20),
    tiersCreated,
    membersCreated,
  };
}
