import type { Metadata } from "next";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CreditCard, ExternalLink } from "lucide-react";

export const metadata: Metadata = { title: "Billing Settings" };

export default async function BillingSettingsPage() {
  const session = await auth();
  if (!session?.user?.organizationId) redirect("/login");

  const org = await prisma.organization.findUnique({
    where: { id: session.user.organizationId },
  });
  if (!org) return null;

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Billing Settings</h1>
        <p className="text-[var(--muted-foreground)]">Manage Stripe connection and subscription</p>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Stripe Connect</CardTitle>
            <CardDescription>
              Connect your Stripe account to collect member dues
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <CreditCard className="h-5 w-5 text-[var(--muted-foreground)]" />
              <Badge variant={org.stripeConnectOnboarded ? "success" : "secondary"}>
                {org.stripeConnectOnboarded ? "Connected" : "Not Connected"}
              </Badge>
            </div>
            {!org.stripeConnectOnboarded && (
              <Button>
                <ExternalLink className="h-4 w-4" />
                Connect Stripe Account
              </Button>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">MemberWise Subscription</CardTitle>
            <CardDescription>
              Your MemberWise plan and billing
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              <Badge variant="secondary">
                {org.subscriptionStatus || "Free Trial"}
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
