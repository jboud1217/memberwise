import type { Metadata } from "next";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { tenantPrisma } from "@/lib/prisma-tenant";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { formatCurrency, formatDate } from "@/lib/utils";
import { CreditCard, DollarSign, TrendingUp, Receipt, ArrowUpRight } from "lucide-react";
import { RecordPaymentButton } from "./record-payment";
import Link from "next/link";

export const metadata: Metadata = { title: "Billing" };

export default async function BillingPage() {
  const session = await auth();
  if (!session?.user?.organizationId) redirect("/login");
  const db = tenantPrisma(prisma, session.user.organizationId);

  const [recentPayments, members] = await Promise.all([
    db.payment.findMany({
      orderBy: { createdAt: "desc" },
      take: 50,
      include: { member: true },
    }),
    db.member.findMany({ orderBy: { displayName: "asc" }, select: { id: true, displayName: true } }),
  ]);

  const completed = recentPayments.filter((p) => p.status === "COMPLETED");
  const totalRevenue = completed.reduce((sum, p) => sum + p.amount, 0);
  const avgPayment = completed.length > 0 ? totalRevenue / completed.length : 0;

  const methodCounts: Record<string, number> = {};
  for (const p of completed) methodCounts[p.method] = (methodCounts[p.method] || 0) + 1;
  const topMethod = Object.entries(methodCounts).sort((a, b) => b[1] - a[1])[0];

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Billing & Payments</h1>
          <p className="mt-0.5 text-sm text-[var(--muted-foreground)]">Track payments and manage your revenue.</p>
        </div>
        <RecordPaymentButton members={members.map((m) => ({ id: m.id, displayName: m.displayName }))} />
      </div>

      {/* Summary cards */}
      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4 stagger-children">
        {[
          { label: "Total Revenue", value: formatCurrency(totalRevenue), icon: DollarSign, gradient: "from-emerald-500 to-teal-600" },
          { label: "Payments", value: String(recentPayments.length), icon: Receipt, gradient: "from-indigo-500 to-purple-600" },
          { label: "Avg Payment", value: formatCurrency(avgPayment), icon: TrendingUp, gradient: "from-amber-500 to-orange-600" },
          { label: "Top Method", value: topMethod ? topMethod[0] : "—", icon: CreditCard, gradient: "from-rose-500 to-pink-600" },
        ].map((card) => (
          <div key={card.label} className="flex items-center gap-3 rounded-xl border border-[var(--border)] bg-[var(--card)] p-4">
            <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${card.gradient} shadow-sm`}>
              <card.icon className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-xs text-[var(--muted-foreground)]">{card.label}</p>
              <p className="text-xl font-bold">{card.value}</p>
            </div>
          </div>
        ))}
      </div>

      <Card className="overflow-hidden">
        {recentPayments.length === 0 ? (
          <CardContent className="py-16 text-center">
            <CreditCard className="mx-auto mb-3 h-10 w-10 text-[var(--muted-foreground)]/40" />
            <p className="text-base font-medium">No payments yet</p>
            <p className="mt-1 text-sm text-[var(--muted-foreground)]">Payments will appear here as members pay their dues.</p>
          </CardContent>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Member</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Method</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentPayments.map((payment) => (
                <TableRow key={payment.id} className="group transition-colors hover:bg-[var(--accent)]/50">
                  <TableCell>
                    <Link href={`/members/${payment.member.id}`} className="inline-flex items-center gap-1.5 font-medium text-[var(--foreground)] hover:text-[var(--primary)] transition-colors">
                      {payment.member.displayName}
                      <ArrowUpRight className="h-3 w-3 opacity-0 group-hover:opacity-60 transition-opacity" />
                    </Link>
                  </TableCell>
                  <TableCell className="font-medium">{formatCurrency(payment.amount)}</TableCell>
                  <TableCell>
                    <span className="inline-flex items-center rounded-md bg-[var(--muted)] px-2 py-0.5 text-xs font-medium">{payment.method}</span>
                  </TableCell>
                  <TableCell>
                    <Badge variant={payment.status === "COMPLETED" ? "success" : "secondary"} className="text-xs">{payment.status}</Badge>
                  </TableCell>
                  <TableCell className="text-sm text-[var(--muted-foreground)]">{payment.description || "—"}</TableCell>
                  <TableCell className="text-sm text-[var(--muted-foreground)]">
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
