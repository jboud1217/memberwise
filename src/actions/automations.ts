"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { tenantPrisma } from "@/lib/prisma-tenant";
import { revalidatePath } from "next/cache";
import { logActivity } from "./activity";

async function getTenantPrisma() {
  const session = await auth();
  if (!session?.user?.organizationId) throw new Error("Not authenticated");
  return { db: tenantPrisma(prisma, session.user.organizationId), orgId: session.user.organizationId };
}

// ─── Templates ────────────────────────────────────────

export const AUTOMATION_TEMPLATES = [
  {
    id: "welcome-series",
    name: "Welcome Series",
    description: "Send a welcome email when a new member joins, then follow up after 3 days",
    trigger: "MEMBER_JOINED" as const,
    steps: [
      { action: "SEND_EMAIL" as const, config: { subject: "Welcome to {{orgName}}!", body: "<h2>Welcome!</h2><p>We're thrilled to have you as a member. Here's what you need to know to get started...</p>", delayMinutes: 0 } },
      { action: "WAIT" as const, config: { delayMinutes: 4320 } }, // 3 days
      { action: "SEND_EMAIL" as const, config: { subject: "How's it going?", body: "<h2>Checking In</h2><p>You've been a member for a few days now. Have you had a chance to explore everything we offer?</p>", delayMinutes: 0 } },
    ],
  },
  {
    id: "renewal-reminder",
    name: "Renewal Reminders",
    description: "Send reminders at 30, 14, and 7 days before membership expires",
    trigger: "RENEWAL_DUE" as const,
    triggerConfig: { daysBeforeRenewal: 30 },
    steps: [
      { action: "SEND_EMAIL" as const, config: { subject: "Your membership renews in 30 days", body: "<h2>Renewal Coming Up</h2><p>Your membership will expire in 30 days. Renew now to keep your benefits active.</p>", delayMinutes: 0 } },
      { action: "WAIT" as const, config: { delayMinutes: 23040 } }, // 16 days
      { action: "SEND_EMAIL" as const, config: { subject: "14 days until your membership expires", body: "<h2>Don't Lose Your Benefits</h2><p>Your membership expires in just 2 weeks. Renew today to avoid any interruption.</p>", delayMinutes: 0 } },
      { action: "WAIT" as const, config: { delayMinutes: 10080 } }, // 7 days
      { action: "SEND_EMAIL" as const, config: { subject: "Last chance: Membership expires in 7 days", body: "<h2>Final Reminder</h2><p>Your membership expires next week. Renew now to stay connected.</p>", delayMinutes: 0 } },
    ],
  },
  {
    id: "lapsed-reengagement",
    name: "Lapsed Re-engagement",
    description: "When a member lapses, send a series of win-back emails",
    trigger: "MEMBER_LAPSED" as const,
    steps: [
      { action: "SEND_EMAIL" as const, config: { subject: "We miss you!", body: "<h2>We Miss You!</h2><p>Your membership has lapsed. We'd love to have you back — here's what you've been missing.</p>", delayMinutes: 0 } },
      { action: "WAIT" as const, config: { delayMinutes: 10080 } }, // 7 days
      { action: "SEND_EMAIL" as const, config: { subject: "Come back — here's what's new", body: "<h2>What's New</h2><p>A lot has happened since you left. Here's a quick update on what you're missing out on.</p>", delayMinutes: 0 } },
      { action: "WAIT" as const, config: { delayMinutes: 20160 } }, // 14 days
      { action: "NOTIFY_ADMIN" as const, config: { message: "Lapsed member has not renewed after re-engagement sequence" } },
    ],
  },
  {
    id: "payment-thank-you",
    name: "Payment Thank You",
    description: "Send a thank-you email when a payment is received",
    trigger: "PAYMENT_RECEIVED" as const,
    steps: [
      { action: "SEND_EMAIL" as const, config: { subject: "Thank you for your payment!", body: "<h2>Payment Received</h2><p>Thank you for your payment. Your support helps us continue serving our community.</p>", delayMinutes: 0 } },
    ],
  },
] as const;

