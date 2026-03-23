"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { tenantPrisma } from "@/lib/prisma-tenant";
import {
  chatWithAI,
  generateEmailDraft,
  generateEventDescription,
  generateInsights,
  generateEngagementPlan,
  type AIMessage,
  type AIContext,
  type AICapability,
} from "@/lib/ai";

async function getAIContext(): Promise<AIContext> {
  const session = await auth();
  if (!session?.user?.organizationId) throw new Error("Not authenticated");
  const orgId = session.user.organizationId;
  const db = tenantPrisma(prisma, orgId);

  try {
    const [org, memberStats, tiers, revenueAgg, upcomingEvents, recentCampaigns] =
      await Promise.all([
        prisma.organization.findUnique({
          where: { id: orgId },
          select: { name: true },
        }),
        prisma.member.groupBy({
          by: ["status"],
          where: { organizationId: orgId },
          _count: { _all: true },
        }),
        db.membershipTier.findMany({
          where: { isActive: true },
          select: { name: true },
          orderBy: { sortOrder: "asc" },
        }),
        db.payment.aggregate({
          where: {
            status: "COMPLETED",
            paidAt: { gte: new Date(new Date().getFullYear(), 0, 1) },
          },
          _sum: { amount: true },
        }),
        db.event.findMany({
          where: { startDate: { gte: new Date() }, status: "PUBLISHED" },
          select: {
            title: true,
            startDate: true,
            registrationCount: true,
            capacity: true,
          },
          orderBy: { startDate: "asc" },
          take: 5,
        }),
        db.emailCampaign.findMany({
          orderBy: { createdAt: "desc" },
          take: 5,
          select: {
            subject: true,
            status: true,
            sentCount: true,
            openedCount: true,
          },
        }),
      ]);

    const statusMap: Record<string, number> = {};
    for (const s of memberStats) statusMap[s.status] = s._count._all;
    const totalMembers = Object.values(statusMap).reduce((a, b) => a + b, 0);

    return {
      organizationName: org?.name || "Organization",
      organizationId: orgId,
      memberCount: totalMembers,
      activeMemberCount: statusMap["ACTIVE"] || 0,
      lapsedCount: statusMap["LAPSED"] || 0,
      tierNames: tiers.map((t) => t.name),
      revenueYTD: revenueAgg._sum.amount || 0,
      upcomingEvents: upcomingEvents.map((e) => ({
        title: e.title,
        date: e.startDate.toISOString().split("T")[0],
        registrations: e.registrationCount,
        capacity: e.capacity,
      })),
      recentCampaigns: recentCampaigns.map((c) => ({
        subject: c.subject,
        status: c.status,
        sentCount: c.sentCount,
        openedCount: c.openedCount,
      })),
    };
  } catch (error) {
    // Return minimal context if data fetching fails
    return {
      organizationName: "Organization",
      organizationId: orgId,
    };
  }
}

// ─── Chat ─────────────────────────────────────────────

export async function aiChat(messages: AIMessage[], capability?: AICapability) {
  const context = await getAIContext();
  const response = await chatWithAI(messages, context, capability);
  return { response };
}

// ─── Quick Actions ────────────────────────────────────

export async function aiDraftEmail(purpose: string, audience?: string) {
  const context = await getAIContext();
  return generateEmailDraft(context, purpose, audience);
}

export async function aiEventDescription(details: {
  title: string;
  date: string;
  format: string;
  notes?: string;
}) {
  const context = await getAIContext();
  return generateEventDescription(context, details);
}

export async function aiInsights() {
  const context = await getAIContext();
  const insights = await generateInsights(context);
  return { insights };
}

export async function aiEngagementPlan(focus?: "retention" | "growth" | "lapsed" | "general") {
  const context = await getAIContext();
  const plan = await generateEngagementPlan(context, focus);
  return { plan };
}

// ─── Visual Editor AI Agent ─────────────────────────

export interface AIEditOperation {
  op: "update" | "add" | "remove";
  sectionId?: string;
  position?: number;
  props?: Record<string, unknown>;
  style?: Record<string, unknown>;
  section?: {
    type: string;
    props: Record<string, unknown>;
    style?: Record<string, unknown>;
  };
}

export interface AIEditResult {
  message: string;
  operations: AIEditOperation[];
}

const SECTION_TYPES_LIST = [
  "hero", "features", "cta", "testimonials", "stats", "contact-form",
  "events-list", "directory-grid", "faq", "gallery", "rich-text",
  "image-banner", "video-embed", "custom-html", "cards", "pricing",
  "team", "logo-cloud", "timeline", "newsletter-signup", "countdown",
  "social-links", "spacer", "divider",
].join(", ");

