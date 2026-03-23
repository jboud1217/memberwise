/**
 * Validates required environment variables at startup.
 * Import this module early (e.g. in instrumentation.ts or root layout)
 * to fail fast if configuration is missing.
 */

function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function optional(name: string, fallback?: string): string | undefined {
  return process.env[name] || fallback;
}

export const env = {
  // Database
  DATABASE_URL: required("DATABASE_URL"),

  // Auth
  NEXTAUTH_SECRET: required("NEXTAUTH_SECRET"),
  NEXTAUTH_URL: optional("NEXTAUTH_URL", "http://localhost:3000"),

  // Stripe (required for billing)
  STRIPE_SECRET_KEY: optional("STRIPE_SECRET_KEY"),
  STRIPE_WEBHOOK_SECRET: optional("STRIPE_WEBHOOK_SECRET"),

  // Email (at least one provider needed for campaigns)
  RESEND_API_KEY: optional("RESEND_API_KEY"),
  EMAIL_FROM: optional("EMAIL_FROM", "MemberWise <noreply@memberwise.app>"),

  // AI
  ANTHROPIC_API_KEY: optional("ANTHROPIC_API_KEY"),

  // AWS / S3
  AWS_ACCESS_KEY_ID: optional("AWS_ACCESS_KEY_ID"),
  AWS_SECRET_ACCESS_KEY: optional("AWS_SECRET_ACCESS_KEY"),
  AWS_REGION: optional("AWS_REGION", "us-east-1"),
  S3_BUCKET_NAME: optional("S3_BUCKET_NAME", "memberwise-assets"),
  S3_CDN_URL: optional("S3_CDN_URL"),

  // App
  NEXT_PUBLIC_APP_URL: optional("NEXT_PUBLIC_APP_URL"),
} as const;
