import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { tenantPrisma } from "@/lib/prisma-tenant";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function AnalyticsPage() {
  const session = await auth();
  if (!session?.user?.organizationId) return null;
  const db = tenantPrisma(prisma, session.user.organizationId);

  const [totalMembers, activeMembers, lapsedMembers, prospects, totalContacts] = await Promise.all([
    db.member.count({}),
    db.member.count({ where: { status: "ACTIVE" } }),
    db.member.count({ where: { status: "LAPSED" } }),
    db.member.count({ where: { status: "PROSPECT" } }),
    db.contact.count({}),
  ]);

  const stats = [
    { label: "Total Members", value: totalMembers },
    { label: "Active", value: activeMembers },
    { label: "Lapsed", value: lapsedMembers },
    { label: "Prospects", value: prospects },
    { label: "Total Contacts", value: totalContacts },
  ];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Analytics</h1>
        <p className="text-[var(--muted-foreground)]">Membership and revenue insights</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-[var(--muted-foreground)]">{stat.label}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-8 grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Members by Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                { label: "Active", value: activeMembers, color: "bg-green-500" },
                { label: "Lapsed", value: lapsedMembers, color: "bg-red-500" },
                { label: "Prospects", value: prospects, color: "bg-gray-400" },
              ].map((item) => (
                <div key={item.label} className="flex items-center gap-3">
                  <div className={`h-3 w-3 rounded-full ${item.color}`} />
                  <span className="flex-1 text-sm">{item.label}</span>
                  <span className="text-sm font-medium">{item.value}</span>
                  <span className="text-sm text-[var(--muted-foreground)]">
                    ({totalMembers > 0 ? Math.round((item.value / totalMembers) * 100) : 0}%)
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Revenue Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-[var(--muted-foreground)]">
              Connect Stripe to see revenue analytics. Go to Settings to connect your account.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
