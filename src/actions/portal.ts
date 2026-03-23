"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { tenantPrisma } from "@/lib/prisma-tenant";
import { revalidatePath } from "next/cache";

async function getTenantPrisma() {
  const session = await auth();
  if (!session?.user?.organizationId) throw new Error("Not authenticated");
  return { db: tenantPrisma(prisma, session.user.organizationId), orgId: session.user.organizationId, session };
}

// ─── Member Self-Service ─────────────────────────────

export async function getPortalMemberProfile() {
  const { db, session } = await getTenantPrisma();

  // Find the member record linked to this user's email
  const contact = await db.contact.findFirst({
    where: { email: session.user?.email || "" },
    include: {
      member: {
        include: {
          tier: true,
          payments: {
            orderBy: { createdAt: "desc" },
            take: 10,
          },
          contacts: true,
          volunteerLogs: {
            where: { approved: true },
            orderBy: { date: "desc" },
            take: 5,
          },
          committeeMemberships: {
            where: { endDate: null },
            include: { committee: { select: { id: true, name: true } } },
          },
        },
      },
    },
  });

  if (!contact?.member) return null;

  return {
    member: contact.member,
    contact,
  };
}

export async function getPortalRenewalInfo() {
  const { db, session } = await getTenantPrisma();

  const contact = await db.contact.findFirst({
    where: { email: session.user?.email || "" },
    include: {
      member: {
        include: {
          tier: true,
        },
      },
    },
  });

  if (!contact?.member) return null;

  const member = contact.member;

  // Get available tiers for upgrade/change
  const availableTiers = await db.membershipTier.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: "asc" },
  });

  // Get org stripe info
  const org = await prisma.organization.findUnique({
    where: { id: session.user?.organizationId },
    select: { stripeConnectAccountId: true, stripeConnectOnboarded: true },
  });

  return {
    member: {
      id: member.id,
      displayName: member.displayName,
      status: member.status,
      renewalDate: member.renewalDate,
      expirationDate: member.expirationDate,
      tierId: member.tierId,
      tierName: member.tier?.name || null,
      tierPrice: member.tier?.price || 0,
      tierInterval: member.tier?.billingInterval || null,
    },
    availableTiers: availableTiers.map((t) => ({
      id: t.id,
      name: t.name,
      description: t.description,
      price: t.price,
      billingInterval: t.billingInterval,
      benefits: t.benefits,
    })),
    stripeEnabled: org?.stripeConnectOnboarded ?? false,
  };
}

export async function updatePortalProfile(data: {
  firstName?: string;
  lastName?: string;
  phone?: string;
  mobile?: string;
  address1?: string;
  address2?: string;
  city?: string;
  state?: string;
  zip?: string;
}) {
  const { db, session } = await getTenantPrisma();

  // Find the member's primary contact
  const contact = await db.contact.findFirst({
    where: { email: session.user?.email || "", isPrimary: true },
  });
  if (!contact) throw new Error("Profile not found");

  // Update contact info
  await db.contact.update({
    where: { id: contact.id },
    data: {
      ...(data.firstName !== undefined && { firstName: data.firstName }),
      ...(data.lastName !== undefined && { lastName: data.lastName }),
      ...(data.phone !== undefined && { phone: data.phone || null }),
      ...(data.mobile !== undefined && { mobile: data.mobile || null }),
    },
  });

  // Update member address if provided
  if (contact.memberId && (data.address1 !== undefined || data.city !== undefined || data.state !== undefined || data.zip !== undefined)) {
    await db.member.update({
      where: { id: contact.memberId },
      data: {
        ...(data.address1 !== undefined && { address1: data.address1 || null }),
        ...(data.address2 !== undefined && { address2: data.address2 || null }),
        ...(data.city !== undefined && { city: data.city || null }),
        ...(data.state !== undefined && { state: data.state || null }),
        ...(data.zip !== undefined && { zip: data.zip || null }),
      },
    });
  }

  revalidatePath("/portal/profile");
  return { success: true };
}

// ─── Renewal & Tier Upgrade ─────────────────────────

