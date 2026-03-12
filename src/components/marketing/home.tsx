import Link from "next/link";
import { ArrowRight, Users, Shield, Zap, BarChart3 } from "lucide-react";

export function MarketingHome() {
  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* ─── Gradient background ─────────────────────── */}
      <div className="pointer-events-none absolute inset-0">
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(135deg, #0f0c29 0%, #1a1140 25%, #302b63 50%, #24243e 75%, #0f0c29 100%)",
          }}
        />
        {/* Floating orbs */}
        <div
          className="absolute left-1/4 top-1/4 h-[600px] w-[600px] rounded-full opacity-20 blur-[120px]"
          style={{ background: "radial-gradient(circle, #6366f1, transparent 70%)" }}
        />
        <div
          className="absolute bottom-1/4 right-1/4 h-[500px] w-[500px] rounded-full opacity-15 blur-[100px]"
          style={{ background: "radial-gradient(circle, #a855f7, transparent 70%)" }}
        />
        <div
          className="absolute left-1/2 top-0 h-[400px] w-[400px] -translate-x-1/2 rounded-full opacity-10 blur-[80px]"
          style={{ background: "radial-gradient(circle, #06b6d4, transparent 70%)" }}
        />
        {/* Subtle grid overlay */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)",
            backgroundSize: "60px 60px",
          }}
        />
      </div>

      {/* ─── Header ──────────────────────────────────── */}
      <header className="relative z-10">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-[0_4px_12px_rgba(99,102,241,0.4)]">
              <span className="text-sm font-bold text-white">M</span>
            </div>
            <span className="text-lg font-semibold tracking-tight text-white">MemberWise</span>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="rounded-lg px-4 py-2 text-sm font-medium text-white/80 transition-all duration-200 hover:bg-white/10 hover:text-white"
            >
              Log in
            </Link>
            <Link
              href="/register"
              className="rounded-xl bg-white px-5 py-2.5 text-sm font-semibold text-gray-900 shadow-[0_2px_12px_rgba(255,255,255,0.15)] transition-all duration-200 hover:bg-gray-100 hover:shadow-[0_4px_20px_rgba(255,255,255,0.2)] active:scale-[0.98]"
            >
              Get Started
            </Link>
          </div>
        </div>
      </header>

      {/* ─── Hero ────────────────────────────────────── */}
      <main className="relative z-10">
        <div className="mx-auto max-w-4xl px-6 pb-20 pt-24 text-center sm:pt-32">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-sm text-indigo-300 backdrop-blur-sm">
            <Zap className="h-3.5 w-3.5" />
            AI-native membership management
          </div>

          <h1 className="text-5xl font-bold leading-[1.1] tracking-tight text-white sm:text-6xl lg:text-7xl">
            The modern way to{" "}
            <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent">
              manage members
            </span>
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-white/60 sm:text-xl">
            Everything your organization needs — member tracking, billing, email campaigns,
            a public website, and a member portal — all in one place.
          </p>

          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              href="/register"
              className="group inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 px-7 py-3.5 text-sm font-semibold text-white shadow-[0_4px_20px_rgba(99,102,241,0.4)] transition-all duration-200 hover:shadow-[0_8px_30px_rgba(99,102,241,0.5)] hover:brightness-110 active:scale-[0.98]"
            >
              Start for Free
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-7 py-3.5 text-sm font-semibold text-white/90 backdrop-blur-sm transition-all duration-200 hover:border-white/25 hover:bg-white/10"
            >
              Sign in to Dashboard
            </Link>
          </div>
        </div>

        {/* ─── Feature cards ─────────────────────────── */}
        <div className="mx-auto max-w-5xl px-6 pb-24">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                icon: Users,
                title: "Member Management",
                desc: "Track members, tiers, contacts, and custom fields with powerful search.",
                gradient: "from-indigo-500 to-blue-600",
              },
              {
                icon: BarChart3,
                title: "Analytics & Billing",
                desc: "Revenue tracking, payment recording, and financial insights at a glance.",
                gradient: "from-purple-500 to-pink-600",
              },
              {
                icon: Zap,
                title: "Email Campaigns",
                desc: "Build and send targeted emails to your members with built-in templates.",
                gradient: "from-amber-500 to-orange-600",
              },
              {
                icon: Shield,
                title: "Member Portal",
                desc: "A branded portal where members view dues, update profiles, and connect.",
                gradient: "from-emerald-500 to-teal-600",
              },
            ].map((feature) => (
              <div
                key={feature.title}
                className="group rounded-2xl border border-white/10 bg-white/[0.03] p-6 backdrop-blur-sm transition-all duration-300 hover:border-white/20 hover:bg-white/[0.06]"
              >
                <div
                  className={`mb-4 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${feature.gradient} shadow-lg`}
                >
                  <feature.icon className="h-5 w-5 text-white" />
                </div>
                <h3 className="mb-1.5 text-sm font-semibold text-white">{feature.title}</h3>
                <p className="text-sm leading-relaxed text-white/50">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* ─── Footer ──────────────────────────────────── */}
      <footer className="relative z-10 border-t border-white/10">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
          <p className="text-sm text-white/40">
            &copy; {new Date().getFullYear()} MemberWise. All rights reserved.
          </p>
          <div className="flex items-center gap-4">
            <Link href="/login" className="text-sm text-white/40 transition-colors hover:text-white/70">
              Log in
            </Link>
            <Link href="/register" className="text-sm text-white/40 transition-colors hover:text-white/70">
              Register
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
