import { auth } from "@/auth";
import { getDashboardStats } from "@/actions/dashboard";
import { getRecentActivity } from "@/actions/activity";
import { formatCurrency } from "@/lib/utils";
import {
  Users,
  UserCheck,
  UserX,
  DollarSign,
  ArrowRight,
  ArrowUpRight,
  ArrowDownRight,
  Sparkles,
  CheckCircle2,
  Zap,
  Globe,
  CreditCard,
  Mail,
  Upload,
  Tag,
  Activity,
  BarChart3,
  Clock,
  Plus,
  TrendingUp,
  UserPlus,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

interface ActivityItem {
  id: string;
  type: string;
  description: string;
  createdAt: Date;
  memberId?: string | null;
}

const ACTIVITY_META: Record<string, { color: string; bg: string; href?: (i: ActivityItem) => string }> = {
  member_created: { color: "text-emerald-600", bg: "bg-emerald-50", href: (i) => i.memberId ? `/members/${i.memberId}` : "/members" },
  member_updated: { color: "text-blue-600", bg: "bg-blue-50", href: (i) => i.memberId ? `/members/${i.memberId}` : "/members" },
  member_deleted: { color: "text-red-600", bg: "bg-red-50", href: () => "/members" },
  contact_created: { color: "text-indigo-600", bg: "bg-indigo-50", href: () => "/contacts" },
  payment_recorded: { color: "text-amber-600", bg: "bg-amber-50", href: () => "/billing" },
  campaign_sent: { color: "text-purple-600", bg: "bg-purple-50", href: () => "/email/new" },
  import_completed: { color: "text-teal-600", bg: "bg-teal-50", href: () => "/members" },
  data_exported: { color: "text-slate-600", bg: "bg-slate-50", href: () => "/members" },
  team_invite_sent: { color: "text-pink-600", bg: "bg-pink-50", href: () => "/settings/team" },
};

function timeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export default async function DashboardPage() {
  const session = await auth();
  const [dashData, recentActivity] = await Promise.all([
    getDashboardStats(),
    getRecentActivity(10),
  ]);

  const stats = [
    {
      name: "Total Members",
      value: dashData?.totalMembers ?? 0,
      icon: Users,
      href: "/members",
      color: "text-indigo-600",
      bg: "bg-indigo-50",
      iconBg: "from-indigo-500 to-indigo-600",
    },
    {
      name: "Active Members",
      value: dashData?.activeMembers ?? 0,
      icon: UserCheck,
      href: "/members?status=ACTIVE",
      color: "text-emerald-600",
      bg: "bg-emerald-50",
      iconBg: "from-emerald-500 to-emerald-600",
      percent: dashData?.totalMembers ? Math.round(((dashData?.activeMembers ?? 0) / dashData.totalMembers) * 100) : 0,
    },
    {
      name: "Lapsed",
      value: dashData?.lapsedMembers ?? 0,
      icon: UserX,
      href: "/members?status=LAPSED",
      color: "text-amber-600",
      bg: "bg-amber-50",
      iconBg: "from-amber-500 to-orange-600",
    },
    {
      name: "Revenue (YTD)",
      value: formatCurrency(dashData?.revenueYTD ?? 0),
      icon: DollarSign,
      href: "/billing",
      color: "text-emerald-600",
      bg: "bg-emerald-50",
      iconBg: "from-emerald-500 to-teal-600",
      isRevenue: true,
    },
  ];

  const completedSteps = dashData?.completedSteps ?? 0;
  const stepStatus = dashData?.steps ?? { tiers: false, members: false, stripe: false, email: false, domain: false };
  const showOnboarding = completedSteps < 5;

  const steps = [
    { label: "Set up membership tiers", description: "Define pricing plans", href: "/tiers", icon: Tag, done: stepStatus.tiers },
    { label: "Import your members", description: "Upload a CSV or add manually", href: "/members/import", icon: Upload, done: stepStatus.members },
    { label: "Connect Stripe", description: "Accept online payments", href: "/settings/billing", icon: CreditCard, done: stepStatus.stripe },
    { label: "Send first email", description: "Reach your members", href: "/email/new", icon: Mail, done: stepStatus.email },
    { label: "Set up public site", description: "Your member portal", href: "/settings/domain", icon: Globe, done: stepStatus.domain },
  ];

  return (
    <div className="space-y-6">
      {/* Greeting */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {getGreeting()}{session?.user?.name ? `, ${session.user.name}` : ""}
          </h1>
          <p className="mt-0.5 text-sm text-[var(--muted-foreground)]">
            Here&apos;s what&apos;s happening with your organization today.
          </p>
        </div>
        <div className="hidden gap-2 sm:flex">
          <Link href="/members/new">
            <Button variant="outline" size="sm">
              <UserPlus className="h-4 w-4" />
              Add Member
            </Button>
          </Link>
          <Link href="/email/new">
            <Button size="sm">
              <Mail className="h-4 w-4" />
              Send Email
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Link
            key={stat.name}
            href={stat.href}
            className="group relative flex items-center gap-4 rounded-xl border border-[var(--border)] bg-[var(--card)] p-4 shadow-[var(--shadow-xs)] transition-all duration-200 hover:shadow-[var(--shadow-md)] hover:border-[var(--ring)]/30"
          >
            <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${stat.iconBg} shadow-sm`}>
              <stat.icon className="h-5 w-5 text-white" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium text-[var(--muted-foreground)] truncate">{stat.name}</p>
              <div className="flex items-baseline gap-2">
                <p className="text-2xl font-bold tracking-tight">
                  {typeof stat.value === "number" ? stat.value.toLocaleString() : stat.value}
                </p>
                {stat.percent !== undefined && stat.percent > 0 && (
                  <span className="text-xs font-medium text-emerald-600">{stat.percent}%</span>
                )}
              </div>
            </div>
            <ArrowUpRight className="h-4 w-4 shrink-0 text-[var(--muted-foreground)] opacity-0 transition-all duration-200 group-hover:opacity-100 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </Link>
        ))}
      </div>

      {/* Quick actions - mobile only */}
      <div className="grid grid-cols-2 gap-2 sm:hidden">
        <Link href="/members/new" className="flex items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--card)] p-3 text-sm font-medium transition-colors hover:bg-[var(--accent)]">
          <UserPlus className="h-4 w-4 text-indigo-500" />
          Add Member
        </Link>
        <Link href="/email/new" className="flex items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--card)] p-3 text-sm font-medium transition-colors hover:bg-[var(--accent)]">
          <Mail className="h-4 w-4 text-purple-500" />
          Send Email
        </Link>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main column */}
        <div className="space-y-6 lg:col-span-2">
          {/* Onboarding */}
          {showOnboarding && (
            <div className="overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--card)] shadow-[var(--shadow-sm)]">
              <div className="flex items-center justify-between border-b border-[var(--border)] px-5 py-3.5">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600">
                    <Zap className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <h2 className="text-sm font-semibold">Get Started</h2>
                    <p className="text-xs text-[var(--muted-foreground)]">{completedSteps} of 5 complete</p>
                  </div>
                </div>
                {/* Progress bar */}
                <div className="flex items-center gap-3">
                  <div className="hidden h-2 w-32 overflow-hidden rounded-full bg-[var(--muted)] sm:block">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-500"
                      style={{ width: `${(completedSteps / 5) * 100}%` }}
                    />
                  </div>
                  <span className="rounded-full bg-[var(--accent)] px-2 py-0.5 text-xs font-semibold text-[var(--accent-foreground)]">
                    {completedSteps}/5
                  </span>
                </div>
              </div>
              <div className="divide-y divide-[var(--border)]">
                {steps.map((step, i) => (
                  <Link key={i} href={step.href} className="group flex items-center gap-3 px-5 py-3 transition-colors hover:bg-[var(--accent)]/50">
                    <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-transform duration-200 group-hover:scale-105 ${step.done ? "bg-emerald-100" : "bg-[var(--muted)]"}`}>
                      {step.done
                        ? <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                        : <step.icon className="h-4 w-4 text-[var(--muted-foreground)]" />
                      }
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium ${step.done ? "line-through text-[var(--muted-foreground)]" : ""}`}>
                        {step.label}
                      </p>
                      <p className="text-xs text-[var(--muted-foreground)]">{step.description}</p>
                    </div>
                    {!step.done && (
                      <ArrowRight className="h-4 w-4 shrink-0 text-[var(--muted-foreground)] opacity-0 transition-all duration-200 group-hover:translate-x-0.5 group-hover:opacity-100" />
                    )}
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Quick links grid */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { label: "Import CSV", href: "/members/import", icon: Upload, color: "text-blue-600", bg: "bg-blue-50" },
              { label: "Analytics", href: "/analytics", icon: BarChart3, color: "text-emerald-600", bg: "bg-emerald-50" },
              { label: "Site Builder", href: "/settings/template", icon: Globe, color: "text-rose-600", bg: "bg-rose-50" },
              { label: "Team", href: "/settings/team", icon: Users, color: "text-violet-600", bg: "bg-violet-50" },
            ].map((action) => (
              <Link
                key={action.label}
                href={action.href}
                className="group flex items-center gap-3 rounded-xl border border-[var(--border)] bg-[var(--card)] p-3.5 transition-all duration-200 hover:border-[var(--ring)]/30 hover:shadow-[var(--shadow-sm)] active:scale-[0.98]"
              >
                <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${action.bg} transition-transform duration-200 group-hover:scale-105`}>
                  <action.icon className={`h-4 w-4 ${action.color}`} />
                </div>
                <span className="text-sm font-medium">{action.label}</span>
              </Link>
            ))}
          </div>
        </div>

        {/* Activity sidebar */}
        <div className="overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--card)] shadow-[var(--shadow-sm)]">
          <div className="flex items-center justify-between border-b border-[var(--border)] px-5 py-3.5">
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-[var(--muted-foreground)]" />
              <h2 className="text-sm font-semibold">Recent Activity</h2>
            </div>
            {recentActivity.length > 0 && (
              <Link href="/analytics" className="text-xs font-medium text-[var(--primary)] hover:underline underline-offset-2 transition-colors">
                View all
              </Link>
            )}
          </div>
          {recentActivity.length === 0 ? (
            <div className="flex flex-col items-center justify-center px-5 py-10 text-center">
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[var(--muted)]">
                <Sparkles className="h-5 w-5 text-[var(--muted-foreground)]" />
              </div>
              <p className="text-sm font-medium">No activity yet</p>
              <p className="mt-1 text-xs text-[var(--muted-foreground)] max-w-[200px]">
                Activity will appear here as you manage members.
              </p>
              <Link href="/members/import" className="mt-4">
                <Button size="sm">
                  <Plus className="h-3.5 w-3.5" />
                  Import Members
                </Button>
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-[var(--border)]">
              {recentActivity.map((item: ActivityItem) => {
                const meta = ACTIVITY_META[item.type];
                const href = meta?.href?.(item);
                const inner = (
                  <div className={`flex items-start gap-3 px-5 py-3 transition-colors ${href ? "hover:bg-[var(--accent)]/50" : ""}`}>
                    <div className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md ${meta?.bg || "bg-[var(--muted)]"}`}>
                      <Clock className={`h-3.5 w-3.5 ${meta?.color || "text-[var(--muted-foreground)]"}`} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm leading-snug">{item.description}</p>
                      <p className="mt-0.5 text-[11px] text-[var(--muted-foreground)]">{timeAgo(item.createdAt)}</p>
                    </div>
                  </div>
                );
                return href ? (
                  <Link key={item.id} href={href} className="group block">{inner}</Link>
                ) : (
                  <div key={item.id}>{inner}</div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}
