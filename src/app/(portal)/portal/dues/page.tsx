import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { tenantPrisma } from "@/lib/prisma-tenant";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { formatCurrency, formatDate } from "@/lib/utils";
import { CreditCard } from "lucide-react";

export default async function PortalDuesPage() {
  const session = await auth();
  if (!session?.user?.organizationId) {
    return <p className="py-12 text-center text-[var(--muted-foreground)]">Please log in to view dues.</p>;
  }

  const db = tenantPrisma(prisma, session.user.organizationId);

  // Find the member associated with this user's email
  const user = await prisma.user.findUnique({
    where: { id: session.user.id || "" },
    select: { email: true },
  });

  // Try to find a contact with this email and their linked member
  const contact = user?.email
    ? await db.contact.findFirst({
        where: { email: user.email },
        include: {
          member: {
            include: {
              tier: true,
              payments: { orderBy: { createdAt: "desc" }, take: 20 },
            },
          },
        },
      })
    : null;

  const member = contact?.member;

  return (
    <div>
      <h1 className="mb-8 text-2xl font-bold">Dues & Payments</h1>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Current Membership</CardTitle>
          </CardHeader>
          <CardContent>
            {member ? (
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Badge variant={member.status === "ACTIVE" ? "success" : "secondary"}>{member.status}</Badge>
                  {member.tier && <span className="text-sm font-medium">{member.tier.name}</span>}
                  {member.tier && member.tier.price > 0 && (
                    <span className="text-sm text-[var(--muted-foreground)]">
                      {formatCurrency(member.tier.price)} / {member.tier.billingInterval.toLowerCase().replace("_", " ")}
                    </span>
                  )}
                </div>
                {member.expirationDate && (
                  <p className="text-sm text-[var(--muted-foreground)]">
                    Expires: {formatDate(member.expirationDate)}
                  </p>
                )}
                {member.renewalDate && (
                  <p className="text-sm text-[var(--muted-foreground)]">
                    Next renewal: {formatDate(member.renewalDate)}
                  </p>
                )}
              </div>
            ) : (
              <p className="text-sm text-[var(--muted-foreground)]">
                Your membership details will appear here once your account is linked to a member record.
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Payment History</CardTitle>
          </CardHeader>
          <CardContent>
            {!member || member.payments.length === 0 ? (
              <div className="flex flex-col items-center py-6 text-center">
                <CreditCard className="mb-3 h-8 w-8 text-[var(--muted-foreground)]" />
                <p className="text-sm text-[var(--muted-foreground)]">No payments found.</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Method</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Description</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {member.payments.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell>{p.paidAt ? formatDate(p.paidAt) : "—"}</TableCell>
                      <TableCell>{formatCurrency(p.amount)}</TableCell>
                      <TableCell>{p.method}</TableCell>
                      <TableCell>
                        <Badge variant={p.status === "COMPLETED" ? "success" : "secondary"}>{p.status}</Badge>
                      </TableCell>
                      <TableCell className="text-[var(--muted-foreground)]">{p.description || "—"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
