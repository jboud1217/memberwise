import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CreditCard } from "lucide-react";

export default function PortalDuesPage() {
  return (
    <div>
      <h1 className="mb-8 text-2xl font-bold">Dues & Payments</h1>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Current Membership</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-[var(--muted-foreground)]">
              Your membership details will appear here once your account is linked.
            </p>
            <Button>
              <CreditCard className="h-4 w-4" />
              Pay Dues
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Payment History</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-[var(--muted-foreground)]">No payments found.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
