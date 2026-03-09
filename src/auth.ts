import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { authConfig } from "./auth.config";

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
        organizationSlug: { label: "Organization", type: "text" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const email = credentials.email as string;
        const password = credentials.password as string;
        const slug = credentials.organizationSlug as string;

        // Find the organization
        const org = await prisma.organization.findUnique({
          where: { slug },
        });
        if (!org) return null;

        // Find the user in this organization
        const user = await prisma.user.findUnique({
          where: {
            email_organizationId: {
              email,
              organizationId: org.id,
            },
          },
        });

        if (!user || !user.hashedPassword) return null;

        const passwordMatch = await bcrypt.compare(password, user.hashedPassword);
        if (!passwordMatch) return null;

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          organizationId: org.id,
          organizationSlug: org.slug,
        };
      },
    }),
  ],
  session: {
    strategy: "jwt",
  },
});
