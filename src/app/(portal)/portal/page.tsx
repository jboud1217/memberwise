import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function PortalHomePage() {
  return (
    <div>
      <h1 className="mb-8 text-2xl font-bold">Member Portal</h1>
      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Your Membership</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-[var(--muted-foreground)]">
              View your membership details and status.
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Dues & Payments</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-[var(--muted-foreground)]">
              View and pay your membership dues.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
