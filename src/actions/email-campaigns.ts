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

export async function createCampaign(data: {
  subject: string;
  body: string;
  statusFilter?: string;
  tierFilter?: string;
}): Promise<{ success: true; campaign: { id: string } } | { error: string }> {
  if (!data.subject) return { error: "Subject is required" };

  const { db } = await getTenantPrisma();

  // Build recipient filter
  const recipientFilter: Record<string, string> = {};
  if (data.statusFilter) recipientFilter.status = data.statusFilter;
  if (data.tierFilter) recipientFilter.tierId = data.tierFilter;

  // Count matching recipients (contacts with email linked to matching members)
  const memberWhere: Record<string, unknown> = {};
  if (data.statusFilter) memberWhere.status = data.statusFilter;
  if (data.tierFilter) memberWhere.tierId = data.tierFilter;

  const recipientCount = await db.contact.count({
    where: {
      email: { not: null },
      ...(Object.keys(memberWhere).length > 0 ? { member: { is: memberWhere } } : {}),
    },
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const campaign = await db.emailCampaign.create({
    data: {
      subject: data.subject,
      body: data.body,
      status: "DRAFT",
      recipientFilter: Object.keys(recipientFilter).length > 0 ? recipientFilter : undefined,
      recipientCount,
    } as any,
  });

  revalidatePath("/email");
  return { success: true, campaign };
}

export async function sendCampaign(campaignId: string) {
  const { db } = await getTenantPrisma();

  const campaign = await db.emailCampaign.findUnique({ where: { id: campaignId } });
  if (!campaign) return { error: "Campaign not found" };

  // Mark as sent (in production this would queue actual email delivery)
  const updated = await db.emailCampaign.update({
    where: { id: campaignId },
    data: {
      status: "SENT",
      sentAt: new Date(),
      sentCount: campaign.recipientCount,
    },
  });

  await logActivity({
    type: "campaign_sent",
    description: `Sent email campaign "${campaign.subject}" to ${campaign.recipientCount} recipients`,
    metadata: { campaignId, recipientCount: campaign.recipientCount },
  });

  revalidatePath("/email");
  return { success: true, campaign: updated };
}

export async function deleteCampaign(campaignId: string) {
  const { db } = await getTenantPrisma();
  await db.emailCampaign.delete({ where: { id: campaignId } });
  revalidatePath("/email");
  return { success: true };
}
