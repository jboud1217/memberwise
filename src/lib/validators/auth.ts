import { z } from "zod";

export const registerSchema = z.object({
  organizationName: z.string().min(4, "Organization name must be at least 4 characters"),
  slug: z
    .string()
    .min(3, "Slug must be at least 3 characters")
    .max(50)
    .regex(/^[a-z0-9-]+$/, "Only lowercase letters, numbers, and hyphens"),
  domainType: z.enum(["subdomain", "custom"]),
  customDomain: z
    .string()
    .optional()
    .refine(
      (val) => !val || /^([a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$/.test(val),
      "Enter a valid domain (e.g. members.yourorg.com)"
    ),
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters"),
}).refine(
  (data) => data.domainType === "subdomain" || (data.domainType === "custom" && data.customDomain),
  { message: "Please enter your domain", path: ["customDomain"] }
);

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
  organizationSlug: z.string().min(1, "Organization is required"),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
