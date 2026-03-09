import { auth } from "@/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, UserCheck, UserX, DollarSign } from "lucide-react";

export default async function DashboardPage() {
  const session = await auth();

  const stats = [
    { name: "Total Members", value: "0", icon: Users, change: "" },
    { name: "Active", value: "0", icon: UserCheck, change: "" },
    { name: "Lapsed", value: "0", icon: UserX, change: "" },
    { name: "Revenue (YTD)", value: "$0", icon: DollarSign, change: "" },
  ];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-[var(--muted-foreground)]">
          Welcome back{session?.user?.name ? `, ${session.user.name}` : ""}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.name}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.name}</CardTitle>
              <stat.icon className="h-4 w-4 text-[var(--muted-foreground)]" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-8 grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Getting Started</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              <li className="flex items-center gap-3 text-sm">
                <div className="h-6 w-6 rounded-full border-2 border-[var(--border)] flex items-center justify-center text-xs">1</div>
                Set up membership tiers
              </li>
              <li className="flex items-center gap-3 text-sm">
                <div className="h-6 w-6 rounded-full border-2 border-[var(--border)] flex items-center justify-center text-xs">2</div>
                Import your members
              </li>
              <li className="flex items-center gap-3 text-sm">
                <div className="h-6 w-6 rounded-full border-2 border-[var(--border)] flex items-center justify-center text-xs">3</div>
                Connect Stripe for payments
              </li>
              <li className="flex items-center gap-3 text-sm">
                <div className="h-6 w-6 rounded-full border-2 border-[var(--border)] flex items-center justify-center text-xs">4</div>
                Send your first email campaign
              </li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-[var(--muted-foreground)]">
              No activity yet. Start by importing your members.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
