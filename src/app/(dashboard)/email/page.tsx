import type { Metadata } from "next";
import Link from "next/link";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { tenantPrisma } from "@/lib/prisma-tenant";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Plus, Mail, Settings, AlertTriangle } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { CampaignActions } from "./campaign-actions";

const statusVariant: Record<string, "success" | "secondary" | "destructive" | "warning"> = {
  SENT: "success",
  DRAFT: "secondary",
  FAILED: "destructive",
  SENDING: "warning",
  SCHEDULED: "warning",
};

const statusLabel: Record<string, string> = {
  SENT: "Sent",
  DRAFT: "Draft",
  FAILED: "Failed",
  SENDING: "Sending...",
  SCHEDULED: "Scheduled",
};

export const metadata: Metadata = { title: "Email Campaigns" };

export default async function EmailPage() {
  const session = await auth();
  if (!session?.user?.organizationId) redirect("/login");
  const db = tenantPrisma(prisma, session.user.organizationId);

  const [campaigns, org] = await Promise.all([
    db.emailCampaign.findMany({
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
    prisma.organization.findUnique({
      where: { id: session.user.organizationId },
      select: { emailProvider: true },
    }),
  ]);

  const emailConfigured = !!org?.emailProvider;

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Email Campaigns</h1>
          <p className="text-sm text-[var(--muted-foreground)]">
            {campaigns.length} campaign{campaigns.length !== 1 ? "s" : ""}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/settings/email">
            <Button variant="outline" size="sm">
              <Settings className="h-3.5 w-3.5" />
              Email Settings
            </Button>
          </Link>
          <Link href="/email/new">
            <Button>
              <Plus className="h-4 w-4" />
              New Campaign
            </Button>
          </Link>
        </div>
      </div>

      {/* Warning if email not configured */}
      {!emailConfigured && (
        <div className="mb-4 flex items-center gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
          <AlertTriangle className="h-5 w-5 shrink-0 text-amber-600" />
          <div className="flex-1">
            <p className="text-sm font-medium text-amber-800">Email provider not configured</p>
            <p className="text-xs text-amber-600">
              Connect an email service in Settings to send campaigns to your members.
            </p>
          </div>
          <Link href="/settings/email">
            <Button size="sm" variant="outline" className="border-amber-300 text-amber-700 hover:bg-amber-100">
              Configure
            </Button>
          </Link>
        </div>
      )}

      <Card>
        {campaigns.length === 0 ? (
          <CardContent className="py-12 text-center">
            <Mail className="mx-auto mb-4 h-12 w-12 text-[var(--muted-foreground)]" />
            <p className="text-lg font-medium">No campaigns yet</p>
            <p className="mt-1 text-sm text-[var(--muted-foreground)]">
              Create your first email campaign to engage your members.
            </p>
            <Link href="/email/new" className="mt-4 inline-block">
              <Button>
                <Plus className="h-4 w-4" /> Create Campaign
              </Button>
            </Link>
          </CardContent>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Subject</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Recipients</TableHead>
                <TableHead>Sent</TableHead>
                <TableHead>Opened</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="w-10"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {campaigns.map((campaign) => (
                <TableRow key={campaign.id} className="transition-colors hover:bg-[var(--accent)]/50">
                  <TableCell className="font-medium">
                    {campaign.subject}
                    {campaign.status === "SCHEDULED" && campaign.scheduledAt && (
                      <span className="ml-2 text-xs text-[var(--muted-foreground)]">
                        → {formatDate(campaign.scheduledAt)}
                      </span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant={statusVariant[campaign.status] || "secondary"}>
                      {statusLabel[campaign.status] || campaign.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{campaign.recipientCount}</TableCell>
                  <TableCell>{campaign.sentCount}</TableCell>
                  <TableCell>
                    {campaign.sentCount > 0 ? (
                      <span>
                        {campaign.openedCount}
                        <span className="ml-1 text-xs text-[var(--muted-foreground)]">
                          ({campaign.sentCount > 0 ? Math.round((campaign.openedCount / campaign.sentCount) * 100) : 0}%)
                        </span>
                      </span>
                    ) : (
                      "—"
                    )}
                  </TableCell>
                  <TableCell className="text-[var(--muted-foreground)]">
                    {formatDate(campaign.sentAt || campaign.createdAt)}
                  </TableCell>
                  <TableCell>
                    <CampaignActions
                      campaignId={campaign.id}
                      status={campaign.status}
                      emailConfigured={emailConfigured}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>
    </div>
  );
}
