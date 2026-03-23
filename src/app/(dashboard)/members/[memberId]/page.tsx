import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { getMember } from "@/actions/members";
import { getActivityForMember } from "@/actions/activity";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { formatDate, formatCurrency } from "@/lib/utils";
import {
  Pencil,
  MailX,
  Mail,
  Clock,
  ArrowLeft,
  MapPin,
  Calendar,
  CreditCard,
  Users,
  FileText,
  Phone,
  Building2,
  Hash,
} from "lucide-react";
import { AddContactButton } from "@/app/(dashboard)/contacts/add-contact";
import { RecordPaymentButton } from "@/app/(dashboard)/billing/record-payment";

const statusVariant: Record<string, "success" | "destructive" | "warning" | "secondary" | "outline"> = {
  ACTIVE: "success",
  LAPSED: "destructive",
  SUSPENDED: "warning",
  PROSPECT: "secondary",
  ARCHIVED: "outline",
};

const AVATAR_COLORS = [
  "from-indigo-400 to-indigo-600",
  "from-emerald-400 to-emerald-600",
  "from-amber-400 to-amber-600",
  "from-rose-400 to-rose-600",
  "from-violet-400 to-violet-600",
  "from-cyan-400 to-cyan-600",
];

function getInitials(name: string): string {
  return name.split(/\s+/).slice(0, 2).map((w) => w[0]).join("").toUpperCase();
}

function getAvatarColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function timeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return formatDate(date);
}

export const metadata: Metadata = { title: "Member Details" };

