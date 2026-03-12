"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { registerSchema, type RegisterInput } from "@/lib/validators/auth";
import { register } from "@/actions/auth";
import { signIn } from "next-auth/react";
import { useAuthStep } from "../layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { slugify } from "@/lib/utils";
import {
  Globe,
  Check,
  ArrowRight,
  ArrowLeft,
  Eye,
  EyeOff,
  Sparkles,
  ExternalLink,
  Zap,
  CornerDownLeft,
} from "lucide-react";

const STEPS = [
  { id: "organization", title: "Name your organization", subtitle: "This is how members will recognize you" },
  { id: "domain", title: "Choose your domain", subtitle: "How members will access your portal" },
  { id: "personal", title: "Create your account", subtitle: "We\u2019ll use this to set you up as the owner" },
  { id: "security", title: "Secure your account", subtitle: "Choose a strong password to protect your data" },
] as const;

function getPasswordStrength(password: string): { score: number; label: string; color: string } {
  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  if (score <= 1) return { score, label: "Weak", color: "bg-red-500" };
  if (score <= 2) return { score, label: "Fair", color: "bg-orange-500" };
  if (score <= 3) return { score, label: "Good", color: "bg-yellow-500" };
  return { score, label: "Strong", color: "bg-emerald-500" };
}

