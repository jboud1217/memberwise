import Link from "next/link";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { tenantPrisma } from "@/lib/prisma-tenant";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Plus, Mail } from "lucide-react";
import { formatDate } from "@/lib/utils";

const statusVariant: Record<string, "success" | "secondary" | "destructive" | "warning"> = {
  SENT: "success",
  DRAFT: "secondary",
  FAILED: "destructive",
  SENDING: "warning",
  SCHEDULED: "warning",
};

export default async function EmailPage() {
  const session = await auth();
  if (!session?.user?.organizationId) return null;
  const db = tenantPrisma(prisma, session.user.organizationId);

  const campaigns = await db.emailCampaign.findMany({
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Email Campaigns</h1>
          <p className="text-sm text-[var(--muted-foreground)]">{campaigns.length} campaigns</p>
        </div>
        <Link href="/email/new">
          <Button>
            <Plus className="h-4 w-4" />
            New Campaign
          </Button>
        </Link>
      </div>

      <Card>
        {campaigns.length === 0 ? (
          <CardContent className="py-12 text-center">
            <Mail className="mx-auto mb-4 h-12 w-12 text-[var(--muted-foreground)]" />
            <p className="text-lg font-medium">No campaigns yet</p>
            <p className="mt-1 text-sm text-[var(--muted-foreground)]">
              Create your first email campaign to engage your members.
            </p>
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
              </TableRow>
            </TableHeader>
            <TableBody>
              {campaigns.map((campaign) => (
                <TableRow key={campaign.id}>
                  <TableCell className="font-medium">{campaign.subject}</TableCell>
                  <TableCell>
                    <Badge variant={statusVariant[campaign.status] || "secondary"}>
                      {campaign.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{campaign.recipientCount}</TableCell>
                  <TableCell>{campaign.sentCount}</TableCell>
                  <TableCell>{campaign.openedCount}</TableCell>
                  <TableCell className="text-[var(--muted-foreground)]">
                    {formatDate(campaign.createdAt)}
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
