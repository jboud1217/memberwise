import type { Metadata } from "next";
import { getDonations, getDonationCampaigns, getDonationStats } from "@/actions/donations";
import { getMembers } from "@/actions/members";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Heart,
  DollarSign,
  Users,
  TrendingUp,
} from "lucide-react";
import { format } from "date-fns";
import { DonationActions } from "./donation-actions";

function formatCurrency(cents: number): string {
  return `$${(cents / 100).toLocaleString("en-US", { minimumFractionDigits: 2 })}`;
}

export const metadata: Metadata = { title: "Donations" };

export default async function DonationsPage() {
  const [{ donations, total }, campaigns, stats, { members: memberList }] = await Promise.all([
    getDonations({ pageSize: 25 }),
    getDonationCampaigns(),
    getDonationStats(),
    getMembers({ pageSize: 200 }),
  ]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Donations</h1>
          <p className="text-sm text-[var(--muted-foreground)]">
            Track donations, manage fundraising campaigns, and generate tax receipts
          </p>
        </div>
        <DonationActions
          campaigns={campaigns.map((c) => ({ id: c.id, name: c.name }))}
          members={memberList.map((m) => ({ id: m.id, displayName: m.displayName || "" }))}
        />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5 stagger-children">
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="rounded-lg bg-green-50 p-2">
              <DollarSign className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <div className="text-2xl font-bold">{formatCurrency(stats.totalRaised)}</div>
              <div className="text-xs text-[var(--muted-foreground)]">Total Raised</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="rounded-lg bg-blue-50 p-2">
              <TrendingUp className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <div className="text-2xl font-bold">{formatCurrency(stats.ytdRaised)}</div>
              <div className="text-xs text-[var(--muted-foreground)]">Year to Date</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="rounded-lg bg-purple-50 p-2">
              <DollarSign className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <div className="text-2xl font-bold">{formatCurrency(stats.thisMonth)}</div>
              <div className="text-xs text-[var(--muted-foreground)]">This Month</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="rounded-lg bg-amber-50 p-2">
              <Users className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <div className="text-2xl font-bold">{stats.uniqueDonors}</div>
              <div className="text-xs text-[var(--muted-foreground)]">Unique Donors</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="rounded-lg bg-red-50 p-2">
              <Heart className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <div className="text-2xl font-bold">{stats.activeCampaigns}</div>
              <div className="text-xs text-[var(--muted-foreground)]">Active Campaigns</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Campaigns */}
      {campaigns.length > 0 && (
        <div>
          <h2 className="mb-3 text-lg font-semibold">Fundraising Campaigns</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 stagger-children">
            {campaigns.map((campaign) => {
              const progress = campaign.goalAmount
                ? Math.min(100, Math.round((campaign.raisedAmount / campaign.goalAmount) * 100))
                : null;

              return (
                <Card key={campaign.id} className="transition-all hover:shadow-[var(--shadow-sm)] hover:border-[var(--ring)]/20">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <h3 className="font-semibold">{campaign.name}</h3>
                      <Badge variant={campaign.isActive ? "default" : "secondary"}>
                        {campaign.isActive ? "Active" : "Ended"}
                      </Badge>
                    </div>
                    {campaign.description && (
                      <p className="mt-1 line-clamp-2 text-sm text-[var(--muted-foreground)]">
                        {campaign.description}
                      </p>
                    )}
                    <div className="mt-3">
                      <div className="flex items-baseline justify-between text-sm">
                        <span className="font-medium">{formatCurrency(campaign.raisedAmount)}</span>
                        {campaign.goalAmount && (
                          <span className="text-[var(--muted-foreground)]">
                            of {formatCurrency(campaign.goalAmount)} goal
                          </span>
                        )}
                      </div>
                      {progress !== null && (
                        <div className="mt-1 h-2 overflow-hidden rounded-full bg-[var(--muted)]">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-green-500 to-emerald-400 transition-all duration-500"
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                      )}
                    </div>
                    <div className="mt-2 text-xs text-[var(--muted-foreground)]">
                      {campaign._count.donations} donations
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* Recent Donations */}
      {donations.length === 0 && campaigns.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <Heart className="mb-4 h-12 w-12 text-[var(--muted-foreground)]" />
            <h3 className="mb-2 text-lg font-semibold">No donations yet</h3>
            <p className="mb-6 max-w-sm text-sm text-[var(--muted-foreground)]">
              Start tracking donations, create fundraising campaigns, and manage donor relationships.
            </p>
            <DonationActions
              campaigns={[]}
              members={memberList.map((m) => ({ id: m.id, displayName: m.displayName || "" }))}
            />
          </CardContent>
        </Card>
      ) : (
        <div>
          <h2 className="mb-3 text-lg font-semibold">Recent Donations</h2>
          <Card>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-[var(--muted-foreground)]">
                    <th className="px-4 py-3 font-medium">Date</th>
                    <th className="px-4 py-3 font-medium">Donor</th>
                    <th className="px-4 py-3 font-medium">Campaign</th>
                    <th className="px-4 py-3 font-medium">Type</th>
                    <th className="px-4 py-3 text-right font-medium">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {donations.map((donation) => (
                    <tr key={donation.id} className="border-b last:border-0 transition-colors hover:bg-[var(--accent)]/50">
                      <td className="px-4 py-3">
                        {donation.paidAt ? format(new Date(donation.paidAt), "MMM d, yyyy") : "—"}
                      </td>
                      <td className="px-4 py-3">
                        {donation.isAnonymous
                          ? "Anonymous"
                          : donation.donorName || donation.member?.displayName || "—"}
                      </td>
                      <td className="px-4 py-3">{donation.campaign?.name || "—"}</td>
                      <td className="px-4 py-3">
                        <Badge variant="secondary" className="text-[10px]">
                          {donation.type === "RECURRING" ? "Recurring" : "One-time"}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-right font-medium">
                        {formatCurrency(donation.amount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