export default async function MemberDetailPage({
  params,
}: {
  params: Promise<{ memberId: string }>;
}) {
  const { memberId } = await params;
  const [member, activity] = await Promise.all([
    getMember(memberId),
    getActivityForMember(memberId, 15),
  ]);
  if (!member) notFound();

  const totalPaid = member.payments
    .filter((p) => p.status === "COMPLETED")
    .reduce((sum, p) => sum + p.amount, 0);

  return (
    <div>
      {/* Back link */}
      <Link
        href="/members"
        className="mb-4 inline-flex items-center gap-1.5 text-sm text-[var(--muted-foreground)] transition-colors hover:text-[var(--foreground)]"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Back to Members
      </Link>

      {/* Header */}
      <div className="mb-6 flex items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className={`flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br ${getAvatarColor(member.displayName)} text-lg font-bold text-white shadow-md`}>
            {getInitials(member.displayName)}
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{member.displayName}</h1>
            <div className="mt-1.5 flex flex-wrap items-center gap-2">
              <Badge variant={statusVariant[member.status] || "secondary"}>{member.status}</Badge>
              {member.tier && (
                <Link href={`/members?tierName=${encodeURIComponent(member.tier.name)}`} className="text-sm text-[var(--primary)] hover:underline underline-offset-2">
                  {member.tier.name}
                </Link>
              )}
              {member.memberNumber && (
                <span className="flex items-center gap-1 text-sm text-[var(--muted-foreground)]">
                  <Hash className="h-3 w-3" />{member.memberNumber}
                </span>
              )}
              {member.doNotEmail && (
                <Badge variant="outline" className="text-red-500 border-red-200 text-xs">
                  <MailX className="mr-1 h-3 w-3" /> No Email
                </Badge>
              )}
              {member.doNotMail && (
                <Badge variant="outline" className="text-red-500 border-red-200 text-xs">
                  <Mail className="mr-1 h-3 w-3" /> No Mail
                </Badge>
              )}
            </div>
          </div>
        </div>
        <Link href={`/members/${memberId}/edit`}>
          <Button variant="outline">
            <Pencil className="h-4 w-4" />
            Edit
          </Button>
        </Link>
      </div>

      {/* Summary cards */}
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4 stagger-children">
        <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-3.5">
          <p className="text-xs text-[var(--muted-foreground)]">Contacts</p>
          <p className="mt-0.5 text-xl font-bold">{member.contacts.length}</p>
        </div>
        <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-3.5">
          <p className="text-xs text-[var(--muted-foreground)]">Payments</p>
          <p className="mt-0.5 text-xl font-bold">{member.payments.length}</p>
        </div>
        <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-3.5">
          <p className="text-xs text-[var(--muted-foreground)]">Total Paid</p>
          <p className="mt-0.5 text-xl font-bold">{formatCurrency(totalPaid)}</p>
        </div>
        <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-3.5">
          <p className="text-xs text-[var(--muted-foreground)]">Joined</p>
          <p className="mt-0.5 text-xl font-bold">{member.joinDate ? formatDate(member.joinDate) : "—"}</p>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        {/* Left column */}
        <div className="space-y-5">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                <FileText className="h-4 w-4 text-[var(--muted-foreground)]" />
                Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              {member.organizationName && (
                <div className="flex items-start gap-2">
                  <Building2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[var(--muted-foreground)]" />
                  <span>{member.organizationName}</span>
                </div>
              )}
              {member.address1 && (
                <div className="flex items-start gap-2">
                  <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[var(--muted-foreground)]" />
                  <div>
                    {member.address1}
                    {member.address2 && <><br />{member.address2}</>}
                    <br />{member.city}, {member.state} {member.zip}
                  </div>
                </div>
              )}
              {member.joinDate && (
                <div className="flex items-center gap-2">
                  <Calendar className="h-3.5 w-3.5 shrink-0 text-[var(--muted-foreground)]" />
                  <span>Joined {formatDate(member.joinDate)}</span>
                </div>
              )}
              {member.expirationDate && (
                <div className="flex items-center gap-2">
                  <Calendar className="h-3.5 w-3.5 shrink-0 text-[var(--muted-foreground)]" />
                  <span>Expires {formatDate(member.expirationDate)}</span>
                </div>
              )}
              {member.notes && (
                <div className="rounded-lg bg-[var(--muted)]/50 p-3 text-sm text-[var(--muted-foreground)]">
                  {member.notes}
                </div>
              )}
              {!member.organizationName && !member.address1 && !member.notes && (
                <p className="text-[var(--muted-foreground)]">No additional details.</p>
              )}
            </CardContent>
          </Card>

          <Card id="contacts">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                <Users className="h-4 w-4 text-[var(--muted-foreground)]" />
                Contacts ({member.contacts.length})
              </CardTitle>
              <AddContactButton memberId={memberId} />
            </CardHeader>
            <CardContent>
              {member.contacts.length === 0 ? (
                <p className="text-sm text-[var(--muted-foreground)]">No contacts linked yet.</p>
              ) : (
                <div className="space-y-2">
                  {member.contacts.map((contact) => (
                    <div key={contact.id} className="flex items-center gap-3 rounded-lg border border-[var(--border)] p-3 transition-colors hover:bg-[var(--accent)]/50">
                      <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br ${getAvatarColor(contact.firstName + contact.lastName)} text-[10px] font-semibold text-white`}>
                        {(contact.firstName?.[0] || "") + (contact.lastName?.[0] || "")}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium truncate">{contact.firstName} {contact.lastName}</span>
                          {contact.isPrimary && <Badge variant="secondary" className="text-[10px] py-0">Primary</Badge>}
                        </div>
                        <div className="flex items-center gap-3 text-xs text-[var(--muted-foreground)]">
                          {contact.email && <span className="truncate">{contact.email}</span>}
                          {contact.phone && (
                            <span className="flex items-center gap-1 shrink-0">
                              <Phone className="h-2.5 w-2.5" />{contact.phone}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right column */}
        <div className="space-y-5 lg:col-span-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                <CreditCard className="h-4 w-4 text-[var(--muted-foreground)]" />
                Payment History
              </CardTitle>
              <RecordPaymentButton
                members={[{ id: member.id, displayName: member.displayName }]}
                defaultMemberId={member.id}
              />
            </CardHeader>
            <CardContent>
              {member.payments.length === 0 ? (
                <div className="py-6 text-center">
                  <CreditCard className="mx-auto mb-2 h-8 w-8 text-[var(--muted-foreground)]/40" />
                  <p className="text-sm text-[var(--muted-foreground)]">No payments recorded.</p>
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
                    {member.payments.map((payment) => (
                      <TableRow key={payment.id} className="transition-colors hover:bg-[var(--accent)]/50">
                        <TableCell className="text-sm">{payment.paidAt ? formatDate(payment.paidAt) : "—"}</TableCell>
                        <TableCell className="text-sm font-medium">{formatCurrency(payment.amount)}</TableCell>
                        <TableCell>
                          <span className="inline-flex items-center rounded-md bg-[var(--muted)] px-2 py-0.5 text-xs font-medium">
                            {payment.method}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Badge variant={payment.status === "COMPLETED" ? "success" : "secondary"} className="text-xs">
                            {payment.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-[var(--muted-foreground)]">{payment.description || "—"}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          {activity.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                  <Clock className="h-4 w-4 text-[var(--muted-foreground)]" />
                  Activity Timeline
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="relative space-y-0">
                  <div className="absolute left-[13px] top-2 bottom-2 w-px bg-[var(--border)]" />
                  {activity.map((item) => (
                    <div key={item.id} className="relative flex items-start gap-3 py-2.5">
                      <div className="relative z-10 flex h-[26px] w-[26px] shrink-0 items-center justify-center rounded-full border-2 border-[var(--background)] bg-[var(--muted)]">
                        <div className="h-1.5 w-1.5 rounded-full bg-[var(--muted-foreground)]" />
                      </div>
                      <div className="min-w-0 flex-1 pt-0.5">
                        <p className="text-sm">{item.description}</p>
                        <p className="mt-0.5 text-[11px] text-[var(--muted-foreground)]">{timeAgo(item.createdAt)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
