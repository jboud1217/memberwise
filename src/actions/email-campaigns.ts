"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { tenantPrisma } from "@/lib/prisma-tenant";
import { revalidatePath } from "next/cache";
import { logActivity } from "./activity";
import { sendEmail, type EmailProvider, type EmailSettings } from "@/lib/email-service";

async function getTenantPrisma() {
  const session = await auth();
  if (!session?.user?.organizationId) throw new Error("Not authenticated");
  return { db: tenantPrisma(prisma, session.user.organizationId), orgId: session.user.organizationId, session };
}

// ─── Create Campaign ────────────────────────────────

export async function createCampaign(data: {
  subject: string;
  body: string;
  statusFilter?: string;
  tierFilter?: string;
  scheduledAt?: string; // ISO string for scheduling
}): Promise<{ success: true; campaign: { id: string } } | { error: string }> {
  if (!data.subject) return { error: "Subject is required" };

  const { db } = await getTenantPrisma();

  // Build recipient filter
  const recipientFilter: Record<string, string> = {};
  if (data.statusFilter) recipientFilter.status = data.statusFilter;
  if (data.tierFilter) recipientFilter.tierId = data.tierFilter;

  // Count matching recipients
  const memberWhere: Record<string, unknown> = {};
  if (data.statusFilter) memberWhere.status = data.statusFilter;
  if (data.tierFilter) memberWhere.tierId = data.tierFilter;

  const recipientCount = await db.contact.count({
    where: {
      email: { not: null },
      ...(Object.keys(memberWhere).length > 0 ? { member: { is: memberWhere } } : {}),
    },
  });

  const status = data.scheduledAt ? "SCHEDULED" : "DRAFT";
  const scheduledAt = data.scheduledAt ? new Date(data.scheduledAt) : undefined;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const campaign = await db.emailCampaign.create({
    data: {
      subject: data.subject,
      body: data.body,
      status,
      recipientFilter: Object.keys(recipientFilter).length > 0 ? recipientFilter : undefined,
      recipientCount,
      scheduledAt,
    } as any,
  });

  revalidatePath("/email");
  return { success: true, campaign };
}

// ─── Send Campaign ──────────────────────────────────

export async function sendCampaign(campaignId: string): Promise<{ success: true; sent: number } | { error: string }> {
  const { db, orgId } = await getTenantPrisma();

  const campaign = await db.emailCampaign.findUnique({ where: { id: campaignId } });
  if (!campaign) return { error: "Campaign not found" };

  if (campaign.status === "SENT" || campaign.status === "SENDING") {
    return { error: "This campaign has already been sent" };
  }

  // Get email provider settings
  const org = await prisma.organization.findUnique({
    where: { id: orgId },
    select: { emailProvider: true, emailSettings: true, name: true },
  });

  if (!org?.emailProvider || !org.emailSettings) {
    return { error: "Email not configured. Go to Settings → Email to connect a provider." };
  }

  const provider = org.emailProvider as EmailProvider;
  const settings = org.emailSettings as unknown as EmailSettings;

  // Mark as sending
  await db.emailCampaign.update({
    where: { id: campaignId },
    data: { status: "SENDING" },
  });

  // Get recipients
  const recipientFilter = campaign.recipientFilter as Record<string, string> | null;
  const memberWhere: Record<string, unknown> = {};
  if (recipientFilter?.status) memberWhere.status = recipientFilter.status;
  if (recipientFilter?.tierId) memberWhere.tierId = recipientFilter.tierId;

  const contacts = await db.contact.findMany({
    where: {
      email: { not: null },
      ...(Object.keys(memberWhere).length > 0 ? { member: { is: memberWhere } } : {}),
    },
    select: { email: true },
  });

  const emails = contacts
    .map((c) => c.email)
    .filter((e): e is string => !!e);

  if (emails.length === 0) {
    await db.emailCampaign.update({
      where: { id: campaignId },
      data: { status: "FAILED" },
    });
    return { error: "No recipients with email addresses match the filter." };
  }

  // Send in batches of 50
  let sentCount = 0;
  let failedCount = 0;
  const failedDetails: { email: string; error: string }[] = [];
  const batchSize = 50;

  for (let i = 0; i < emails.length; i += batchSize) {
    const batch = emails.slice(i, i + batchSize);

    const results = await Promise.allSettled(
      batch.map((to) =>
        sendEmail(provider, settings, {
          to,
          subject: campaign.subject,
          html: campaign.body,
          replyTo: settings.senderEmail,
        }).then((result) => ({ to, result }))
      )
    );

    for (const r of results) {
      if (r.status === "fulfilled" && r.value.result.success) {
        sentCount++;
      } else {
        failedCount++;
        const email = r.status === "fulfilled" ? r.value.to : "unknown";
        const error = r.status === "fulfilled"
          ? r.value.result.error || "Unknown error"
          : r.reason?.message || "Send rejected";
        if (failedDetails.length < 100) {
          failedDetails.push({ email, error });
        }
      }
    }
  }

  // Update campaign status with failure details for debugging
  const finalStatus = failedCount > 0 && sentCount === 0 ? "FAILED" : "SENT";
  await db.emailCampaign.update({
    where: { id: campaignId },
    data: {
      status: finalStatus,
      sentAt: new Date(),
      sentCount,
      bouncedCount: failedCount,
    },
  });

  await logActivity({
    type: "campaign_sent",
    description: `Sent email campaign "${campaign.subject}" to ${sentCount} recipients${failedCount > 0 ? ` (${failedCount} failed)` : ""}`,
    metadata: { campaignId, sentCount, failedCount, failedDetails: failedDetails.slice(0, 20) },
  });

  revalidatePath("/email");
  return { success: true, sent: sentCount };
}

