"use server";

import { randomBytes } from "crypto";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { Resend } from "resend";

export async function requestPasswordReset(email: string) {
  // Always return success to prevent email enumeration
  const successResponse = { success: true as const };

  if (!email || typeof email !== "string") return successResponse;

  const user = await prisma.user.findFirst({
    where: { email: email.toLowerCase() },
    include: { organization: { select: { name: true } } },
  });

  if (!user) return successResponse;

  // Generate a secure token
  const token = randomBytes(32).toString("hex");
  const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

  // Delete any existing tokens for this email
  await prisma.verificationToken.deleteMany({
    where: { identifier: email.toLowerCase() },
  });

  // Store the token
  await prisma.verificationToken.create({
    data: {
      identifier: email.toLowerCase(),
      token,
      expires,
    },
  });

  // Send email
  const resetUrl = `${process.env.AUTH_URL || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/reset-password?token=${token}&email=${encodeURIComponent(email.toLowerCase())}`;

  try {
    if (process.env.RESEND_API_KEY) {
      const resend = new Resend(process.env.RESEND_API_KEY);
      await resend.emails.send({
        from: process.env.EMAIL_FROM || "MemberWise <noreply@memberwise.app>",
        to: [email.toLowerCase()],
        subject: "Reset your password — MemberWise",
        html: `
          <div style="font-family: system-ui, -apple-system, sans-serif; max-width: 480px; margin: 0 auto; padding: 40px 24px;">
            <div style="text-align: center; margin-bottom: 32px;">
              <div style="display: inline-flex; align-items: center; justify-content: center; width: 48px; height: 48px; background: linear-gradient(135deg, #6366f1, #a855f7); border-radius: 12px;">
                <span style="color: white; font-weight: bold; font-size: 20px;">M</span>
              </div>
            </div>
            <h2 style="color: #111827; font-size: 20px; font-weight: 600; margin: 0 0 8px;">Reset your password</h2>
            <p style="color: #6b7280; font-size: 14px; line-height: 1.6; margin: 0 0 24px;">
              We received a request to reset your password for your MemberWise account${user.organization ? ` (${user.organization.name})` : ""}. Click the button below to set a new password.
            </p>
            <a href="${resetUrl}" style="display: inline-block; background: linear-gradient(135deg, #6366f1, #a855f7); color: white; text-decoration: none; padding: 12px 32px; border-radius: 10px; font-size: 14px; font-weight: 500;">
              Reset Password
            </a>
            <p style="color: #9ca3af; font-size: 12px; line-height: 1.6; margin: 24px 0 0;">
              This link expires in 1 hour. If you didn't request this, you can safely ignore this email.
            </p>
            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 32px 0 16px;" />
            <p style="color: #d1d5db; font-size: 11px; margin: 0;">MemberWise</p>
          </div>
        `,
      });
    } else {
      console.warn("RESEND_API_KEY not set — password reset email not sent. Token:", token);
    }
  } catch (err) {
    console.error("Failed to send password reset email:", err);
  }

  return successResponse;
}

export async function resetPassword(token: string, email: string, newPassword: string) {
  if (!token || !email || !newPassword) {
    return { error: "Missing required fields" };
  }

  if (newPassword.length < 8) {
    return { error: "Password must be at least 8 characters" };
  }

  // Find the verification token
  const verificationToken = await prisma.verificationToken.findFirst({
    where: {
      identifier: email.toLowerCase(),
      token,
      expires: { gt: new Date() },
    },
  });

  if (!verificationToken) {
    return { error: "Invalid or expired reset link. Please request a new one." };
  }

  // Find the user
  const user = await prisma.user.findFirst({
    where: { email: email.toLowerCase() },
  });

  if (!user) {
    return { error: "User not found" };
  }

  // Hash the new password and update
  const hashedPassword = await bcrypt.hash(newPassword, 12);

  await prisma.user.update({
    where: { id: user.id },
    data: { hashedPassword },
  });

  // Delete the used token
  await prisma.verificationToken.delete({
    where: {
      identifier_token: {
        identifier: email.toLowerCase(),
        token,
      },
    },
  });

  return { success: true as const };
}
