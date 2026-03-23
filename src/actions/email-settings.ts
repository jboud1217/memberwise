"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { testEmailConnection, type EmailProvider, type EmailSettings } from "@/lib/email-service";

export async function getEmailSettings() {
  const session = await auth();
  if (!session?.user?.organizationId) throw new Error("Not authenticated");

  const org = await prisma.organization.findUnique({
    where: { id: session.user.organizationId },
    select: {
      emailProvider: true,
      emailSettings: true,
    },
  });

  if (!org) return null;

  const settings = org.emailSettings as EmailSettings | null;

  return {
    provider: org.emailProvider as EmailProvider | null,
    senderEmail: settings?.senderEmail || "",
    senderName: settings?.senderName || "",
    domain: settings?.domain || "",
    region: settings?.region || "",
    // Mask the API key for display
    apiKeySet: !!settings?.apiKey,
    apiKeyPreview: settings?.apiKey
      ? `${settings.apiKey.slice(0, 6)}${"•".repeat(20)}`
      : "",
  };
}

export async function saveEmailSettings(data: {
  provider: EmailProvider;
  apiKey?: string;
  senderEmail: string;
  senderName?: string;
  domain?: string;
  region?: string;
}): Promise<{ success: true } | { error: string }> {
  const session = await auth();
  if (!session?.user?.organizationId) return { error: "Not authenticated" };

  if (!data.provider) return { error: "Provider is required" };
  if (!data.senderEmail) return { error: "Sender email is required" };

  // Get existing settings to preserve API key if not changed
  const existing = await prisma.organization.findUnique({
    where: { id: session.user.organizationId },
    select: { emailSettings: true },
  });
  const existingSettings = existing?.emailSettings as EmailSettings | null;

  const apiKey = data.apiKey || existingSettings?.apiKey;
  if (!apiKey) return { error: "API key is required" };

  const emailSettings: EmailSettings = {
    apiKey,
    senderEmail: data.senderEmail,
    senderName: data.senderName || undefined,
    domain: data.domain || undefined,
    region: data.region || undefined,
  };

  await prisma.organization.update({
    where: { id: session.user.organizationId },
    data: {
      emailProvider: data.provider,
      emailSettings: emailSettings as any, // eslint-disable-line @typescript-eslint/no-explicit-any
    },
  });

  revalidatePath("/settings/email");
  revalidatePath("/email");
  return { success: true };
}

export async function testEmailSettings(): Promise<{ success: true; message: string } | { error: string }> {
  const session = await auth();
  if (!session?.user?.organizationId) return { error: "Not authenticated" };

  const org = await prisma.organization.findUnique({
    where: { id: session.user.organizationId },
    select: { emailProvider: true, emailSettings: true },
  });

  if (!org?.emailProvider || !org.emailSettings) {
    return { error: "Email not configured. Please save your settings first." };
  }

  const provider = org.emailProvider as EmailProvider;
  const settings = org.emailSettings as unknown as EmailSettings;

  const result = await testEmailConnection(provider, settings);

  if (!result.success) {
    return { error: result.error || "Test failed. Check your API key and sender email." };
  }

  return { success: true, message: `Test email sent to ${settings.senderEmail} via ${provider}` };
}

export async function disconnectEmail(): Promise<{ success: true }> {
  const session = await auth();
  if (!session?.user?.organizationId) throw new Error("Not authenticated");

  await prisma.organization.update({
    where: { id: session.user.organizationId },
    data: {
      emailProvider: null,
      emailSettings: undefined,
    },
  });

  revalidatePath("/settings/email");
  revalidatePath("/email");
  return { success: true };
}
