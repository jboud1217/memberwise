"use client";

import { createContext, useContext, useState } from "react";
import { Shield, Globe, Users, Rocket } from "lucide-react";

// Context so the register page can tell the layout which step it's on
const StepContext = createContext<{
  step: number;
  setStep: (s: number) => void;
}>({ step: 0, setStep: () => {} });

export function useAuthStep() {
  return useContext(StepContext);
}

const PANEL_CONTENT = [
  {
    icon: Users,
    tag: "Organization",
    headline: "Built for communities\nof every size",
    description: "From 50-member neighborhood groups to 50,000-member professional associations. MemberWise scales with you.",
    features: ["Unlimited members", "Multi-tier memberships", "Self-service portal"],
  },
  {
    icon: Globe,
    tag: "Your Brand",
    headline: "Your domain,\nyour identity",
    description: "Members see your brand, not ours. Custom domain, your logo, your colors. It's your organization's home on the web.",
    features: ["Custom domain support", "White-label portal", "Branded email communications"],
  },
  {
    icon: Rocket,
    tag: "Get Started",
    headline: "You're almost\nthere",
    description: "Just a few more details and you'll have your own membership portal live in under 2 minutes.",
    features: ["No credit card required", "Free plan available", "Cancel anytime"],
  },
  {
    icon: Shield,
    tag: "Security",
    headline: "Enterprise-grade\nsecurity",
    description: "Your members' data is protected with bank-level encryption, SOC 2 compliance, and 99.9% uptime SLA.",
    features: ["256-bit encryption", "SOC 2 Type II", "Daily backups"],
  },
];

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [step, setStep] = useState(0);
  const content = PANEL_CONTENT[step] || PANEL_CONTENT[0];
  const Icon = content.icon;

  return (
    <StepContext.Provider value={{ step, setStep }}>
      <div className="flex min-h-screen">
        {/* Branding panel — reacts to current registration step */}
        <div className="hidden lg:flex lg:w-[480px] xl:w-[560px] relative overflow-hidden bg-gradient-to-br from-indigo-600 via-purple-700 to-indigo-900">
          {/* Grid pattern */}
          <div
            className="absolute inset-0 opacity-[0.05]"
            style={{
              backgroundImage:
                "linear-gradient(rgba(255,255,255,.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.5) 1px, transparent 1px)",
              backgroundSize: "32px 32px",
            }}
          />

          {/* Gradient orbs */}
          <div className="absolute -top-24 -right-24 h-80 w-80 rounded-full bg-white/10 blur-3xl" />
          <div className="absolute -bottom-32 -left-32 h-96 w-96 rounded-full bg-purple-400/20 blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-64 w-64 rounded-full bg-indigo-300/10 blur-3xl animate-pulse-glow" />

          <div className="relative z-10 flex flex-col justify-between p-10 xl:p-12 text-white w-full">
            {/* Logo */}
            <div className="flex items-center gap-2.5">
              <div className="h-9 w-9 rounded-lg bg-white/15 flex items-center justify-center backdrop-blur-sm border border-white/10">
                <span className="text-base font-bold">M</span>
              </div>
              <span className="text-lg font-semibold tracking-tight">MemberWise</span>
            </div>

            {/* Dynamic content per step */}
            <div className="space-y-8">
              <div key={step} className="space-y-5 animate-fade-in-up">
                {/* Step tag */}
                <div className="inline-flex items-center gap-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/10 px-3 py-1.5">
                  <Icon className="h-3.5 w-3.5" />
                  <span className="text-xs font-medium">{content.tag}</span>
                </div>

                <h1 className="text-[2.25rem] xl:text-[2.75rem] font-bold leading-[1.1] tracking-tight whitespace-pre-line">
                  {content.headline}
                </h1>

                <p className="text-sm text-white/60 max-w-xs leading-relaxed">
                  {content.description}
                </p>

                {/* Feature pills */}
                <div className="flex flex-wrap gap-2 pt-2">
                  {content.features.map((f) => (
                    <span
                      key={f}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-white/[0.07] border border-white/10 px-3 py-1.5 text-xs text-white/70"
                    >
                      <svg className="h-3 w-3 text-indigo-300" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      {f}
                    </span>
                  ))}
                </div>
              </div>

              {/* Testimonial */}
              <div className="rounded-2xl bg-white/[0.06] backdrop-blur-sm border border-white/[0.08] p-5 max-w-sm animate-shimmer">
                <p className="text-[13px] text-white/70 leading-relaxed">
                  &ldquo;We switched from spreadsheets to MemberWise and saved 15 hours a week. Our members love the self-service portal.&rdquo;
                </p>
                <div className="mt-3.5 flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-gradient-to-br from-indigo-300 to-purple-400 flex items-center justify-center text-[10px] font-bold text-white">
                    SR
                  </div>
                  <div>
                    <p className="text-xs font-medium text-white/80">Sarah Rodriguez</p>
                    <p className="text-[11px] text-white/40">Austin Neighborhood Alliance</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer with stats */}
            <div className="flex items-center justify-between">
              <div className="flex gap-8">
                <div>
                  <div className="text-lg font-bold">10k+</div>
                  <div className="text-[10px] text-white/40 uppercase tracking-wider">Orgs</div>
                </div>
                <div>
                  <div className="text-lg font-bold">2M+</div>
                  <div className="text-[10px] text-white/40 uppercase tracking-wider">Members</div>
                </div>
                <div>
                  <div className="text-lg font-bold">99.9%</div>
                  <div className="text-[10px] text-white/40 uppercase tracking-wider">Uptime</div>
                </div>
              </div>
              <p className="text-[10px] text-white/25">
                &copy; {new Date().getFullYear()} MemberWise
              </p>
            </div>
          </div>
        </div>

        {/* Form panel */}
        <div className="flex flex-1 items-center justify-center bg-[var(--background)] px-6 py-12">
          <div className="w-full max-w-[420px]">{children}</div>
        </div>
      </div>
    </StepContext.Provider>
  );
}
