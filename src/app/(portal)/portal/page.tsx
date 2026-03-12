import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { tenantPrisma } from "@/lib/prisma-tenant";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDate, formatCurrency } from "@/lib/utils";
import Link from "next/link";
import { Users, CreditCard, UserCircle, ArrowRight } from "lucide-react";

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

  const [org, memberCount, contactCount] = await Promise.all([
    prisma.organization.findUnique({
      where: { id: session.user.organizationId },
      select: { name: true },
    }),
    db.member.count({}),
    db.contact.count({}),
  ]);

  return (
    <div>
      <h1 className="mb-2 text-2xl font-bold">Member Portal</h1>
      <p className="mb-8 text-[var(--muted-foreground)]">
        Welcome to the {org?.name || "organization"} member portal
      </p>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center gap-3 pb-2">
            <Users className="h-5 w-5 text-indigo-500" />
            <CardTitle className="text-lg">Membership</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-3 text-3xl font-bold">{memberCount}</div>
            <p className="text-sm text-[var(--muted-foreground)]">Total members in the organization</p>
            <Link href="/portal/directory" className="mt-3 inline-flex items-center gap-1 text-sm text-[var(--primary)] hover:underline">
              View Directory <ArrowRight className="h-3 w-3" />
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center gap-3 pb-2">
            <CreditCard className="h-5 w-5 text-emerald-500" />
            <CardTitle className="text-lg">Dues & Payments</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-[var(--muted-foreground)]">View and pay your membership dues.</p>
            <Link href="/portal/dues" className="mt-3 inline-flex items-center gap-1 text-sm text-[var(--primary)] hover:underline">
              View Dues <ArrowRight className="h-3 w-3" />
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center gap-3 pb-2">
            <UserCircle className="h-5 w-5 text-purple-500" />
            <CardTitle className="text-lg">My Profile</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-[var(--muted-foreground)]">Update your contact information.</p>
            <Link href="/portal/profile" className="mt-3 inline-flex items-center gap-1 text-sm text-[var(--primary)] hover:underline">
              Edit Profile <ArrowRight className="h-3 w-3" />
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