export async function initiateRenewalCheckout(input: {
  tierId: string; // tier to renew into (can be current or different)
}) {
  const { db, session, orgId } = await getTenantPrisma();
  const { stripe } = await import("@/lib/stripe");

  // Get member
  const contact = await db.contact.findFirst({
    where: { email: session.user?.email || "" },
    include: { member: { include: { tier: true } } },
  });
  if (!contact?.member) throw new Error("Member not found");

  // Get org stripe account
  const org = await prisma.organization.findUnique({
    where: { id: orgId },
    select: { stripeConnectAccountId: true, stripeConnectOnboarded: true },
  });
  if (!org?.stripeConnectAccountId || !org.stripeConnectOnboarded) {
    throw new Error("Online payments are not configured for this organization");
  }

  // Get target tier
  const tier = await db.membershipTier.findUnique({ where: { id: input.tierId } });
  if (!tier || !tier.isActive) throw new Error("Selected tier is not available");
  if (tier.price <= 0) throw new Error("This tier is free — no payment required");

  // Determine the base URL for redirect
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://localhost:3000";

  // Create a Stripe Checkout session on the connected account
  const checkoutSession = await stripe.checkout.sessions.create(
    {
      mode: "payment",
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: `${tier.name} Membership`,
              description: tier.description || `Membership dues — ${tier.name}`,
            },
            unit_amount: tier.price, // already in cents
          },
          quantity: 1,
        },
      ],
      metadata: {
        memberId: contact.member.id,
        tierId: tier.id,
        orgId,
        type: "membership_renewal",
      },
      customer_email: contact.email || undefined,
      success_url: `${appUrl}/portal/dues?success=1`,
      cancel_url: `${appUrl}/portal/dues?cancelled=1`,
    },
    {
      stripeAccount: org.stripeConnectAccountId,
    },
  );

  return { url: checkoutSession.url };
}

export async function completeOfflineRenewal(input: { tierId: string }) {
  const { db, session } = await getTenantPrisma();

  const contact = await db.contact.findFirst({
    where: { email: session.user?.email || "" },
    include: { member: true },
  });
  if (!contact?.member) throw new Error("Member not found");

  const tier = await db.membershipTier.findUnique({ where: { id: input.tierId } });
  if (!tier || !tier.isActive) throw new Error("Selected tier is not available");

  // For free tiers — just update the member
  if (tier.price <= 0) {
    const now = new Date();
    const nextYear = new Date(now);
    nextYear.setFullYear(nextYear.getFullYear() + 1);

    await db.member.update({
      where: { id: contact.member.id },
      data: {
        tierId: tier.id,
        status: "ACTIVE",
        renewalDate: nextYear,
        expirationDate: nextYear,
      },
    });

    revalidatePath("/portal/dues");
    return { success: true };
  }

  throw new Error("Paid tiers require online payment");
}

// ─── Portal Documents ────────────────────────────────

export async function getPortalDocuments() {
  const { db, session } = await getTenantPrisma();

  // Get member's tier for access control
  const contact = await db.contact.findFirst({
    where: { email: session.user?.email || "" },
    include: { member: { select: { tierId: true } } },
  });

  const tierId = contact?.member?.tierId;

  // Get folders accessible to this member
  const folders = await db.documentFolder.findMany({
    where: {
      memberOnly: true,
      OR: [
        { allowedTierIds: { isEmpty: true } }, // No tier restriction
        ...(tierId ? [{ allowedTierIds: { has: tierId } }] : []),
      ],
    },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    include: {
      documents: {
        orderBy: { createdAt: "desc" },
        select: { id: true, name: true, description: true, fileName: true, fileSize: true, mimeType: true, createdAt: true },
      },
    },
  });

  // Get root-level documents
  const rootDocuments = await db.document.findMany({
    where: {
      memberOnly: true,
      folderId: null,
    },
    orderBy: { createdAt: "desc" },
    select: { id: true, name: true, description: true, fileName: true, fileSize: true, mimeType: true, createdAt: true },
  });

  return { folders, rootDocuments };
}

// ─── Portal Volunteer Hours ──────────────────────────

export async function getPortalVolunteerHours() {
  const { db, session } = await getTenantPrisma();

  const contact = await db.contact.findFirst({
    where: { email: session.user?.email || "" },
    include: { member: { select: { id: true } } },
  });

  if (!contact?.member) return null;

  const [logs, totalHours, ytdHours] = await Promise.all([
    db.volunteerLog.findMany({
      where: { memberId: contact.member.id },
      orderBy: { date: "desc" },
      take: 25,
      include: { opportunity: { select: { id: true, title: true } } },
    }),
    db.volunteerLog.aggregate({
      _sum: { hours: true },
      where: { memberId: contact.member.id, approved: true },
    }),
    db.volunteerLog.aggregate({
      _sum: { hours: true },
      where: {
        memberId: contact.member.id,
        approved: true,
        date: { gte: new Date(new Date().getFullYear(), 0, 1) },
      },
    }),
  ]);

  return {
    logs,
    totalHours: totalHours._sum.hours || 0,
    ytdHours: ytdHours._sum.hours || 0,
  };
}

// ─── Portal Forms ────────────────────────────────────

export async function getPortalForms() {
  const { db } = await getTenantPrisma();

  return db.form.findMany({
    where: { status: "PUBLISHED" },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      title: true,
      description: true,
      slug: true,
      formType: true,
      closesAt: true,
      responseCount: true,
      maxResponses: true,
    },
  });
}
