"use client";

import { Suspense, useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { signIn } from "next-auth/react";
import { getInviteDetails, acceptInvite, type InviteDetails } from "@/actions/accept-invite";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { ArrowRight, CheckCircle2, AlertCircle } from "lucide-react";

interface InviteForm {
  name: string;
  password: string;
  confirmPassword: string;
}

export default function InvitePage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center py-12"><Spinner className="h-6 w-6" /></div>}>
      <InvitePageInner />
    </Suspense>
  );
}

function InvitePageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [invite, setInvite] = useState<InviteDetails | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<InviteForm>();

  const password = watch("password");

  useEffect(() => {
    async function loadInvite() {
      if (!token) {
        setError("Missing invite token. Please check your invite link.");
        setLoading(false);
        return;
      }
      const result = await getInviteDetails(token);
      if ("error" in result) {
        setError(result.error);
      } else {
        setInvite(result.data);
      }
      setLoading(false);
    }
    loadInvite();
  }, [token]);

  async function onSubmit(data: InviteForm) {
    if (data.password !== data.confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    setSubmitting(true);
    setError(null);

    const result = await acceptInvite({
      token,
      name: data.name,
      password: data.password,
    });

    if ("error" in result && result.error) {
      setError(result.error);
      setSubmitting(false);
      return;
    }

    // Auto sign in after accepting
    const signInResult = await signIn("credentials", {
      email: invite!.email,
      password: data.password,
      redirect: false,
    });

    if (signInResult?.error) {
      // Account created but auto-login failed — redirect to login
      router.push("/login");
    } else {
      router.push("/dashboard");
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner className="h-6 w-6" />
      </div>
    );
  }

  if (error && !invite) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3 text-red-600">
          <AlertCircle className="h-5 w-5" />
          <h2 className="text-xl font-semibold tracking-tight">Invalid Invite</h2>
        </div>
        <p className="text-sm text-[var(--muted-foreground)]">{error}</p>
        <Button
          variant="outline"
          className="rounded-xl"
          onClick={() => router.push("/login")}
        >
          Go to Login
        </Button>
      </div>
    );
  }

  if (!invite) return null;

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
        <h2 className="text-xl font-semibold tracking-tight">Join {invite.organizationName}</h2>
        <p className="mt-1 text-sm text-[var(--muted-foreground)]">
          You&apos;ve been invited as <span className="font-medium text-[var(--foreground)]">{invite.role}</span>.
          Create your account to get started.
        </p>
      </div>

      {/* Invite info */}
      <div className="rounded-xl bg-indigo-50 border border-indigo-100 px-4 py-3 text-sm text-indigo-700 flex items-start gap-2.5 animate-fade-in-up" style={{ animationDelay: "30ms" }}>
        <CheckCircle2 className="h-4 w-4 mt-0.5 shrink-0" />
        <span>Invite for <strong>{invite.email}</strong></span>
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
          <Label htmlFor="name" className="text-sm font-medium">Full Name</Label>
          <Input
            id="name"
            placeholder="Jane Smith"
            className="h-11"
            {...register("name", { required: "Name is required", minLength: { value: 2, message: "Name must be at least 2 characters" } })}
          />
          {errors.name && (
            <p className="text-xs text-red-500 mt-1">{errors.name.message}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="password" className="text-sm font-medium">Password</Label>
          <Input
            id="password"
            type="password"
            className="h-11"
            {...register("password", { required: "Password is required", minLength: { value: 8, message: "Password must be at least 8 characters" } })}
          />
          {errors.password && (
            <p className="text-xs text-red-500 mt-1">{errors.password.message}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="confirmPassword" className="text-sm font-medium">Confirm Password</Label>
          <Input
            id="confirmPassword"
            type="password"
            className="h-11"
            {...register("confirmPassword", {
              required: "Please confirm your password",
              validate: (value) => value === password || "Passwords do not match",
            })}
          />
          {errors.confirmPassword && (
            <p className="text-xs text-red-500 mt-1">{errors.confirmPassword.message}</p>
          )}
        </div>

        <Button
          type="submit"
          className="w-full h-11 gap-2 rounded-xl text-sm bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 shadow-[0_2px_8px_rgba(99,102,241,0.3)] hover:shadow-[0_4px_16px_rgba(99,102,241,0.4)] transition-all duration-200 active:scale-[0.98]"
          disabled={submitting}
        >
          {submitting ? (
            <>
              <Spinner className="h-4 w-4" />
              Creating account...
            </>
          ) : (
            <>
              Accept Invite & Create Account
              <ArrowRight className="h-4 w-4" />
            </>
          )}
        </Button>
      </form>
    </div>
  );
}
