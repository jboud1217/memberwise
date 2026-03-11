"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export interface OnboardingInput {
  organizationType: string;
  approximateMemberCount: string;
  priorityFeatures: string[];
  dataSource: string;
  spreadsheetFields?: string[];
  theme: string;
  layoutTemplate: string;
  completedAt: string;
}

export async function saveOnboardingData(data: OnboardingInput) {
  const session = await auth();
  if (!session?.user?.organizationId) throw new Error("Not authenticated");

  await prisma.organization.update({
    where: { id: session.user.organizationId },
    data: {
      onboardingCompleted: true,
      onboardingData: JSON.parse(JSON.stringify(data)),
      theme: data.theme,
      layoutTemplate: data.layoutTemplate,
    },
  });

  revalidatePath("/dashboard");
  return { success: true };
}

export async function updateTheme(themeId: string) {
  const session = await auth();
  if (!session?.user?.organizationId) throw new Error("Not authenticated");

  await prisma.organization.update({
    where: { id: session.user.organizationId },
    data: { theme: themeId },
  });

  revalidatePath("/portal");
  revalidatePath("/settings");
  revalidatePath("/settings/theme");
  return { success: true };
}

export async function updateLayoutTemplate(templateId: string) {
  const session = await auth();
  if (!session?.user?.organizationId) throw new Error("Not authenticated");

  await prisma.organization.update({
    where: { id: session.user.organizationId },
    data: { layoutTemplate: templateId },
  });

  revalidatePath("/portal");
  revalidatePath("/settings");
  revalidatePath("/settings/template");
  return { success: true };
}