// ─── Schedule Campaign ──────────────────────────────

export async function scheduleCampaign(
  campaignId: string,
  scheduledAt: string
): Promise<{ success: true } | { error: string }> {
  const { db } = await getTenantPrisma();

  const campaign = await db.emailCampaign.findUnique({ where: { id: campaignId } });
  if (!campaign) return { error: "Campaign not found" };

  if (campaign.status !== "DRAFT" && campaign.status !== "SCHEDULED") {
    return { error: "Only draft or scheduled campaigns can be rescheduled" };
  }

  await db.emailCampaign.update({
    where: { id: campaignId },
    data: {
      status: "SCHEDULED",
      scheduledAt: new Date(scheduledAt),
    },
  });

  revalidatePath("/email");
  return { success: true };
}

// ─── Unschedule (back to draft) ─────────────────────

export async function unscheduleCampaign(
  campaignId: string
): Promise<{ success: true } | { error: string }> {
  const { db } = await getTenantPrisma();

  const campaign = await db.emailCampaign.findUnique({ where: { id: campaignId } });
  if (!campaign) return { error: "Campaign not found" };

  if (campaign.status !== "SCHEDULED") {
    return { error: "Only scheduled campaigns can be unscheduled" };
  }

  await db.emailCampaign.update({
    where: { id: campaignId },
    data: { status: "DRAFT", scheduledAt: null },
  });

  revalidatePath("/email");
  return { success: true };
}

// ─── Delete Campaign ────────────────────────────────

export async function deleteCampaign(campaignId: string) {
  const { db } = await getTenantPrisma();
  await db.emailCampaign.delete({ where: { id: campaignId } });
  revalidatePath("/email");
  return { success: true };
}

// ─── Update Draft ───────────────────────────────────

export async function updateCampaign(
  campaignId: string,
  data: {
    subject?: string;
    body?: string;
    statusFilter?: string;
    tierFilter?: string;
  }
): Promise<{ success: true } | { error: string }> {
  const { db } = await getTenantPrisma();

  const campaign = await db.emailCampaign.findUnique({ where: { id: campaignId } });
  if (!campaign) return { error: "Campaign not found" };
  if (campaign.status !== "DRAFT" && campaign.status !== "SCHEDULED") {
    return { error: "Only draft or scheduled campaigns can be edited" };
  }

  const recipientFilter: Record<string, string> = {};
  if (data.statusFilter) recipientFilter.status = data.statusFilter;
  if (data.tierFilter) recipientFilter.tierId = data.tierFilter;

  const memberWhere: Record<string, unknown> = {};
  if (data.statusFilter) memberWhere.status = data.statusFilter;
  if (data.tierFilter) memberWhere.tierId = data.tierFilter;

  const recipientCount = await db.contact.count({
    where: {
      email: { not: null },
      ...(Object.keys(memberWhere).length > 0 ? { member: { is: memberWhere } } : {}),
    },
  });

  await db.emailCampaign.update({
    where: { id: campaignId },
    data: {
      ...(data.subject ? { subject: data.subject } : {}),
      ...(data.body ? { body: data.body } : {}),
      recipientFilter: Object.keys(recipientFilter).length > 0 ? recipientFilter : undefined,
      recipientCount,
    },
  });

  revalidatePath("/email");
  return { success: true };
}
