import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { tenantPrisma } from "@/lib/prisma-tenant";
import { getRevenueStats } from "@/actions/payments";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import { Users, UserCheck, UserX, UserPlus, ContactRound, ArrowUpRight, TrendingUp, TrendingDown } from "lucide-react";
import Link from "next/link";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export default async function AnalyticsPage() {
  const session = await auth();
  if (!session?.user?.organizationId) return null;
  const db = tenantPrisma(prisma, session.user.organizationId);

  const [totalMembers, activeMembers, lapsedMembers, suspendedMembers, prospects, totalContacts, revenue] =
    await Promise.all([
      db.member.count({}),
      db.member.count({ where: { status: "ACTIVE" } }),
      db.member.count({ where: { status: "LAPSED" } }),
      db.member.count({ where: { status: "SUSPENDED" } }),
      db.member.count({ where: { status: "PROSPECT" } }),
      db.contact.count({}),
      getRevenueStats(),
    ]);

  const stats = [
    { label: "Total Members", value: totalMembers, icon: Users, href: "/members", color: "text-indigo-600", bg: "bg-indigo-50", gradient: "from-indigo-500 to-indigo-600" },
    { label: "Active", value: activeMembers, icon: UserCheck, href: "/members?status=ACTIVE", color: "text-emerald-600", bg: "bg-emerald-50", gradient: "from-emerald-500 to-emerald-600" },
    { label: "Lapsed", value: lapsedMembers, icon: UserX, href: "/members?status=LAPSED", color: "text-red-600", bg: "bg-red-50", gradient: "from-red-500 to-red-600" },
    { label: "Prospects", value: prospects, icon: UserPlus, href: "/members?status=PROSPECT", color: "text-amber-600", bg: "bg-amber-50", gradient: "from-amber-500 to-amber-600" },
    { label: "Contacts", value: totalContacts, icon: ContactRound, href: "/contacts", color: "text-violet-600", bg: "bg-violet-50", gradient: "from-violet-500 to-violet-600" },
  ];

  const statusBreakdown = [
    { label: "Active", value: activeMembers, color: "bg-emerald-500", href: "/members?status=ACTIVE" },
    { label: "Lapsed", value: lapsedMembers, color: "bg-red-500", href: "/members?status=LAPSED" },
    { label: "Suspended", value: suspendedMembers, color: "bg-amber-500", href: "/members?status=SUSPENDED" },
    { label: "Prospects", value: prospects, color: "bg-slate-400", href: "/members?status=PROSPECT" },
  ];

  const maxMonthly = Math.max(...revenue.monthlyRevenue, 1);
  const revenueChange = revenue.totalLastYear > 0
    ? ((revenue.totalYTD - revenue.totalLastYear) / revenue.totalLastYear) * 100
    : 0;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Analytics</h1>
        <p className="mt-0.5 text-sm text-[var(--muted-foreground)]">Membership and revenue insights</p>
      </div>

      {/* Stats */}
      <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {stats.map((stat) => (
          <Link
            key={stat.label}
            href={stat.href}
            className="group flex items-center gap-3 rounded-xl border border-[var(--border)] bg-[var(--card)] p-4 transition-all duration-200 hover:shadow-[var(--shadow-md)] hover:border-[var(--ring)]/30"
          >
            <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${stat.gradient} shadow-sm`}>
              <stat.icon className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-xs text-[var(--muted-foreground)]">{stat.label}</p>
              <p className="text-2xl font-bold">{stat.value.toLocaleString()}</p>
            </div>
            <ArrowUpRight className="ml-auto h-4 w-4 shrink-0 text-[var(--muted-foreground)] opacity-0 transition-opacity group-hover:opacity-60" />
          </Link>
        ))}
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        {/* Status breakdown */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold">Members by Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {statusBreakdown.map((item) => (
                <Link key={item.label} href={item.href} className="block group">
                  <div className="mb-1.5 flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div className={`h-2.5 w-2.5 rounded-full ${item.color}`} />
                      <span className="font-medium group-hover:text-[var(--primary)] transition-colors">{item.label}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">{item.value}</span>
                      <span className="text-xs text-[var(--muted-foreground)]">
                        ({totalMembers > 0 ? Math.round((item.value / totalMembers) * 100) : 0}%)
                      </span>
                    </div>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-[var(--muted)]">
                    <div
                      className={`h-full rounded-full ${item.color} transition-all duration-700`}
                      style={{ width: `${totalMembers > 0 ? (item.value / totalMembers) * 100 : 0}%` }}
                    />
                  </div>
                </Link>
              ))}
            </div>
            {/* Stacked bar summary */}
            {totalMembers > 0 && (
              <div className="mt-5 flex h-3 overflow-hidden rounded-full">
                {statusBreakdown.map((item) => (
                  <div
                    key={item.label}
                    className={`${item.color} transition-all duration-700`}
                    style={{ width: `${(item.value / totalMembers) * 100}%` }}
                    title={`${item.label}: ${item.value}`}
                  />
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Revenue */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold">Revenue Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-5 grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-[var(--muted-foreground)]">This Year</p>
                <div className="flex items-baseline gap-2">
                  <p className="text-2xl font-bold">{formatCurrency(revenue.totalYTD)}</p>
                  {revenueChange !== 0 && (
                    <span className={`inline-flex items-center gap-0.5 text-xs font-medium ${revenueChange > 0 ? "text-emerald-600" : "text-red-500"}`}>
                      {revenueChange > 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                      {Math.abs(Math.round(revenueChange))}%
                    </span>
                  )}
                </div>
              </div>
              <div>
                <p className="text-xs text-[var(--muted-foreground)]">Last Year</p>
                <p className="text-2xl font-bold text-[var(--muted-foreground)]">{formatCurrency(revenue.totalLastYear)}</p>
              </div>
            </div>
            <div className="flex items-end gap-1 h-36">
              {revenue.monthlyRevenue.map((amount, i) => {
                const height = (amount / maxMonthly) * 100;
                const currentMonth = new Date().getMonth();
                return (
                  <div key={i} className="flex flex-1 flex-col items-center gap-1.5">
                    <div
                      className={`w-full rounded-t transition-all duration-500 ${
                        i === currentMonth
                          ? "bg-gradient-to-t from-indigo-500 to-indigo-400"
                          : "bg-gradient-to-t from-indigo-500/60 to-purple-500/40"
                      }`}
                      style={{ height: `${height}%`, minHeight: amount > 0 ? 4 : 0 }}
                      title={`${MONTHS[i]}: ${formatCurrency(amount)}`}
                    />
                    <span className={`text-[10px] ${i === currentMonth ? "font-semibold text-[var(--foreground)]" : "text-[var(--muted-foreground)]"}`}>
                      {MONTHS[i]}
                    </span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Payment methods */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold">Payments by Method</CardTitle>
          </CardHeader>
          <CardContent>
            {revenue.byMethod.length === 0 ? (
              <p className="text-sm text-[var(--muted-foreground)]">No payments recorded yet.</p>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {revenue.byMethod.map((item) => (
                  <div key={item.method} className="rounded-xl border border-[var(--border)] bg-[var(--muted)]/30 p-4">
                    <p className="text-sm font-semibold">{item.method}</p>
                    <p className="mt-1 text-2xl font-bold">{formatCurrency(item._sum.amount || 0)}</p>
                    <p className="mt-0.5 text-xs text-[var(--muted-foreground)]">{item._count} payment{item._count !== 1 ? "s" : ""}</p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
