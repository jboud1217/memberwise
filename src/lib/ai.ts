import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export type AICapability =
  | "website-edit"
  | "email-draft"
  | "analytics"
  | "event-planning"
  | "engagement";

export interface AIMessage {
  role: "user" | "assistant";
  content: string;
}

export interface AIContext {
  organizationName: string;
  organizationId: string;
  memberCount?: number;
  activeMemberCount?: number;
  tierNames?: string[];
  upcomingEvents?: { title: string; date: string; registrations: number; capacity: number | null }[];
  recentCampaigns?: { subject: string; status: string; sentCount: number; openedCount: number }[];
  revenueYTD?: number;
  lapsedCount?: number;
}

const SYSTEM_PROMPT = `You are the Memberwise AI Assistant — a helpful, knowledgeable assistant built into a membership management platform. You help organization administrators with:

1. **Website Editing**: Suggest copy, section layouts, and content for their public-facing membership site.
2. **Email Campaigns**: Draft professional email campaigns, newsletters, renewal reminders, and welcome sequences.
3. **Analytics & Insights**: Analyze membership data, identify trends, suggest actions to improve retention and growth.
4. **Event Planning**: Help plan events — suggest agendas, draft event descriptions, recommend pricing strategies, and create promotional content.
5. **Member Engagement**: Recommend strategies to keep members active, suggest outreach for lapsed members, and draft personalized communications.

Guidelines:
- Be concise and actionable. Provide ready-to-use content when possible.
- When drafting content (emails, event descriptions, website copy), write in a professional but warm tone unless told otherwise.
- When analyzing data, highlight the most important insights first and suggest specific next steps.
- Reference the organization's actual data when available (member counts, tiers, events, etc.).
- Format responses with markdown for readability.
- If asked to do something outside your capabilities, explain what you can help with instead.`;

export async function chatWithAI(
  messages: AIMessage[],
  context: AIContext,
  capability?: AICapability
): Promise<string> {
  const contextBlock = buildContextBlock(context, capability);

  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 2048,
    system: `${SYSTEM_PROMPT}\n\n${contextBlock}`,
    messages: messages.map((m) => ({
      role: m.role,
      content: m.content,
    })),
  });

  const textBlock = response.content.find((b) => b.type === "text");
  return textBlock?.text ?? "I wasn't able to generate a response. Please try again.";
}

function buildContextBlock(context: AIContext, capability?: AICapability): string {
  const lines: string[] = [
    `## Organization Context`,
    `- Organization: ${context.organizationName}`,
  ];

  if (context.memberCount !== undefined) {
    lines.push(`- Total members: ${context.memberCount}`);
  }
  if (context.activeMemberCount !== undefined) {
    lines.push(`- Active members: ${context.activeMemberCount}`);
  }
  if (context.lapsedCount !== undefined && context.lapsedCount > 0) {
    lines.push(`- Lapsed members: ${context.lapsedCount}`);
  }
  if (context.tierNames && context.tierNames.length > 0) {
    lines.push(`- Membership tiers: ${context.tierNames.join(", ")}`);
  }
  if (context.revenueYTD !== undefined) {
    lines.push(`- Revenue YTD: $${(context.revenueYTD / 100).toLocaleString()}`);
  }
  if (context.upcomingEvents && context.upcomingEvents.length > 0) {
    lines.push(`- Upcoming events:`);
    for (const e of context.upcomingEvents) {
      lines.push(`  - "${e.title}" on ${e.date} (${e.registrations}${e.capacity ? `/${e.capacity}` : ""} registered)`);
    }
  }
  if (context.recentCampaigns && context.recentCampaigns.length > 0) {
    lines.push(`- Recent email campaigns:`);
    for (const c of context.recentCampaigns) {
      lines.push(`  - "${c.subject}" — ${c.status}, ${c.sentCount} sent, ${c.openedCount} opened`);
    }
  }

  if (capability) {
    lines.push("");
    lines.push(`The user is currently focused on: **${capabilityLabel(capability)}**. Prioritize this area in your response.`);
  }

  return lines.join("\n");
}

function capabilityLabel(cap: AICapability): string {
  switch (cap) {
    case "website-edit": return "Website Editing & Content";
    case "email-draft": return "Email Campaign Drafting";
    case "analytics": return "Analytics & Insights";
    case "event-planning": return "Event Planning & Management";
    case "engagement": return "Member Engagement & Retention";
  }
}

// ─── Quick action generators ─────────────────────────

export async function generateEmailDraft(
  context: AIContext,
  purpose: string,
  audience?: string
): Promise<{ subject: string; body: string }> {
  const prompt = `Draft a professional email for: ${purpose}${audience ? `. Target audience: ${audience}` : ""}.

Return the email in this exact format:
SUBJECT: [subject line]
---
[email body in HTML format suitable for an email campaign, using <p>, <h2>, <strong>, <a> tags]`;

  const response = await chatWithAI(
    [{ role: "user", content: prompt }],
    context,
    "email-draft"
  );

  const subjectMatch = response.match(/SUBJECT:\s*(.+)/);
  const bodyMatch = response.split("---");

  return {
    subject: subjectMatch?.[1]?.trim() || `${purpose}`,
    body: bodyMatch.length > 1 ? bodyMatch.slice(1).join("---").trim() : response,
  };
}

export async function generateEventDescription(
  context: AIContext,
  eventDetails: { title: string; date: string; format: string; notes?: string }
): Promise<{ description: string; agenda?: string }> {
  const prompt = `Create a compelling event description and suggested agenda for:
- Title: "${eventDetails.title}"
- Date: ${eventDetails.date}
- Format: ${eventDetails.format}
${eventDetails.notes ? `- Additional notes: ${eventDetails.notes}` : ""}

Return in this format:
DESCRIPTION:
[2-3 paragraph event description]
---
AGENDA:
[Suggested agenda with times]`;

  const response = await chatWithAI(
    [{ role: "user", content: prompt }],
    context,
    "event-planning"
  );

  const parts = response.split("---");
  const descPart = parts[0]?.replace(/^DESCRIPTION:\s*/i, "").trim() || response;
  const agendaPart = parts[1]?.replace(/^AGENDA:\s*/i, "").trim();

  return { description: descPart, agenda: agendaPart };
}

export async function generateInsights(
  context: AIContext
): Promise<string> {
  const prompt = `Based on the organization data provided in your context, give me 3-5 actionable insights about our membership health, engagement, and growth opportunities. Be specific and data-driven. Format as a bulleted list with bold headers.`;

  return chatWithAI(
    [{ role: "user", content: prompt }],
    context,
    "analytics"
  );
}

export async function generateEngagementPlan(
  context: AIContext,
  focus?: "retention" | "growth" | "lapsed" | "general"
): Promise<string> {
  const focusMap = {
    retention: "improving member retention and reducing churn",
    growth: "growing membership and attracting new members",
    lapsed: "re-engaging lapsed members and winning them back",
    general: "overall member engagement and satisfaction",
  };

  const prompt = `Create a 30-day action plan focused on ${focusMap[focus || "general"]}. Include specific email templates, event ideas, and outreach strategies. Be practical and actionable.`;

  return chatWithAI(
    [{ role: "user", content: prompt }],
    context,
    "engagement"
  );
}
