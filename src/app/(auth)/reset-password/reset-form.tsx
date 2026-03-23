"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { resetPassword } from "@/actions/password-reset";
import { ArrowLeft, CheckCircle2 } from "lucide-react";

export default function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const email = searchParams.get("email");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  if (!token || !email) {
    return (
      <div className="space-y-6 animate-fade-in-up">
        <div className="lg:hidden flex items-center gap-2.5 justify-center">
          <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-[0_2px_8px_rgba(99,102,241,0.3)]">
            <span className="text-base font-bold text-white">M</span>
          </div>
          <span className="text-lg font-semibold tracking-tight">MemberWise</span>
        </div>
        <div>
          <h2 className="text-xl font-semibold tracking-tight">Invalid reset link</h2>
          <p className="mt-1.5 text-sm text-[var(--muted-foreground)]">
            This password reset link is invalid or has expired. Please request a new one.
          </p>
        </div>
        <Link href="/forgot-password">
          <Button className="w-full h-11 rounded-xl text-sm bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700">
            Request New Link
          </Button>
        </Link>
      </div>
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

    setLoading(true);
    const result = await resetPassword(token!, email!, password);
    setLoading(false);

    if ("error" in result) {
      setError(result.error ?? "An unknown error occurred");
    } else {
      setSuccess(true);
      setTimeout(() => router.push("/login"), 3000);
    }
  }

  if (success) {
    return (
      <div className="space-y-6 animate-fade-in-up">
        <div className="lg:hidden flex items-center gap-2.5 justify-center">
          <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-[0_2px_8px_rgba(99,102,241,0.3)]">
            <span className="text-base font-bold text-white">M</span>
          </div>
          <span className="text-lg font-semibold tracking-tight">MemberWise</span>
        </div>
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 border border-emerald-100">
          <CheckCircle2 className="h-6 w-6 text-emerald-600" />
        </div>
        <div>
          <h2 className="text-xl font-semibold tracking-tight">Password reset!</h2>
          <p className="mt-1.5 text-sm text-[var(--muted-foreground)]">
            Your password has been updated. Redirecting you to sign in...
          </p>
        </div>
        <Link href="/login">
          <Button variant="outline" className="w-full h-11 rounded-xl text-sm gap-2">
            <ArrowLeft className="h-3.5 w-3.5" />
            Sign in now
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="lg:hidden flex items-center gap-2.5 justify-center">
        <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-[0_2px_8px_rgba(99,102,241,0.3)]">
          <span className="text-base font-bold text-white">M</span>
        </div>
        <span className="text-lg font-semibold tracking-tight">MemberWise</span>
      </div>

      <div>
        <h2 className="text-xl font-semibold tracking-tight">Set new password</h2>
        <p className="mt-1 text-sm text-[var(--muted-foreground)]">
          Choose a new password for your account
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {error && (
          <div className="rounded-xl bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-600 flex items-start gap-2.5">
            <div className="h-5 w-5 rounded-full bg-red-100 flex items-center justify-center shrink-0 mt-px">
              <span className="text-xs font-bold">!</span>
            </div>
            {error}
          </div>
        )}

        <div className="space-y-1.5">
          <Label htmlFor="password" className="text-sm font-medium">New password</Label>
          <Input
            id="password"
            type="password"
            className="h-11"
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <p className="text-xs text-[var(--muted-foreground)]">Must be at least 8 characters</p>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="confirm" className="text-sm font-medium">Confirm password</Label>
          <Input
            id="confirm"
            type="password"
            className="h-11"
            required
            minLength={8}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
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
              Resetting...
            </>
          ) : (
            "Reset Password"
          )}
        </Button>
      </form>
    </div>
  );
}
