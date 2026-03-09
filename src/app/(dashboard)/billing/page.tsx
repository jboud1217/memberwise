import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { tenantPrisma } from "@/lib/prisma-tenant";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { formatCurrency, formatDate } from "@/lib/utils";
import { CreditCard } from "lucide-react";

export default async function BillingPage() {
  const session = await auth();
  if (!session?.user?.organizationId) return null;
  const db = tenantPrisma(prisma, session.user.organizationId);

  const recentPayments = await db.payment.findMany({
    orderBy: { createdAt: "desc" },
    take: 20,
    include: { member: true },
  });

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Billing & Payments</h1>
        <p className="text-sm text-[var(--muted-foreground)]">Manage dues and payment history</p>
      </div>

      <Card>
        {recentPayments.length === 0 ? (
          <CardContent className="py-12 text-center">
            <CreditCard className="mx-auto mb-4 h-12 w-12 text-[var(--muted-foreground)]" />
            <p className="text-lg font-medium">No payments yet</p>
            <p className="mt-1 text-sm text-[var(--muted-foreground)]">
              Payments will appear here as members pay their dues.
            </p>
          </CardContent>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Member</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Method</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentPayments.map((payment) => (
                <TableRow key={payment.id}>
                  <TableCell className="font-medium">{payment.member.displayName}</TableCell>
                  <TableCell>{formatCurrency(payment.amount)}</TableCell>
                  <TableCell>{payment.method}</TableCell>
                  <TableCell>
                    <Badge variant={payment.status === "COMPLETED" ? "success" : "secondary"}>
                      {payment.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-[var(--muted-foreground)]">
                    {payment.paidAt ? formatDate(payment.paidAt) : formatDate(payment.createdAt)}
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
