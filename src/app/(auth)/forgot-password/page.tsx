"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { requestPasswordReset } from "@/actions/password-reset";
import { ArrowLeft, Mail } from "lucide-react";

export default function ForgotPasswordPage() {
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    await requestPasswordReset(email);
    setLoading(false);
    setSubmitted(true);
  }

  return (
    <div className="space-y-6">
      <div className="lg:hidden flex items-center gap-2.5 justify-center">
        <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-[0_2px_8px_rgba(99,102,241,0.3)]">
          <span className="text-base font-bold text-white">M</span>
        </div>
        <span className="text-lg font-semibold tracking-tight">MemberWise</span>
      </div>

      {submitted ? (
        <div className="space-y-5 animate-fade-in-up">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 border border-emerald-100">
            <Mail className="h-6 w-6 text-emerald-600" />
          </div>
          <div>
            <h2 className="text-xl font-semibold tracking-tight">Check your email</h2>
            <p className="mt-1.5 text-sm text-[var(--muted-foreground)] leading-relaxed">
              If an account exists for <strong className="text-[var(--foreground)]">{email}</strong>, we&apos;ve sent a password reset link. It expires in 1 hour.
            </p>
          </div>
          <div className="space-y-3 pt-2">
            <Button
              variant="outline"
              className="w-full h-11 rounded-xl text-sm"
              onClick={() => { setSubmitted(false); setEmail(""); }}
            >
              Try a different email
            </Button>
            <Link
              href="/login"
              className="flex items-center justify-center gap-2 text-sm text-[var(--primary)] font-medium hover:underline"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Back to sign in
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-6 animate-fade-in-up">
          <div>
            <h2 className="text-xl font-semibold tracking-tight">Reset your password</h2>
            <p className="mt-1 text-sm text-[var(--muted-foreground)]">
              Enter your email and we&apos;ll send you a reset link
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-sm font-medium">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="jane@example.com"
                className="h-11"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <Button
              type="submit"
              className="w-full h-11 gap-2 rounded-xl text-sm bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 shadow-[0_2px_8px_rgba(99,102,241,0.3)] hover:shadow-[0_4px_16px_rgba(99,102,241,0.4)] transition-all duration-200 active:scale-[0.98]"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Spinner className="h-4 w-4" />
                  Sending...
                </>
              ) : (
                "Send Reset Link"
              )}
            </Button>

            <div className="relative pt-2">
              <div className="absolute inset-0 flex items-center pt-2">
                <div className="w-full border-t border-[var(--border)]" />
              </div>
              <div className="relative flex justify-center">
                <Link
                  href="/login"
                  className="bg-[var(--background)] px-3 text-xs text-[var(--muted-foreground)] hover:text-[var(--primary)] transition-colors flex items-center gap-1.5"
                >
                  <ArrowLeft className="h-3 w-3" />
                  Back to sign in
                </Link>
              </div>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
