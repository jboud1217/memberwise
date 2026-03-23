import { Resend } from "resend";

// ─── Types ──────────────────────────────────────────

export type EmailProvider = "resend" | "sendgrid" | "mailgun" | "postmark" | "ses";

export interface EmailSettings {
  apiKey: string;
  senderEmail: string;
  senderName?: string;
  region?: string;  // for SES
  domain?: string;  // for Mailgun
}

export interface SendEmailParams {
  to: string | string[];
  subject: string;
  html: string;
  replyTo?: string;
}

interface SendResult {
  success: boolean;
  id?: string;
  error?: string;
}

// ─── Provider Implementations ───────────────────────

async function sendViaResend(settings: EmailSettings, params: SendEmailParams): Promise<SendResult> {
  const resend = new Resend(settings.apiKey);
  const { data, error } = await resend.emails.send({
    from: settings.senderName
      ? `${settings.senderName} <${settings.senderEmail}>`
      : settings.senderEmail,
    to: Array.isArray(params.to) ? params.to : [params.to],
    subject: params.subject,
    html: params.html,
    replyTo: params.replyTo,
  });

  if (error) return { success: false, error: error.message };
  return { success: true, id: data?.id };
}

async function sendViaSendGrid(settings: EmailSettings, params: SendEmailParams): Promise<SendResult> {
  const recipients = Array.isArray(params.to) ? params.to : [params.to];

  const response = await fetch("https://api.sendgrid.com/v3/mail/send", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${settings.apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      personalizations: [{ to: recipients.map((email) => ({ email })) }],
      from: {
        email: settings.senderEmail,
        name: settings.senderName || undefined,
      },
      subject: params.subject,
      content: [{ type: "text/html", value: params.html }],
      reply_to: params.replyTo ? { email: params.replyTo } : undefined,
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    return { success: false, error: `SendGrid error: ${response.status} ${text}` };
  }
  return { success: true, id: response.headers.get("x-message-id") || undefined };
}

async function sendViaMailgun(settings: EmailSettings, params: SendEmailParams): Promise<SendResult> {
  const domain = settings.domain || settings.senderEmail?.split("@")[1];
  if (!domain) {
    return { success: false, error: "Mailgun requires a domain. Set it in email settings or use a valid sender email." };
  }
  const recipients = Array.isArray(params.to) ? params.to.join(",") : params.to;

  const form = new URLSearchParams();
  form.append("from", settings.senderName
    ? `${settings.senderName} <${settings.senderEmail}>`
    : settings.senderEmail);
  form.append("to", recipients);
  form.append("subject", params.subject);
  form.append("html", params.html);
  if (params.replyTo) form.append("h:Reply-To", params.replyTo);

  const response = await fetch(`https://api.mailgun.net/v3/${domain}/messages`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`api:${settings.apiKey}`).toString("base64")}`,
    },
    body: form,
  });

  if (!response.ok) {
    const text = await response.text();
    return { success: false, error: `Mailgun error: ${response.status} ${text}` };
  }
  const data = await response.json();
  return { success: true, id: data.id };
}

async function sendViaPostmark(settings: EmailSettings, params: SendEmailParams): Promise<SendResult> {
  const recipients = Array.isArray(params.to) ? params.to.join(",") : params.to;

  const response = await fetch("https://api.postmarkapp.com/email", {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      "X-Postmark-Server-Token": settings.apiKey,
    },
    body: JSON.stringify({
      From: settings.senderName
        ? `${settings.senderName} <${settings.senderEmail}>`
        : settings.senderEmail,
      To: recipients,
      Subject: params.subject,
      HtmlBody: params.html,
      ReplyTo: params.replyTo || undefined,
      MessageStream: "outbound",
    }),
  });

  if (!response.ok) {
    const data = await response.json();
    return { success: false, error: `Postmark error: ${data.Message || response.status}` };
  }
  const data = await response.json();
  return { success: true, id: data.MessageID };
}

async function sendViaSES(settings: EmailSettings, params: SendEmailParams): Promise<SendResult> {
  // AWS SES v2 HTTP API
  const region = settings.region || "us-east-1";
  const recipients = Array.isArray(params.to) ? params.to : [params.to];

  const body = JSON.stringify({
    Content: {
      Simple: {
        Subject: { Data: params.subject },
        Body: { Html: { Data: params.html } },
      },
    },
    Destination: { ToAddresses: recipients },
    FromEmailAddress: settings.senderName
      ? `${settings.senderName} <${settings.senderEmail}>`
      : settings.senderEmail,
    ReplyToAddresses: params.replyTo ? [params.replyTo] : undefined,
  });

  const response = await fetch(`https://email.${region}.amazonaws.com/v2/email/outbound-emails`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      // API key for SES is formatted as "ACCESS_KEY_ID:SECRET_ACCESS_KEY"
      // For simplicity we use the API key as a bearer-like token via IAM
      Authorization: `Bearer ${settings.apiKey}`,
    },
    body,
  });

  if (!response.ok) {
    const text = await response.text();
    return { success: false, error: `SES error: ${response.status} ${text}` };
  }
  const data = await response.json();
  return { success: true, id: data.MessageId };
}

