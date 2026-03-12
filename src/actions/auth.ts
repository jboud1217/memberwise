"use server";

import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { registerSchema, type RegisterInput } from "@/lib/validators/auth";

export async function register(data: RegisterInput) {
  const validated = registerSchema.safeParse(data);
  if (!validated.success) {
    return { error: validated.error.issues[0].message };
  }

  const { organizationName, slug, name, email, password, domainType, customDomain } = validated.data;

  // Check if slug is taken
  const existingOrg = await prisma.organization.findUnique({
    where: { slug },
  });
  if (existingOrg) {
    return { error: "This organization URL is already taken" };
  }

  // If custom domain, check it's not already used
  if (domainType === "custom" && customDomain) {
    const existingDomain = await prisma.organization.findFirst({
      where: { customDomain: customDomain.toLowerCase() },
    });
    if (existingDomain) {
      return { error: "This domain is already in use by another organization" };
    }
  }

  // Create organization and owner user
  const hashedPassword = await bcrypt.hash(password, 12);

  const org = await prisma.organization.create({
    data: {
      name: organizationName,
      slug,
      ...(domainType === "custom" && customDomain
        ? {
            customDomain: customDomain.toLowerCase(),
            domainVerified: false,
          }
        : {}),
      users: {
        create: {
          name,
          email,
          hashedPassword,
          role: "OWNER",
        },
      },
    },
  });

  return { success: true, slug };
}
