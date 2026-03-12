import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { tenantPrisma } from "@/lib/prisma-tenant";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search, Lock } from "lucide-react";

export default async function PortalDirectoryPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string }>;
}) {
  const session = await auth();
  if (!session?.user?.organizationId) {
    return <p className="py-12 text-center text-[var(--muted-foreground)]">Please log in to view the directory.</p>;
  }

  const org = await prisma.organization.findUnique({
    where: { id: session.user.organizationId },
    select: { directoryEnabled: true },
  });

  if (!org?.directoryEnabled) {
    return (
      <div>
        <h1 className="mb-4 text-2xl font-bold">Member Directory</h1>
        <Card>
          <CardContent className="flex flex-col items-center py-12 text-center">
            <Lock className="mb-3 h-10 w-10 text-[var(--muted-foreground)]" />
            <p className="font-medium">Directory Not Enabled</p>
            <p className="mt-1 text-sm text-[var(--muted-foreground)]">
              The member directory has not been enabled for this organization yet.
              Contact your admin to enable it.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const params = await searchParams;
  const search = params.search || "";
  const db = tenantPrisma(prisma, session.user.organizationId);

  const where: Record<string, unknown> = { status: "ACTIVE" };
  if (search) {
    where.OR = [
      { displayName: { contains: search, mode: "insensitive" } },
      { organizationName: { contains: search, mode: "insensitive" } },
    ];
  }

  const members = await db.member.findMany({
    where,
    include: { contacts: { where: { isPrimary: true }, take: 1 } },
    orderBy: { displayName: "asc" },
    take: 100,
  });

  return (
    <div>
      <h1 className="mb-4 text-2xl font-bold">Member Directory</h1>
      <p className="mb-6 text-[var(--muted-foreground)]">Find and connect with other members</p>

      <form className="relative mb-6" action="/portal/directory" method="GET">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted-foreground)]" />
        <input
          name="search"
          placeholder="Search directory..."
          defaultValue={search}
          className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] py-2 pl-9 pr-4 text-sm outline-none focus:border-[var(--ring)] focus:ring-2 focus:ring-[var(--ring)]/20"
        />
      </form>

      {members.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-sm text-[var(--muted-foreground)]">
              {search ? `No members found matching "${search}".` : "No active members found."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {members.map((member) => {
            const contact = member.contacts[0];
            return (
              <Card key={member.id}>
                <CardContent className="p-4">
                  <div className="font-medium">{member.displayName}</div>
                  {member.organizationName && (
                    <div className="text-sm text-[var(--muted-foreground)]">{member.organizationName}</div>
                  )}
                  {contact?.email && (
                    <div className="mt-2 text-sm text-[var(--primary)]">{contact.email}</div>
                  )}
                  {(member.city || member.state) && (
                    <div className="mt-1 text-xs text-[var(--muted-foreground)]">
                      {[member.city, member.state].filter(Boolean).join(", ")}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