// ─── Main Send Function ─────────────────────────────

export async function sendEmail(
  provider: EmailProvider,
  settings: EmailSettings,
  params: SendEmailParams
): Promise<SendResult> {
  switch (provider) {
    case "resend":
      return sendViaResend(settings, params);
    case "sendgrid":
      return sendViaSendGrid(settings, params);
    case "mailgun":
      return sendViaMailgun(settings, params);
    case "postmark":
      return sendViaPostmark(settings, params);
    case "ses":
      return sendViaSES(settings, params);
    default:
      return { success: false, error: `Unknown email provider: ${provider}` };
  }
}

// ─── Test Connection ────────────────────────────────

export async function testEmailConnection(
  provider: EmailProvider,
  settings: EmailSettings
): Promise<SendResult> {
  return sendEmail(provider, settings, {
    to: settings.senderEmail,
    subject: "Memberwise - Email Configuration Test",
    html: `
      <div style="font-family: system-ui, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px;">
        <h2 style="color: #4f46e5;">Email Connected!</h2>
        <p style="color: #6b7280;">Your ${provider} integration is working correctly. Memberwise can now send campaigns using this configuration.</p>
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;" />
        <p style="font-size: 12px; color: #9ca3af;">This is a test email from Memberwise.</p>
      </div>
    `,
  });
}

// ─── Provider Info ──────────────────────────────────

export const EMAIL_PROVIDERS: {
  id: EmailProvider;
  name: string;
  description: string;
  website: string;
  keyLabel: string;
  keyPlaceholder: string;
  extraFields?: { key: string; label: string; placeholder: string }[];
}[] = [
  {
    id: "resend",
    name: "Resend",
    description: "Modern email API built for developers. Great deliverability, easy setup.",
    website: "https://resend.com",
    keyLabel: "API Key",
    keyPlaceholder: "re_...",
  },
  {
    id: "sendgrid",
    name: "SendGrid",
    description: "Twilio's email platform. Industry standard with robust analytics.",
    website: "https://sendgrid.com",
    keyLabel: "API Key",
    keyPlaceholder: "SG...",
  },
  {
    id: "mailgun",
    name: "Mailgun",
    description: "Powerful email API with excellent deliverability and logs.",
    website: "https://mailgun.com",
    keyLabel: "API Key",
    keyPlaceholder: "key-...",
    extraFields: [
      { key: "domain", label: "Sending Domain", placeholder: "mg.yourdomain.com" },
    ],
  },
  {
    id: "postmark",
    name: "Postmark",
    description: "Fast, reliable transactional email. Best-in-class delivery speed.",
    website: "https://postmarkapp.com",
    keyLabel: "Server Token",
    keyPlaceholder: "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
  },
  {
    id: "ses",
    name: "Amazon SES",
    description: "AWS Simple Email Service. Cost-effective for high volume.",
    website: "https://aws.amazon.com/ses",
    keyLabel: "Access Key",
    keyPlaceholder: "AKIA...",
    extraFields: [
      { key: "region", label: "AWS Region", placeholder: "us-east-1" },
    ],
  },
];