export default function RegisterPage() {
  const router = useRouter();
  const [step, setStepLocal] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [animKey, setAnimKey] = useState(0);
  const stepRef = useRef<HTMLDivElement>(null);
  const { setStep: setLayoutStep } = useAuthStep();

  // Sync step to layout so branding panel updates (via effect, not during render)
  useEffect(() => {
    setLayoutStep(step);
  }, [step, setLayoutStep]);

  const setStep = useCallback(
    (s: number | ((prev: number) => number)) => {
      setStepLocal(s);
      setAnimKey((k) => k + 1);
    },
    []
  );

  const {
    register: registerField,
    handleSubmit,
    setValue,
    watch,
    trigger,
    formState: { errors },
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    mode: "onTouched",
    defaultValues: {
      domainType: "subdomain",
    },
  });

  const password = watch("password") || "";
  const domainType = watch("domainType");
  const slug = watch("slug") || "";
  const orgName = watch("organizationName") || "";
  const userName = watch("name") || "";
  const userEmail = watch("email") || "";
  const strength = getPasswordStrength(password);

  // Auto-focus first input on step change
  useEffect(() => {
    const timer = setTimeout(() => {
      const firstInput = stepRef.current?.querySelector("input:not([type=radio]):not([type=hidden])");
      if (firstInput instanceof HTMLElement) firstInput.focus();
    }, 100);
    return () => clearTimeout(timer);
  }, [step]);

  const nextStep = useCallback(async () => {
    const fieldsPerStep: (keyof RegisterInput)[][] = [
      ["organizationName", "slug"],
      ["domainType", "customDomain"],
      ["name", "email"],
      ["password"],
    ];
    const valid = await trigger(fieldsPerStep[step]);
    if (valid) setStep((s) => Math.min(s + 1, STEPS.length - 1));
  }, [step, trigger, setStep]);

  const prevStep = useCallback(() => {
    setStep((s) => Math.max(s - 1, 0));
  }, [setStep]);

  // Enter key advances steps (but not on final step — that submits naturally)
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Enter" && step < STEPS.length - 1) {
        const target = e.target as HTMLElement;
        // Don't hijack Enter on radio buttons or if user is in a textarea
        if (target.tagName === "TEXTAREA") return;
        e.preventDefault();
        nextStep();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [step, nextStep]);

  async function onSubmit(data: RegisterInput) {
    setLoading(true);
    setError(null);
    const result = await register(data);
    if (result.error) {
      setError(result.error);
      setLoading(false);
      return;
    }
    // Sign in client-side (properly sets auth cookie via HTTP)
    const signInResult = await signIn("credentials", {
      email: data.email,
      password: data.password,
      organizationSlug: data.slug,
      redirect: false,
    });
    if (signInResult?.error) {
      setError("Account created but auto-login failed. Please log in manually.");
      setLoading(false);
      return;
    }
    window.location.href = "/onboarding";
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

      {/* Progress bar */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-medium text-[var(--muted-foreground)] uppercase tracking-wider">
            Step {step + 1} of {STEPS.length}
          </span>
          <div className="flex gap-1">
            {STEPS.map((_, i) => (
              <div
                key={i}
                className={`h-1.5 rounded-full transition-all duration-500 ${
                  i <= step
                    ? "w-6 bg-[var(--primary)]"
                    : "w-1.5 bg-[var(--border)]"
                }`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Step header — animated */}
      <div key={`header-${animKey}`} className="animate-fade-in-up">
        <h2 className="text-xl font-semibold tracking-tight">{STEPS[step].title}</h2>
        <p className="mt-1 text-sm text-[var(--muted-foreground)]">{STEPS[step].subtitle}</p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        {error && (
          <div className="rounded-xl bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-600 flex items-start gap-2.5">
            <div className="h-5 w-5 rounded-full bg-red-100 flex items-center justify-center shrink-0 mt-px">
              <span className="text-xs font-bold">!</span>
            </div>
            {error}
          </div>
        )}

        {/* Animated step wrapper */}
        <div ref={stepRef} key={`step-${animKey}`} className="animate-fade-in-up">
          {/* Step 1: Organization */}
          {step === 0 && (
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="organizationName" className="text-sm font-medium">
                  Organization name
                </Label>
                <Input
                  id="organizationName"
                  placeholder="North Buckhead Civic Association"
                  className="h-11"
                  {...registerField("organizationName", {
                    onChange: (e) => {
                      const val = e.target.value;
                      setValue("slug", slugify(val));
                    },
                  })}
                />
                {errors.organizationName && (
                  <p className="text-xs text-red-500 mt-1">{errors.organizationName.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="slug" className="text-sm font-medium">
                  Subdomain
                </Label>
                <div className="flex items-center h-11 rounded-lg border border-[var(--input)] bg-[var(--background)] overflow-hidden focus-within:ring-2 focus-within:ring-[var(--ring)] focus-within:ring-offset-2 transition-shadow">
                  <input
                    id="slug"
                    placeholder="north-buckhead"
                    className="flex h-full w-full bg-transparent px-3 text-sm placeholder:text-[var(--muted-foreground)] focus:outline-none"
                    {...registerField("slug")}
                  />
                  <span className="px-3 text-sm text-[var(--muted-foreground)] select-none whitespace-nowrap border-l border-[var(--border)] bg-[var(--muted)] h-full flex items-center">
                    .memberwise.com
                  </span>
                </div>
                {errors.slug && (
                  <p className="text-xs text-red-500 mt-1">{errors.slug.message}</p>
                )}
              </div>

              {/* Live preview card */}
              {orgName && slug && (
                <div className="rounded-xl border border-[var(--border)] bg-[var(--muted)]/50 p-3.5 flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shrink-0">
                    <span className="text-sm font-bold text-white">
                      {orgName.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">{orgName}</p>
                    <p className="text-xs text-[var(--muted-foreground)] truncate font-mono">
                      {slug}.memberwise.com
                    </p>
                  </div>
                  <div className="rounded-md bg-emerald-50 border border-emerald-200 px-2 py-1 text-[10px] font-semibold text-emerald-700 shrink-0">
                    Available
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Step 2: Domain */}
          {step === 1 && (
            <div className="space-y-3">
              {/* Subdomain option */}
              <label
                className={`group block cursor-pointer rounded-xl border-2 p-4 transition-all duration-200 ${
                  domainType === "subdomain"
                    ? "border-[var(--primary)] bg-indigo-50/50 shadow-sm"
                    : "border-[var(--border)] hover:border-[var(--muted-foreground)]/30"
                }`}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`mt-0.5 h-[18px] w-[18px] rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
                      domainType === "subdomain"
                        ? "border-[var(--primary)] bg-[var(--primary)]"
                        : "border-[var(--border)]"
                    }`}
                  >
                    {domainType === "subdomain" && (
                      <div className="h-1.5 w-1.5 rounded-full bg-white" />
                    )}
                  </div>
                  <input
                    type="radio"
                    value="subdomain"
                    className="sr-only"
                    {...registerField("domainType")}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">MemberWise subdomain</span>
                      <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-700">
                        <Zap className="h-2.5 w-2.5" />
                        Instant
                      </span>
                    </div>
                    <p className="mt-0.5 text-xs text-[var(--muted-foreground)]">
                      Ready immediately at no cost. You can add a custom domain later.
                    </p>
                    {domainType === "subdomain" && slug && (
                      <div className="mt-2.5 flex items-center gap-2 rounded-lg bg-[var(--background)] border border-[var(--border)] px-3 py-2">
                        <Globe className="h-3.5 w-3.5 text-[var(--muted-foreground)]" />
                        <code className="text-xs font-mono text-[var(--foreground)]">
                          {slug}.memberwise.com
                        </code>
                      </div>
                    )}
                  </div>
                </div>
              </label>

              {/* Custom domain option */}
              <label
                className={`group block cursor-pointer rounded-xl border-2 p-4 transition-all duration-200 ${
                  domainType === "custom"
                    ? "border-[var(--primary)] bg-indigo-50/50 shadow-sm"
                    : "border-[var(--border)] hover:border-[var(--muted-foreground)]/30"
                }`}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`mt-0.5 h-[18px] w-[18px] rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
                      domainType === "custom"
                        ? "border-[var(--primary)] bg-[var(--primary)]"
                        : "border-[var(--border)]"
                    }`}
                  >
                    {domainType === "custom" && (
                      <div className="h-1.5 w-1.5 rounded-full bg-white" />
                    )}
                  </div>
                  <input
                    type="radio"
                    value="custom"
                    className="sr-only"
                    {...registerField("domainType")}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">Custom domain</span>
                      <span className="inline-flex items-center gap-1 rounded-md bg-violet-50 border border-violet-200 px-1.5 py-0.5 text-[10px] font-semibold text-violet-700">
                        <Sparkles className="h-2.5 w-2.5" />
                        Pro
                      </span>
                    </div>
                    <p className="mt-0.5 text-xs text-[var(--muted-foreground)]">
                      Use your own domain &mdash; just one DNS record to add
                    </p>
                  </div>
                </div>
              </label>

              {/* Custom domain input */}
              {domainType === "custom" && (
                <div className="space-y-3 rounded-xl border border-[var(--border)] p-4 mt-1 animate-fade-in-up">
                  <div className="space-y-1.5">
                    <Label htmlFor="customDomain" className="text-sm font-medium">
                      Domain
                    </Label>
                    <Input
                      id="customDomain"
                      placeholder="members.yourorg.com"
                      className="h-11"
                      {...registerField("customDomain")}
                    />
                    {errors.customDomain && (
                      <p className="text-xs text-red-500 mt-1">{errors.customDomain.message}</p>
                    )}
                  </div>

                  <div className="flex items-start gap-2.5 rounded-lg bg-[var(--muted)] px-3 py-2.5">
                    <ExternalLink className="h-3.5 w-3.5 mt-0.5 text-[var(--primary)] shrink-0" />
                    <p className="text-xs text-[var(--muted-foreground)] leading-relaxed">
                      After signup, add a CNAME record at your DNS provider. Your existing website and email are not affected.
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Step 3: Personal */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="name" className="text-sm font-medium">Full name</Label>
                <Input id="name" placeholder="Jane Smith" className="h-11" {...registerField("name")} />
                {errors.name && (
                  <p className="text-xs text-red-500 mt-1">{errors.name.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-sm font-medium">Work email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="jane@yourorg.com"
                  className="h-11"
                  {...registerField("email")}
                />
                <p className="text-[11px] text-[var(--muted-foreground)]">
                  We&apos;ll send a confirmation link to verify your email
                </p>
                {errors.email && (
                  <p className="text-xs text-red-500 mt-1">{errors.email.message}</p>
                )}
              </div>
            </div>
          )}

          {/* Step 4: Security */}
          {step === 3 && (
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="password" className="text-sm font-medium">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Min. 8 characters"
                    className="h-11 pr-10"
                    {...registerField("password")}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-xs text-red-500 mt-1">{errors.password.message}</p>
                )}

                {/* Strength bar */}
                {password.length > 0 && (
                  <div className="space-y-1.5 pt-1">
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map((i) => (
                        <div
                          key={i}
                          className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                            i <= strength.score ? strength.color : "bg-[var(--border)]"
                          }`}
                        />
                      ))}
                    </div>
                    <p className="text-[11px] text-[var(--muted-foreground)]">
                      {strength.label}
                    </p>
                  </div>
                )}
              </div>

              {/* Requirements — compact grid */}
              <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                {[
                  { check: password.length >= 8, text: "8+ characters" },
                  { check: /[A-Z]/.test(password), text: "Uppercase letter" },
                  { check: /[0-9]/.test(password), text: "Number" },
                  { check: /[^A-Za-z0-9]/.test(password), text: "Special character" },
                ].map((tip) => (
                  <div key={tip.text} className="flex items-center gap-1.5">
                    <div
                      className={`h-3.5 w-3.5 rounded flex items-center justify-center transition-all duration-200 ${
                        tip.check
                          ? "bg-emerald-500 text-white"
                          : "border border-[var(--border)]"
                      }`}
                    >
                      {tip.check && <Check className="h-2.5 w-2.5" />}
                    </div>
                    <span
                      className={`text-xs transition-colors ${
                        tip.check ? "text-[var(--foreground)]" : "text-[var(--muted-foreground)]"
                      }`}
                    >
                      {tip.text}
                    </span>
                  </div>
                ))}
              </div>

              {/* Summary of what they're creating */}
              <div className="rounded-xl border border-[var(--border)] bg-[var(--muted)]/50 p-3.5 space-y-2">
                <p className="text-[11px] font-medium text-[var(--muted-foreground)] uppercase tracking-wider">
                  Your organization
                </p>
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shrink-0">
                    <span className="text-xs font-bold text-white">
                      {orgName ? orgName.charAt(0).toUpperCase() : "?"}
                    </span>
                  </div>
                  <div className="min-w-0 flex-1 text-xs">
                    <p className="font-medium truncate">{orgName || "..."}</p>
                    <p className="text-[var(--muted-foreground)] truncate">
                      {userName || "..."} &middot; {userEmail || "..."}
                    </p>
                  </div>
                </div>
              </div>

              <p className="text-[11px] text-[var(--muted-foreground)] leading-relaxed">
                By creating an account, you agree to MemberWise&apos;s{" "}
                <Link href="/terms" className="underline hover:text-[var(--foreground)]">Terms of Service</Link>
                {" "}and{" "}
                <Link href="/privacy" className="underline hover:text-[var(--foreground)]">Privacy Policy</Link>.
              </p>
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="flex items-center gap-3 pt-1">
          {step > 0 && (
            <Button type="button" variant="ghost" onClick={prevStep} className="gap-1.5 px-3 text-[var(--muted-foreground)]">
              <ArrowLeft className="h-3.5 w-3.5" />
              Back
            </Button>
          )}
          <div className="flex-1" />
          {step < STEPS.length - 1 ? (
            <div className="flex items-center gap-3">
              <span className="hidden sm:flex items-center gap-1 text-[11px] text-[var(--muted-foreground)]">
                <CornerDownLeft className="h-3 w-3" />
                Enter
              </span>
              <Button type="button" onClick={nextStep} size="lg" className="gap-2 min-w-[140px] rounded-xl">
                Continue
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <Button type="submit" size="lg" className="gap-2 min-w-[160px] rounded-xl" disabled={loading}>
              {loading ? (
                <>
                  <Spinner className="h-4 w-4" />
                  Creating...
                </>
              ) : (
                "Create Organization"
              )}
            </Button>
          )}
        </div>

        {/* Sign in link */}
        <div className="relative pt-3">
          <div className="absolute inset-0 flex items-center pt-3">
            <div className="w-full border-t border-[var(--border)]" />
          </div>
          <div className="relative flex justify-center">
            <span className="bg-[var(--background)] px-3 text-xs text-[var(--muted-foreground)]">
              Already have an account?{" "}
              <Link href="/login" className="text-[var(--primary)] font-medium hover:underline">
                Sign in
              </Link>
            </span>
          </div>
        </div>
      </form>
    </div>
  );
}
