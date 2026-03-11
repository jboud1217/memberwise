"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema, type LoginInput } from "@/lib/validators/auth";
import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { ArrowRight } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
  });

  async function onSubmit(data: LoginInput) {
    setLoading(true);
    setError(null);

    const result = await signIn("credentials", {
      email: data.email,
      password: data.password,
      organizationSlug: data.organizationSlug,
      redirect: false,
    });

    if (result?.error) {
      setError("Invalid email, password, or organization");
      setLoading(false);
    } else {
      router.push("/dashboard");
    }
  }

  return (
    <div className="space-y-6">
      {/* Mobile logo */}
      <div className="lg:hidden flex items-center gap-2.5 justify-center">
        <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-[0_2px_8px_rgba(99,102,241,0.3)]">
          <span className="text-base font-bold text-white">M</span>
        </div>
        <span className="text-lg font-semibold tracking-tight">MemberWise</span>
      </div>

      {/* Header */}
      <div className="animate-fade-in-up">
        <h2 className="text-xl font-semibold tracking-tight">Welcome back</h2>
        <p className="mt-1 text-sm text-[var(--muted-foreground)]">
          Sign in to your MemberWise account
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 animate-fade-in-up" style={{ animationDelay: "60ms" }}>
        {error && (
          <div className="rounded-xl bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-600 flex items-start gap-2.5">
            <div className="h-5 w-5 rounded-full bg-red-100 flex items-center justify-center shrink-0 mt-px">
              <span className="text-xs font-bold">!</span>
            </div>
            {error}
          </div>
        )}

        <div className="space-y-1.5">
          <Label htmlFor="organizationSlug" className="text-sm font-medium">Organization</Label>
          <Input
            id="organizationSlug"
            placeholder="your-org-slug"
            className="h-11"
            {...register("organizationSlug")}
          />
          {errors.organizationSlug && (
            <p className="text-xs text-red-500 mt-1">{errors.organizationSlug.message}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="email" className="text-sm font-medium">Email</Label>
          <Input id="email" type="email" placeholder="jane@example.com" className="h-11" {...register("email")} />
          {errors.email && (
            <p className="text-xs text-red-500 mt-1">{errors.email.message}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label htmlFor="password" className="text-sm font-medium">Password</Label>
            <Link href="/forgot-password" className="text-xs text-[var(--primary)] hover:underline font-medium">
              Forgot password?
            </Link>
          </div>
          <Input id="password" type="password" className="h-11" {...register("password")} />
          {errors.password && (
            <p className="text-xs text-red-500 mt-1">{errors.password.message}</p>
          )}
        </div>

        <Button type="submit" className="w-full h-11 gap-2 rounded-xl text-sm" disabled={loading}>
          {loading ? (
            <>
              <Spinner className="h-4 w-4" />
              Signing in...
            </>
          ) : (
            <>
              Sign In
              <ArrowRight className="h-4 w-4" />
            </>
          )}
        </Button>

        {/* Divider + sign up link */}
        <div className="relative pt-2">
          <div className="absolute inset-0 flex items-center pt-2">
            <div className="w-full border-t border-[var(--border)]" />
          </div>
          <div className="relative flex justify-center">
            <span className="bg-[var(--background)] px-3 text-xs text-[var(--muted-foreground)]">
              Don&apos;t have an account?{" "}
              <Link href="/register" className="text-[var(--primary)] font-medium hover:underline">
                Create one
              </Link>
            </span>
          </div>
        </div>
      </form>
    </div>
  );
}