export async function aiVisualEdit(
  sections: Array<{ id: string; type: string; props: Record<string, unknown>; style?: object }>,
  prompt: string,
  focusSectionId?: string
): Promise<{ result: AIEditResult } | { error: string }> {
  const context = await getAIContext();

  const focusHint = focusSectionId
    ? `\nThe user has selected section "${focusSectionId}" — focus your changes on that section unless the request clearly applies to the whole page.`
    : "";

  const systemPrompt = `You are an AI website editor. You modify website sections based on user requests.
You receive the current page structure and return a JSON response with operations.

Available section types: ${SECTION_TYPES_LIST}

Common section props by type:
- hero: heading, subheading, ctaText, ctaLink, backgroundImage, size (small/medium/large)
- features: heading, items (array of {title, description, icon})
- cta: heading, description, ctaText, ctaLink, variant (centered/split/banner)
- testimonials: heading, items (array of {quote, author, role, avatar})
- stats: heading, subheading, items (array of {value, label})
- faq: heading, description, items (array of {question, answer})
- pricing: heading, subheading, items (array of {name, price, period, features, ctaText, highlighted})
- team: heading, subheading, members (array of {name, role, bio, image})
- cards: heading, subheading, items (array of {title, description, image, link})
- rich-text: heading, content (HTML string)
- image-banner: heading, subheading, image, overlay (true/false)
- gallery: heading, images (array of {src, alt, caption})
- newsletter-signup: heading, description, buttonText
- countdown: heading, subheading, targetDate
- contact-form: heading, description, fields
- logo-cloud: heading, subheading, logos (array of {name, image})
- timeline: heading, subheading, items (array of {year, title, description})

Style properties: backgroundColor, textColor, padding ({top, bottom} with values like "2rem", "4rem", "6rem"), backgroundGradient ({type, angle, stops}), animation, boxShadow, borderRadius, maxWidth

Organization: ${context.organizationName}${focusHint}

RESPOND WITH ONLY THIS JSON (no markdown, no explanation outside the JSON):
{
  "message": "Brief 1-2 sentence description of what was changed",
  "operations": [
    { "op": "update", "sectionId": "section-id", "props": {only changed fields}, "style": {only changed fields} },
    { "op": "add", "position": 2, "section": { "type": "sectionType", "props": {...all required props}, "style": {...} } },
    { "op": "remove", "sectionId": "section-id" }
  ]
}

Rules:
- For "update" ops, only include fields that actually changed
- For "add" ops, include ALL required props for the section type with compelling content
- Generate professional, engaging content tailored to membership organizations
- Make IDs for new sections follow the pattern: "type-timestamp" (use a realistic timestamp)
- Keep operation count reasonable — avoid unnecessary changes`;

  const userMessage = `Current page sections:\n${JSON.stringify(sections.map(s => ({ id: s.id, type: s.type, props: s.props, style: s.style || {} })), null, 2)}\n\nRequest: ${prompt}`;

  try {
    const response = await chatWithAI(
      [{ role: "user", content: userMessage }],
      context,
      "website-edit"
    );

    const cleaned = response.replace(/^```(?:json)?\n?/gm, "").replace(/\n?```$/gm, "").trim();
    const result: AIEditResult = JSON.parse(cleaned);

    if (!result.message || !Array.isArray(result.operations)) {
      return { error: "Invalid AI response format. Please try again." };
    }

    return { result };
  } catch {
    return { error: "Failed to process AI response. Please try again." };
  }
}

// ─── Section Content Generation ──────────────────────

export async function aiGenerateSectionContent(
  sectionType: string,
  currentProps: Record<string, unknown>,
  prompt?: string
) {
  const context = await getAIContext();
  const userPrompt = prompt
    ? `Generate content for a "${sectionType}" website section. User request: ${prompt}\n\nCurrent section props for reference:\n${JSON.stringify(currentProps, null, 2)}\n\nReturn ONLY valid JSON matching the same structure as the current props. Improve the content based on the user's request. Do not wrap in markdown code blocks.`
    : `Generate compelling, professional content for a "${sectionType}" website section for the organization "${context.organizationName}". Current content:\n${JSON.stringify(currentProps, null, 2)}\n\nReturn ONLY valid JSON matching the same structure. Replace placeholder or generic text with engaging, specific content tailored to a membership organization. Keep the same keys and structure. Do not wrap in markdown code blocks.`;

  const response = await chatWithAI(
    [{ role: "user", content: userPrompt }],
    context,
    "website-edit"
  );

  // Parse the JSON response
  try {
    // Strip markdown code fences if present
    const cleaned = response.replace(/^```(?:json)?\n?/gm, "").replace(/\n?```$/gm, "").trim();
    return { props: JSON.parse(cleaned) };
  } catch {
    return { error: "Failed to parse AI response. Please try again." };
  }
}
