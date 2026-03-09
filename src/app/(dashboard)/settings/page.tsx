import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Users, CreditCard, Building2 } from "lucide-react";

export default async function SettingsPage() {
  const session = await auth();
  if (!session?.user?.organizationId) return null;

  const org = await prisma.organization.findUnique({
    where: { id: session.user.organizationId },
  });
  if (!org) return null;

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-[var(--muted-foreground)]">Manage your organization settings</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <Building2 className="h-8 w-8 text-[var(--primary)]" />
            <CardTitle className="text-lg">Organization</CardTitle>
            <CardDescription>Name, logo, address, and contact info</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="mb-4 text-sm">{org.name}</p>
            <Button variant="outline" size="sm">Edit Organization</Button>
          </CardContent>
        </Card>

        <Link href="/settings/team">
          <Card className="cursor-pointer transition-shadow hover:shadow-md">
            <CardHeader>
              <Users className="h-8 w-8 text-[var(--primary)]" />
              <CardTitle className="text-lg">Team</CardTitle>
              <CardDescription>Invite admins and manage roles</CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" size="sm">Manage Team</Button>
            </CardContent>
          </Card>
        </Link>

        <Link href="/settings/billing">
          <Card className="cursor-pointer transition-shadow hover:shadow-md">
            <CardHeader>
              <CreditCard className="h-8 w-8 text-[var(--primary)]" />
              <CardTitle className="text-lg">Billing</CardTitle>
              <CardDescription>Subscription and Stripe connection</CardDescription>
            </CardHeader>
            <CardContent>
              <Badge variant={org.stripeConnectOnboarded ? "success" : "secondary"}>
                {org.stripeConnectOnboarded ? "Connected" : "Not connected"}
              </Badge>
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  );
}
