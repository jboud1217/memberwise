"use server";

import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { registerSchema, type RegisterInput } from "@/lib/validators/auth";
import { signIn } from "@/auth";

export async function register(data: RegisterInput) {
  const validated = registerSchema.safeParse(data);
  if (!validated.success) {
    return { error: validated.error.issues[0].message };
  }

  const { organizationName, slug, name, email, password } = validated.data;

  // Check if slug is taken
  const existingOrg = await prisma.organization.findUnique({
    where: { slug },
  });
  if (existingOrg) {
    return { error: "This organization URL is already taken" };
  }

  // Create organization and owner user
  const hashedPassword = await bcrypt.hash(password, 12);

  const org = await prisma.organization.create({
    data: {
      name: organizationName,
      slug,
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

  // Auto sign-in
  await signIn("credentials", {
    email,
    password,
    organizationSlug: slug,
    redirect: false,
  });

  return { success: true, slug };
}
