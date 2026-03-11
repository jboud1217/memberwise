import { auth } from "@/auth";
import {
  Users,
  UserCheck,
  UserX,
  DollarSign,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  Zap,
  Globe,
  CreditCard,
  Mail,
  Upload,
  Tag,
  TrendingUp,
  Activity,
  BarChart3,
} from "lucide-react";
import Link from "next/link";

export default async function DashboardPage() {
  const session = await auth();

  const stats = [
    {
      name: "Total Members",
      value: "0",
      icon: Users,
      gradient: "from-indigo-500 to-purple-600",
      glow: "rgba(99,102,241,0.2)",
    },
    {
      name: "Active",
      value: "0",
      icon: UserCheck,
      gradient: "from-emerald-500 to-teal-600",
      glow: "rgba(16,185,129,0.2)",
    },
    {
      name: "Lapsed",
      value: "0",
      icon: UserX,
      gradient: "from-amber-500 to-orange-600",
      glow: "rgba(245,158,11,0.2)",
    },
    {
      name: "Revenue (YTD)",
      value: "$0",
      icon: DollarSign,
      gradient: "from-rose-500 to-pink-600",
      glow: "rgba(244,63,94,0.2)",
    },
  ];

  const steps = [
    {
      label: "Set up membership tiers",
      description: "Define pricing plans for your members",
      href: "/tiers",
      icon: Tag,
      gradient: "from-violet-500 to-purple-600",
    },
    {
      label: "Import your members",
      description: "Upload a CSV or add members manually",
      href: "/members/import",
      icon: Upload,
      gradient: "from-blue-500 to-indigo-600",
    },
    {
      label: "Connect Stripe for payments",
      description: "Accept online dues and donations",
      href: "/settings/billing",
      icon: CreditCard,
      gradient: "from-emerald-500 to-teal-600",
    },
    {
      label: "Send your first email",
      description: "Reach your members with a campaign",
      href: "/email/new",
      icon: Mail,
      gradient: "from-amber-500 to-orange-600",
    },
    {
      label: "Set up your public site",
      description: "Configure your domain and design",
      href: "/settings/domain",
      icon: Globe,
      gradient: "from-rose-500 to-pink-600",
    },
  ];

  const quickActions = [
    { label: "Add Member", href: "/members?action=new", icon: Users, color: "text-indigo-500" },
    { label: "Send Email", href: "/email/new", icon: Mail, color: "text-purple-500" },
    { label: "View Analytics", href: "/analytics", icon: BarChart3, color: "text-emerald-500" },
    { label: "Site Builder", href: "/settings/template", icon: Globe, color: "text-rose-500" },
  ];

  return (
    <div className="space-y-8">
      {/* Hero banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 p-8 text-white shadow-[0_8px_32px_rgba(0,0,0,0.12)] animate-fade-in-up">
        {/* Decorative background */}
        <div className="pointer-events-none absolute inset-0">
          <div
            className="absolute inset-0"
            style={{
              background:
                "radial-gradient(ellipse 60% 50% at 70% -10%, rgba(99,102,241,0.35) 0%, transparent 60%), radial-gradient(ellipse 40% 40% at 10% 80%, rgba(139,92,246,0.2) 0%, transparent 50%)",
            }}
          />
          <div
            className="absolute inset-0 opacity-[0.03]"
            style={{
              backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.8) 1px, transparent 1px)",
              backgroundSize: "20px 20px",
            }}
          />
        </div>

        <div className="relative flex items-start justify-between">
          <div>
            <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-indigo-200 backdrop-blur-sm">
              <Sparkles className="h-3 w-3" />
              Dashboard
            </div>
            <h1 className="text-3xl font-bold tracking-tight">
              Welcome back{session?.user?.name ? `, ${session.user.name}` : ""}
            </h1>
            <p className="mt-2 max-w-lg text-sm text-slate-400">
              Here&apos;s an overview of your organization. Complete the setup steps below to unlock the full power of MemberWise.
            </p>
          </div>
          <div className="hidden items-center gap-2 md:flex">
            <Link
              href="/members/import"
              className="inline-flex items-center gap-2 rounded-xl bg-white/10 px-4 py-2.5 text-sm font-medium text-white backdrop-blur-sm transition-all duration-200 hover:bg-white/20 active:scale-[0.98]"
            >
              <Upload className="h-4 w-4" />
              Import
            </Link>
            <Link
              href="/settings/template"
              className="inline-flex items-center gap-2 rounded-xl bg-indigo-500 px-4 py-2.5 text-sm font-medium text-white shadow-[0_2px_12px_rgba(99,102,241,0.4)] transition-all duration-200 hover:bg-indigo-400 hover:shadow-[0_4px_20px_rgba(99,102,241,0.5)] active:scale-[0.98]"
            >
              <Zap className="h-4 w-4" />
              Build Site
            </Link>
          </div>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 stagger-children">
        {stats.map((stat) => (
          <div
            key={stat.name}
            className="group relative overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--card)] p-5 shadow-[var(--shadow-sm)] transition-all duration-300 hover:shadow-[var(--shadow-md)] hover:border-[var(--ring)]/30"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-[var(--muted-foreground)]">
                  {stat.name}
                </p>
                <p className="mt-2 text-3xl font-bold tracking-tight">{stat.value}</p>
              </div>
              <div
                className={`flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br ${stat.gradient} shadow-lg transition-all duration-300 group-hover:scale-110 group-hover:shadow-xl`}
                style={{ boxShadow: `0 4px 14px ${stat.glow}` }}
              >
                <stat.icon className="h-5 w-5 text-white" />
              </div>
            </div>
            <div
              className={`absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r ${stat.gradient} opacity-0 transition-opacity duration-300 group-hover:opacity-100`}
            />
          </div>
        ))}
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {quickActions.map((action) => (
          <Link
            key={action.label}
            href={action.href}
            className="group flex flex-col items-center gap-2.5 rounded-xl border border-[var(--border)] bg-[var(--card)] p-4 text-center transition-all duration-200 hover:border-[var(--ring)]/30 hover:shadow-[var(--shadow-md)] active:scale-[0.98]"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--muted)] transition-colors duration-200 group-hover:bg-[var(--accent)]">
              <action.icon className={`h-5 w-5 ${action.color} transition-transform duration-200 group-hover:scale-110`} />
            </div>
            <span className="text-sm font-medium">{action.label}</span>
          </Link>
        ))}
      </div>

      {/* Bottom grid: Getting Started + Activity */}
      <div className="grid gap-6 lg:grid-cols-5">
        {/* Getting Started */}
        <div className="lg:col-span-3 overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--card)] shadow-[var(--shadow-sm)]">
          <div className="flex items-center justify-between border-b border-[var(--border)] px-6 py-4">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600">
                <CheckCircle2 className="h-4 w-4 text-white" />
              </div>
              <div>
                <h2 className="text-base font-semibold">Getting Started</h2>
                <p className="text-xs text-[var(--muted-foreground)]">Complete these steps to set up your organization</p>
              </div>
            </div>
            <span className="rounded-full bg-[var(--accent)] px-2.5 py-1 text-xs font-semibold text-[var(--accent-foreground)]">
              0/5
            </span>
          </div>
          <div className="divide-y divide-[var(--border)]">
            {steps.map((step, i) => (
              <Link
                key={i}
                href={step.href}
                className="group flex items-center gap-4 px-6 py-4 transition-all duration-200 hover:bg-[var(--accent)]/50"
              >
                <div
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${step.gradient} shadow-md transition-transform duration-300 group-hover:scale-110`}
                >
                  <step.icon className="h-[18px] w-[18px] text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold">{step.label}</p>
                  <p className="text-xs text-[var(--muted-foreground)]">{step.description}</p>
                </div>
                <ArrowRight className="h-4 w-4 shrink-0 text-[var(--muted-foreground)] opacity-0 transition-all duration-200 group-hover:translate-x-1 group-hover:opacity-100" />
              </Link>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="lg:col-span-2 overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--card)] shadow-[var(--shadow-sm)]">
          <div className="flex items-center gap-3 border-b border-[var(--border)] px-6 py-4">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--muted)]">
              <Activity className="h-4 w-4 text-[var(--muted-foreground)]" />
            </div>
            <h2 className="text-base font-semibold">Recent Activity</h2>
          </div>
          <div className="flex flex-col items-center justify-center px-6 py-12 text-center">
            <div className="relative mb-5">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500/10 to-purple-500/10">
                <Sparkles className="h-7 w-7 text-indigo-400" />
              </div>
              <div className="absolute -inset-2 rounded-3xl bg-indigo-500/5 blur-xl" />
            </div>
            <p className="font-semibold">No activity yet</p>
            <p className="mt-1.5 text-sm text-[var(--muted-foreground)] max-w-[220px]">
              Activity will appear here once you start managing members.
            </p>
            <Link
              href="/members/import"
              className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[var(--primary)] px-5 py-2.5 text-sm font-medium text-[var(--primary-foreground)] shadow-[0_2px_12px_rgba(99,102,241,0.3)] transition-all duration-200 hover:shadow-[0_4px_20px_rgba(99,102,241,0.4)] hover:brightness-110 active:scale-[0.98]"
            >
              Import Members
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
