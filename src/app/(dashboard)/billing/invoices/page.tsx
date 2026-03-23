import type { Metadata } from "next";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { tenantPrisma } from "@/lib/prisma-tenant";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { formatCurrency, formatDate } from "@/lib/utils";
import { FileText, ArrowUpRight } from "lucide-react";
import Link from "next/link";

export const metadata: Metadata = { title: "Invoices" };

const statusVariant: Record<string, "default" | "success" | "destructive" | "secondary"> = {
  DRAFT: "secondary",
  SENT: "default",
  PAID: "success",
  OVERDUE: "destructive",
  CANCELLED: "secondary",
};

export default async function InvoicesPage() {
  const session = await auth();
  if (!session?.user?.organizationId) redirect("/login");
  const db = tenantPrisma(prisma, session.user.organizationId);

  const invoices = await db.invoice.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
    include: { member: { select: { id: true, displayName: true } } },
  });

  const totalOutstanding = invoices
    .filter((i) => i.status === "SENT" || i.status === "OVERDUE")
    .reduce((sum, i) => sum + i.amount, 0);

  const totalPaid = invoices
    .filter((i) => i.status === "PAID")
    .reduce((sum, i) => sum + i.amount, 0);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Invoices</h1>
        <p className="mt-0.5 text-sm text-[var(--muted-foreground)]">
          View and manage member invoices.
        </p>
      </div>

      {/* Summary */}
      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-3 stagger-children">
        {[
          { label: "Total Invoices", value: String(invoices.length) },
          { label: "Outstanding", value: formatCurrency(totalOutstanding) },
          { label: "Collected", value: formatCurrency(totalPaid) },
        ].map((card) => (
          <div
            key={card.label}
            className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-4"
          >
            <p className="text-xs text-[var(--muted-foreground)]">{card.label}</p>
            <p className="text-xl font-bold">{card.value}</p>
          </div>
        ))}
      </div>

      <Card className="overflow-hidden">
        {invoices.length === 0 ? (
          <CardContent className="py-16 text-center">
            <FileText className="mx-auto mb-3 h-10 w-10 text-[var(--muted-foreground)]/40" />
            <p className="text-base font-medium">No invoices yet</p>
            <p className="mt-1 text-sm text-[var(--muted-foreground)]">
              Invoices will appear here when generated for members.
            </p>
          </CardContent>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Invoice #</TableHead>
                <TableHead>Member</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Due Date</TableHead>
                <TableHead>Created</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoices.map((invoice) => (
                <TableRow
                  key={invoice.id}
                  className="group transition-colors hover:bg-[var(--accent)]/50"
                >
                  <TableCell className="font-medium">
                    {invoice.number || invoice.id.slice(0, 8)}
                  </TableCell>
                  <TableCell>
                    <Link
                      href={`/members/${invoice.member.id}`}
                      className="inline-flex items-center gap-1.5 font-medium text-[var(--foreground)] hover:text-[var(--primary)] transition-colors"
                    >
                      {invoice.member.displayName}
                      <ArrowUpRight className="h-3 w-3 opacity-0 group-hover:opacity-60 transition-opacity" />
                    </Link>
                  </TableCell>
                  <TableCell className="font-medium">
                    {formatCurrency(invoice.amount)}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={statusVariant[invoice.status] || "secondary"}
                      className="text-xs"
                    >
                      {invoice.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-[var(--muted-foreground)]">
                    {invoice.dueDate ? formatDate(invoice.dueDate) : "—"}
                  </TableCell>
                  <TableCell className="text-sm text-[var(--muted-foreground)]">
                    {formatDate(invoice.createdAt)}
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
