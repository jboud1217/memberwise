"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import dns from "dns/promises";

// The CNAME target that customers point their domain to
const CNAME_TARGET = "proxy.memberwise.com";

export async function saveCustomDomain(domain: string) {
  const session = await auth();
  if (!session?.user?.organizationId) throw new Error("Not authenticated");

  // Validate domain format
  const domainRegex = /^([a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$/;
  if (!domainRegex.test(domain)) {
    return { error: "Invalid domain format. Example: members.yourorg.com" };
  }

  // Check if domain is already used by another org
  const existing = await prisma.organization.findFirst({
    where: {
      customDomain: domain.toLowerCase(),
      id: { not: session.user.organizationId },
    },
  });
  if (existing) {
    return { error: "This domain is already in use by another organization" };
  }

  await prisma.organization.update({
    where: { id: session.user.organizationId },
    data: {
      customDomain: domain.toLowerCase(),
      domainVerified: false,
    },
  });

  revalidatePath("/settings");
  revalidatePath("/settings/domain");
  revalidatePath("/dashboard");

  return { success: true, cnameTarget: CNAME_TARGET };
}

export async function verifyDomain() {
  const session = await auth();
  if (!session?.user?.organizationId) throw new Error("Not authenticated");

  const org = await prisma.organization.findUnique({
    where: { id: session.user.organizationId },
    select: { customDomain: true },
  });

  if (!org?.customDomain) {
    return { error: "No custom domain configured" };
  }

  try {
    // Look up the CNAME record for the domain
    const cnameRecords = await dns.resolveCname(org.customDomain);
    const normalizedRecords = cnameRecords.map((r) => r.toLowerCase().replace(/\.$/, ""));
    const matches = normalizedRecords.includes(CNAME_TARGET.toLowerCase());

    if (matches) {
      await prisma.organization.update({
        where: { id: session.user.organizationId },
        data: { domainVerified: true },
      });

      revalidatePath("/settings");
      revalidatePath("/settings/domain");
      revalidatePath("/dashboard");

      return { verified: true };
    }

    return {
      verified: false,
      message: "CNAME record doesn't match yet. DNS changes can take a few minutes to propagate.",
      found: normalizedRecords,
    };
  } catch {
    return {
      verified: false,
      message: "Could not find a CNAME record for this domain. Make sure you've added the record at your DNS provider.",
    };
  }
}

export async function removeDomain() {
  const session = await auth();
  if (!session?.user?.organizationId) throw new Error("Not authenticated");

  await prisma.organization.update({
    where: { id: session.user.organizationId },
    data: {
      customDomain: null,
      domainVerified: false,
    },
  });

  revalidatePath("/settings");
  revalidatePath("/settings/domain");
  revalidatePath("/dashboard");

  return { success: true };
}
