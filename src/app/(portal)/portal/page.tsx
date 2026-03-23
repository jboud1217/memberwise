import type { Metadata } from "next";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { tenantPrisma } from "@/lib/prisma-tenant";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDate, formatCurrency } from "@/lib/utils";
import Link from "next/link";
import {
  Users,
  CreditCard,
  UserCircle,
  ArrowRight,
  FileText,
  Clock,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

export const metadata: Metadata = { title: "Member Portal" };

export default async function PortalHomePage() {
  const session = await auth();
  if (!session?.user?.organizationId) {
    return (
      <div className="py-12 text-center">
        <p className="text-[var(--muted-foreground)]">Please log in to view the member portal.</p>
      </div>
    );
  }

  const db = tenantPrisma(prisma, session.user.organizationId);

  const [org, memberCount] = await Promise.all([
    prisma.organization.findUnique({
      where: { id: session.user.organizationId },
      select: { name: true, directoryEnabled: true },
    }),
    db.member.count({}),
  ]);

  // Try to get member-specific info
  const contact = await db.contact.findFirst({
    where: { email: session.user?.email || "" },
    include: {
      member: {
        include: {
          tier: true,
          payments: { orderBy: { createdAt: "desc" }, take: 1 },
        },
      },
    },
  });

  const member = contact?.member;
  const isExpired = member?.expirationDate && new Date(member.expirationDate) < new Date();

  return (
    <div>
      <h1 className="mb-1 text-2xl font-bold">
        Welcome{contact?.firstName ? `, ${contact.firstName}` : ""}
      </h1>
      <p className="mb-8 text-sm text-[var(--muted-foreground)]">
        {org?.name || "Organization"} member portal
      </p>

      {/* Membership Status Banner */}
      {member && (
        <div
          className={`mb-6 flex items-center justify-between rounded-lg border px-4 py-3 ${
            isExpired
              ? "border-red-200 bg-red-50"
              : member.status === "ACTIVE"
                ? "border-green-200 bg-green-50"
                : "border-amber-200 bg-amber-50"
          }`}
        >
          <div className="flex items-center gap-3">
            {isExpired ? (
              <AlertCircle className="h-5 w-5 text-red-600" />
            ) : member.status === "ACTIVE" ? (
              <CheckCircle2 className="h-5 w-5 text-green-600" />
            ) : (
              <AlertCircle className="h-5 w-5 text-amber-600" />
            )}
            <div>
              <p className="text-sm font-medium">
                {isExpired
                  ? "Your membership has expired"
                  : member.status === "ACTIVE"
                    ? "Your membership is active"
                    : `Status: ${member.status}`}
              </p>
              <p className="text-xs text-[var(--muted-foreground)]">
                {member.tier?.name || "No tier assigned"}
                {member.expirationDate &&
                  ` · ${isExpired ? "Expired" : "Expires"} ${formatDate(member.expirationDate)}`}
              </p>
            </div>
          </div>
          {(isExpired || member.status === "PROSPECT") && (
            <Link
              href="/portal/dues"
              className="rounded-md bg-[var(--primary)] px-3 py-1.5 text-xs font-medium text-[var(--primary-foreground)] transition-colors hover:opacity-90"
            >
              {isExpired ? "Renew Now" : "Join Now"}
            </Link>
          )}
        </div>
      )}

      {/* Quick Links Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 stagger-children">
        <Link href="/portal/dues">
          <Card className="group transition-all hover:shadow-md">
            <CardHeader className="flex flex-row items-center gap-3 pb-2">
              <CreditCard className="h-5 w-5 text-emerald-500" />
              <CardTitle className="text-lg">Dues & Payments</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-[var(--muted-foreground)]">
                {member?.tier
                  ? `${member.tier.name} — ${member.tier.price > 0 ? formatCurrency(member.tier.price) : "Free"}`
                  : "View and manage your membership dues"}
              </p>
              <span className="mt-3 inline-flex items-center gap-1 text-sm text-[var(--primary)] group-hover:underline">
                View Dues <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
              </span>
            </CardContent>
          </Card>
        </Link>

        <Link href="/portal/profile">
          <Card className="group transition-all hover:shadow-md">
            <CardHeader className="flex flex-row items-center gap-3 pb-2">
              <UserCircle className="h-5 w-5 text-purple-500" />
              <CardTitle className="text-lg">My Profile</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-[var(--muted-foreground)]">
                Update your contact information and preferences.
              </p>
              <span className="mt-3 inline-flex items-center gap-1 text-sm text-[var(--primary)] group-hover:underline">
                Edit Profile <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
              </span>
            </CardContent>
          </Card>
        </Link>

        {org?.directoryEnabled && (
          <Link href="/portal/directory">
            <Card className="group transition-all hover:shadow-md hover:scale-[1.02] hover:border-[var(--ring)]/30 active:scale-[0.98]">
              <CardHeader className="flex flex-row items-center gap-3 pb-2">
                <Users className="h-5 w-5 text-indigo-500" />
                <CardTitle className="text-lg">Member Directory</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-[var(--muted-foreground)]">
                  {memberCount} members in the directory.
                </p>
                <span className="mt-3 inline-flex items-center gap-1 text-sm text-[var(--primary)] group-hover:underline">
                  Browse Directory <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
                </span>
              </CardContent>
            </Card>
          </Link>
        )}

        <Link href="/portal/documents">
          <Card className="group transition-all hover:shadow-md">
            <CardHeader className="flex flex-row items-center gap-3 pb-2">
              <FileText className="h-5 w-5 text-blue-500" />
              <CardTitle className="text-lg">Documents</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-[var(--muted-foreground)]">
                Access member-only files and resources.
              </p>
              <span className="mt-3 inline-flex items-center gap-1 text-sm text-[var(--primary)] group-hover:underline">
                View Documents <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
              </span>
            </CardContent>
          </Card>
        </Link>

        <Link href="/portal/volunteer">
          <Card className="group transition-all hover:shadow-md">
            <CardHeader className="flex flex-row items-center gap-3 pb-2">
              <Clock className="h-5 w-5 text-amber-500" />
              <CardTitle className="text-lg">Volunteer Hours</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-[var(--muted-foreground)]">
                Track your volunteer contributions and service.
              </p>
              <span className="mt-3 inline-flex items-center gap-1 text-sm text-[var(--primary)] group-hover:underline">
                View Hours <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
              </span>
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  );
}
