import type { Metadata } from "next";
import { getMembershipReport, getRevenueReport, getEngagementReport } from "@/actions/reports";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  BarChart3,
  Users,
  DollarSign,
  TrendingUp,
  Download,
  AlertTriangle,
  ArrowUp,
  ArrowDown,
  FileDown,
} from "lucide-react";

function formatCurrency(cents: number): string {
  return `$${(cents / 100).toLocaleString("en-US", { minimumFractionDigits: 2 })}`;
}

export const metadata: Metadata = { title: "Reports" };

export default async function ReportsPage() {
  const [membership, revenue, engagement] = await Promise.all([
    getMembershipReport(),
    getRevenueReport(),
    getEngagementReport(),
  ]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Reports</h1>
          <p className="text-sm text-[var(--muted-foreground)]">
            Membership analytics, revenue insights, and engagement metrics
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <FileDown className="mr-2 h-4 w-4" />
            Export Members
          </Button>
          <Button variant="outline">
            <FileDown className="mr-2 h-4 w-4" />
            Export Payments
          </Button>
        </div>
      </div>

      {/* Alert Cards */}
      <div className="grid grid-cols-2 gap-4">
        {membership.renewalsDue > 0 && (
          <Card className="border-amber-200 bg-amber-50">
            <CardContent className="flex items-center gap-3 p-4">
              <AlertTriangle className="h-5 w-5 text-amber-600" />
              <div>
                <div className="font-medium text-amber-900">{membership.renewalsDue} renewals due</div>
                <div className="text-xs text-amber-700">in the next 30 days</div>
              </div>
            </CardContent>
          </Card>
        )}
        {membership.expiringMembers > 0 && (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="flex items-center gap-3 p-4">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              <div>
                <div className="font-medium text-red-900">{membership.expiringMembers} expired members</div>
                <div className="text-xs text-red-700">still marked as active</div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Membership Report */}
      <div>
        <h2 className="mb-3 text-lg font-semibold">Membership Overview</h2>
        <div className="grid gap-4 lg:grid-cols-2">
          {/* By Status */}
          <Card>
            <CardContent className="p-5">
              <h3 className="mb-4 font-medium">Members by Status</h3>
              <div className="space-y-3">
                {membership.byStatus.map((s) => (
                  <div key={s.status} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`h-3 w-3 rounded-full ${
                        s.status === "ACTIVE" ? "bg-green-500" :
                        s.status === "LAPSED" ? "bg-red-500" :
                        s.status === "PROSPECT" ? "bg-blue-500" :
                        s.status === "SUSPENDED" ? "bg-amber-500" :
                        "bg-gray-400"
                      }`} />
                      <span className="text-sm">{s.status}</span>
                    </div>
                    <span className="font-medium">{s.count}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* By Tier */}
          <Card>
            <CardContent className="p-5">
              <h3 className="mb-4 font-medium">Members by Tier</h3>
              {membership.byTier.length === 0 ? (
                <p className="text-sm text-[var(--muted-foreground)]">No tier data yet</p>
              ) : (
                <div className="space-y-3">
                  {membership.byTier.map((t) => (
                    <div key={t.tierId} className="flex items-center justify-between">
                      <span className="text-sm">{t.tierName}</span>
                      <span className="font-medium">{t.count}</span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Revenue Report */}
      <div>
        <h2 className="mb-3 text-lg font-semibold">Revenue</h2>
        <div className="grid gap-4 lg:grid-cols-3 stagger-children">
          <Card>
            <CardContent className="p-5">
              <div className="text-sm text-[var(--muted-foreground)]">Total Revenue</div>
              <div className="mt-1 text-3xl font-bold">{formatCurrency(revenue.totalRevenue)}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5">
              <div className="text-sm text-[var(--muted-foreground)]">Year to Date</div>
              <div className="mt-1 text-3xl font-bold">{formatCurrency(revenue.ytdRevenue)}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5">
              <div className="mb-3 text-sm text-[var(--muted-foreground)]">Revenue by Method</div>
              <div className="space-y-2">
                {revenue.byMethod.map((m) => (
                  <div key={m.method} className="flex items-center justify-between text-sm">
                    <span>{m.method}</span>
                    <span className="font-medium">{formatCurrency(m.total)} ({m.count})</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Monthly trend */}
        {revenue.monthlyRevenue.length > 0 && (
          <Card className="mt-4">
            <CardContent className="p-5">
              <h3 className="mb-4 font-medium">Monthly Revenue (YTD)</h3>
              <div className="flex items-end gap-2" style={{ height: 120 }}>
                {revenue.monthlyRevenue.map((m) => {
                  const max = Math.max(...revenue.monthlyRevenue.map((r) => r.total), 1);
                  const height = Math.max(4, (m.total / max) * 100);
                  return (
                    <div key={m.month} className="flex flex-1 flex-col items-center gap-1">
                      <span className="text-[10px] text-[var(--muted-foreground)]">
                        {formatCurrency(m.total)}
                      </span>
                      <div
                        className="w-full rounded-t bg-gradient-to-t from-indigo-500 to-blue-400 transition-all duration-300"
                        style={{ height: `${height}%` }}
                      />
                      <span className="text-[10px] text-[var(--muted-foreground)]">
                        {m.month.split("-")[1]}
                      </span>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Engagement Report */}
      <div>
        <h2 className="mb-3 text-lg font-semibold">Engagement</h2>
        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardContent className="p-5">
              <h3 className="mb-4 font-medium">Engagement Distribution</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full bg-green-500" />
                    <span className="text-sm">High (80-100)</span>
                  </div>
                  <span className="font-medium">{engagement.scoreDistribution.high}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full bg-blue-500" />
                    <span className="text-sm">Medium (50-79)</span>
                  </div>
                  <span className="font-medium">{engagement.scoreDistribution.medium}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full bg-amber-500" />
                    <span className="text-sm">Low (20-49)</span>
                  </div>
                  <span className="font-medium">{engagement.scoreDistribution.low}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full bg-red-500" />
                    <span className="text-sm">Inactive (0-19)</span>
                  </div>
                  <span className="font-medium">{engagement.scoreDistribution.inactive}</span>
                </div>
              </div>
              <div className="mt-4 rounded-lg bg-[var(--muted)] p-3 text-xs text-[var(--muted-foreground)]">
                {engagement.disengagedCount} active members have low engagement (&lt;20)
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-5">
              <h3 className="mb-4 font-medium">Top Engaged Members</h3>
              <div className="space-y-2">
                {engagement.topEngaged.map((m, i) => (
                  <div key={m.id} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[var(--muted)] text-[10px] font-medium">
                        {i + 1}
                      </span>
                      <span>{m.displayName}</span>
                    </div>
                    <Badge variant="secondary">{m.engagementScore}</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
