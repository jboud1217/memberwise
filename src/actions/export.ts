"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { tenantPrisma } from "@/lib/prisma-tenant";
import { logActivity } from "./activity";

async function getTenantPrisma() {
  const session = await auth();
  if (!session?.user?.organizationId) throw new Error("Not authenticated");
  return { db: tenantPrisma(prisma, session.user.organizationId), session };
}

function escapeCsv(val: string): string {
  if (!val) return "";
  if (val.includes(",") || val.includes('"') || val.includes("\n")) {
    return `"${val.replace(/"/g, '""')}"`;
  }
  return val;
}

export async function exportMembersCSV() {
  const { db } = await getTenantPrisma();

  const members = await db.member.findMany({
    include: { tier: true, contacts: true },
    orderBy: { displayName: "asc" },
  });

  const headers = [
    "Display Name", "Organization", "Status", "Tier", "Member Number",
    "Address 1", "Address 2", "City", "State", "ZIP", "Country",
    "Join Date", "Expiration Date", "Renewal Date",
    "Do Not Email", "Do Not Mail", "Notes",
    "Primary Contact First", "Primary Contact Last", "Primary Contact Email", "Primary Contact Phone",
  ];

  const rows = members.map((m) => {
    const primary = m.contacts.find((c) => c.isPrimary) || m.contacts[0];
    return [
      m.displayName, m.organizationName || "", m.status, m.tier?.name || "", m.memberNumber || "",
      m.address1 || "", m.address2 || "", m.city || "", m.state || "", m.zip || "", m.country || "",
      m.joinDate?.toISOString().split("T")[0] || "",
      m.expirationDate?.toISOString().split("T")[0] || "",
      m.renewalDate?.toISOString().split("T")[0] || "",
      m.doNotEmail ? "Yes" : "No", m.doNotMail ? "Yes" : "No",
      m.notes || "",
      primary?.firstName || "", primary?.lastName || "", primary?.email || "", primary?.phone || "",
    ].map(escapeCsv).join(",");
  });

  await logActivity({
    type: "data_exported",
    description: `Exported ${members.length} members to CSV`,
  });

  return headers.join(",") + "\n" + rows.join("\n");
}

export async function exportContactsCSV() {
  const { db } = await getTenantPrisma();

  const contacts = await db.contact.findMany({
    include: { member: true },
    orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
  });

  const headers = [
    "First Name", "Last Name", "Email", "Phone", "Mobile",
    "Is Primary", "Member Name",
  ];

  const rows = contacts.map((c) => [
    c.firstName, c.lastName, c.email || "", c.phone || "", c.mobile || "",
    c.isPrimary ? "Yes" : "No", c.member?.displayName || "",
  ].map(escapeCsv).join(","));

  await logActivity({
    type: "data_exported",
    description: `Exported ${contacts.length} contacts to CSV`,
  });

  return headers.join(",") + "\n" + rows.join("\n");
}