// ─── CRUD ─────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function automationModel(db: any) { return db.automation; }
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function automationStepModel(db: any) { return db.automationStep; }

export async function getAutomations() {
  const { db } = await getTenantPrisma();
  return automationModel(db).findMany({
    include: {
      steps: { orderBy: { sortOrder: "asc" } },
      _count: { select: { runs: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function getAutomation(id: string) {
  const { db } = await getTenantPrisma();
  return automationModel(db).findUnique({
    where: { id },
    include: {
      steps: { orderBy: { sortOrder: "asc" } },
      runs: {
        orderBy: { startedAt: "desc" },
        take: 20,
      },
    },
  });
}

export async function createAutomation(data: {
  name: string;
  description?: string;
  trigger: string;
  triggerConfig?: Record<string, unknown>;
  steps: { action: string; config: Record<string, unknown> }[];
}): Promise<{ success: true; id: string } | { error: string }> {
  if (!data.name) return { error: "Name is required" };
  if (!data.trigger) return { error: "Trigger is required" };

  const { db } = await getTenantPrisma();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const automation = await automationModel(db).create({
    data: {
      name: data.name,
      description: data.description,
      trigger: data.trigger as any,
      triggerConfig: data.triggerConfig as any,
      status: "DRAFT",
      steps: {
        create: data.steps.map((step, i) => ({
          action: step.action as any,
          config: step.config as any,
          sortOrder: i,
        })),
      },
    } as any,
  });

  revalidatePath("/automations");
  return { success: true, id: automation.id };
}

export async function createFromTemplate(templateId: string): Promise<{ success: true; id: string } | { error: string }> {
  const template = AUTOMATION_TEMPLATES.find((t) => t.id === templateId);
  if (!template) return { error: "Template not found" };

  return createAutomation({
    name: template.name,
    description: template.description,
    trigger: template.trigger,
    triggerConfig: "triggerConfig" in template ? (template.triggerConfig as Record<string, unknown>) : undefined,
    steps: template.steps.map((s) => ({ action: s.action, config: { ...s.config } })),
  });
}

export async function updateAutomationStatus(
  id: string,
  status: "ACTIVE" | "PAUSED" | "DRAFT"
): Promise<{ success: true } | { error: string }> {
  const { db } = await getTenantPrisma();

  const automation = await automationModel(db).findUnique({ where: { id }, include: { steps: true } });
  if (!automation) return { error: "Automation not found" };

  if (status === "ACTIVE" && automation.steps.length === 0) {
    return { error: "Cannot activate an automation with no steps" };
  }

  await automationModel(db).update({
    where: { id },
    data: { status },
  });

  await logActivity({
    type: "automation_updated",
    description: `${status === "ACTIVE" ? "Activated" : status === "PAUSED" ? "Paused" : "Set to draft"} automation "${automation.name}"`,
    metadata: { automationId: id, status },
  });

  revalidatePath("/automations");
  return { success: true };
}

export async function deleteAutomation(id: string): Promise<{ success: true }> {
  const { db } = await getTenantPrisma();
  await automationModel(db).delete({ where: { id } });
  revalidatePath("/automations");
  return { success: true };
}

export async function updateAutomationSteps(
  automationId: string,
  steps: { action: string; config: Record<string, unknown> }[]
): Promise<{ success: true } | { error: string }> {
  const { db } = await getTenantPrisma();

  const automation = await automationModel(db).findUnique({ where: { id: automationId } });
  if (!automation) return { error: "Automation not found" };

  // Delete existing steps and recreate
  // AutomationStep doesn't have organizationId — use prisma directly
  await prisma.automationStep.deleteMany({ where: { automationId } });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await Promise.all(
    steps.map((step, i) =>
      prisma.automationStep.create({
        data: {
          automationId,
          action: step.action as any,
          config: step.config as any,
          sortOrder: i,
        } as any,
      })
    )
  );

  revalidatePath("/automations");
  revalidatePath(`/automations/${automationId}`);
  return { success: true };
}
