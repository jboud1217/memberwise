"use server";

import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

export type InviteDetails = {
  email: string;
  role: string;
  organizationName: string;
  organizationSlug: string;
};

export async function getInviteDetails(
  token: string
): Promise<{ data: InviteDetails } | { error: string }> {
  if (!token) return { error: "Missing invite token" };

  const invite = await prisma.teamInvite.findUnique({
    where: { token },
    include: { organization: { select: { id: true, name: true, slug: true } } },
  });

  if (!invite) return { error: "Invalid invite link" };
  if (invite.expiresAt < new Date()) return { error: "This invite has expired" };

  return {
    data: {
      email: invite.email,
      role: invite.role,
      organizationName: invite.organization.name,
      organizationSlug: invite.organization.slug,
    },
  };
}

export async function acceptInvite(data: {
  token: string;
  name: string;
  password: string;
}) {
  if (!data.token || !data.name || !data.password) {
    return { error: "All fields are required" };
  }

  if (data.password.length < 8) {
    return { error: "Password must be at least 8 characters" };
  }

  const invite = await prisma.teamInvite.findUnique({
    where: { token: data.token },
    include: { organization: { select: { id: true, slug: true } } },
  });

  if (!invite) return { error: "Invalid invite link" };
  if (invite.expiresAt < new Date()) return { error: "This invite has expired" };

  // Check if user already exists in this org
  const existing = await prisma.user.findFirst({
    where: { email: invite.email, organizationId: invite.organizationId },
  });
  if (existing) return { error: "An account with this email already exists" };

  const hashedPassword = await bcrypt.hash(data.password, 12);

  // Create the user and delete the invite
  await prisma.$transaction([
    prisma.user.create({
      data: {
        name: data.name,
        email: invite.email,
        hashedPassword,
        role: invite.role,
        organizationId: invite.organizationId,
      },
    }),
    prisma.teamInvite.delete({ where: { id: invite.id } }),
  ]);

  return { success: true, slug: invite.organization.slug };
}
