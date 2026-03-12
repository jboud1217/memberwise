import { z } from "zod";

export const memberSchema = z.object({
  displayName: z.string().min(1, "Name is required"),
  organizationName: z.string().optional(),
  status: z.enum(["ACTIVE", "LAPSED", "SUSPENDED", "PROSPECT", "ARCHIVED"]),
  tierId: z.string().optional(),
  address1: z.string().optional(),
  address2: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zip: z.string().optional(),
  country: z.string().optional(),
  joinDate: z.string().optional(),
  renewalDate: z.string().optional(),
  expirationDate: z.string().optional(),
  memberNumber: z.string().optional(),
  notes: z.string().optional(),
  doNotEmail: z.boolean().optional(),
  doNotMail: z.boolean().optional(),
});

export type MemberInput = z.infer<typeof memberSchema>;

export const contactSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  phone: z.string().optional(),
  mobile: z.string().optional(),
  isPrimary: z.boolean(),
  memberId: z.string().optional(),
});

export type ContactInput = z.infer<typeof contactSchema>;

export const tierSchema = z.object({
  name: z.string().min(1, "Tier name is required"),
  description: z.string().optional(),
  price: z.number().min(0, "Price must be positive"),
  billingInterval: z.enum(["MONTHLY", "QUARTERLY", "SEMI_ANNUAL", "ANNUAL", "TWO_YEAR", "LIFETIME", "ONE_TIME"]),
  benefits: z.array(z.string()),
  isActive: z.boolean(),
  sortOrder: z.number(),
});

export type TierInput = z.infer<typeof tierSchema>;
