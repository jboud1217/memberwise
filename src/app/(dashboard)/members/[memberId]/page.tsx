import { notFound } from "next/navigation";
import Link from "next/link";
import { getMember } from "@/actions/members";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { formatDate, formatCurrency } from "@/lib/utils";
import { Pencil } from "lucide-react";

const statusVariant: Record<string, "success" | "destructive" | "warning" | "secondary" | "outline"> = {
  ACTIVE: "success",
  LAPSED: "destructive",
  SUSPENDED: "warning",
  PROSPECT: "secondary",
  ARCHIVED: "outline",
};

export default async function MemberDetailPage({
  params,
}: {
  params: Promise<{ memberId: string }>;
}) {
  const { memberId } = await params;
  const member = await getMember(memberId);
  if (!member) notFound();

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{member.displayName}</h1>
          <div className="mt-1 flex items-center gap-2">
            <Badge variant={statusVariant[member.status] || "secondary"}>{member.status}</Badge>
            {member.tier && <span className="text-sm text-[var(--muted-foreground)]">{member.tier.name}</span>}
            {member.memberNumber && (
              <span className="text-sm text-[var(--muted-foreground)]">#{member.memberNumber}</span>
            )}
          </div>
        </div>
        <Link href={`/members/${memberId}/edit`}>
          <Button variant="outline">
            <Pencil className="h-4 w-4" />
            Edit
          </Button>
        </Link>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            {member.organizationName && (
              <div><span className="font-medium">Organization:</span> {member.organizationName}</div>
            )}
            {member.address1 && (
              <div>
                <span className="font-medium">Address:</span><br />
                {member.address1}<br />
                {member.address2 && <>{member.address2}<br /></>}
                {member.city}, {member.state} {member.zip}
              </div>
            )}
            {member.joinDate && (
              <div><span className="font-medium">Joined:</span> {formatDate(member.joinDate)}</div>
            )}
            {member.expirationDate && (
              <div><span className="font-medium">Expires:</span> {formatDate(member.expirationDate)}</div>
            )}
            {member.notes && (
              <div><span className="font-medium">Notes:</span> {member.notes}</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Contacts ({member.contacts.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {member.contacts.length === 0 ? (
              <p className="text-sm text-[var(--muted-foreground)]">No contacts linked to this member.</p>
            ) : (
              <div className="space-y-3">
                {member.contacts.map((contact) => (
                  <div key={contact.id} className="rounded-md border border-[var(--border)] p-3">
                    <div className="font-medium">
                      {contact.firstName} {contact.lastName}
                      {contact.isPrimary && <Badge variant="secondary" className="ml-2">Primary</Badge>}
                    </div>
                    {contact.email && <div className="text-sm text-[var(--muted-foreground)]">{contact.email}</div>}
                    {contact.phone && <div className="text-sm text-[var(--muted-foreground)]">{contact.phone}</div>}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg">Payment History</CardTitle>
          </CardHeader>
          <CardContent>
            {member.payments.length === 0 ? (
              <p className="text-sm text-[var(--muted-foreground)]">No payments recorded.</p>
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
                  {member.payments.map((payment) => (
                    <TableRow key={payment.id}>
                      <TableCell>{payment.paidAt ? formatDate(payment.paidAt) : "—"}</TableCell>
                      <TableCell>{formatCurrency(payment.amount)}</TableCell>
                      <TableCell>{payment.method}</TableCell>
                      <TableCell>
                        <Badge variant={payment.status === "COMPLETED" ? "success" : "secondary"}>
                          {payment.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-[var(--muted-foreground)]">{payment.description || "—"}</TableCell>
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
