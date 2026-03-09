import Link from "next/link";
import { getMembers } from "@/actions/members";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Card } from "@/components/ui/card";
import { Plus, Upload } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { MembersFilter } from "@/components/members/members-filter";

const statusVariant: Record<string, "success" | "destructive" | "warning" | "secondary" | "outline"> = {
  ACTIVE: "success",
  LAPSED: "destructive",
  SUSPENDED: "warning",
  PROSPECT: "secondary",
  ARCHIVED: "outline",
};

export default async function MembersPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; status?: string; tierId?: string; page?: string }>;
}) {
  const params = await searchParams;
  const page = parseInt(params.page || "1", 10);
  const { members, total, totalPages } = await getMembers({
    search: params.search,
    status: params.status,
    tierId: params.tierId,
    page,
  });

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Members</h1>
          <p className="text-sm text-[var(--muted-foreground)]">{total} total members</p>
        </div>
        <div className="flex gap-2">
          <Link href="/members/import">
            <Button variant="outline">
              <Upload className="h-4 w-4" />
              Import
            </Button>
          </Link>
          <Link href="/members/new">
            <Button>
              <Plus className="h-4 w-4" />
              Add Member
            </Button>
          </Link>
        </div>
      </div>

      <MembersFilter />

      <Card className="mt-4">
        {members.length === 0 ? (
          <div className="p-8 text-center text-sm text-[var(--muted-foreground)]">
            {params.search || params.status
              ? "No members match your filters."
              : "No members yet. Add one or import from CSV."}
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Tier</TableHead>
                <TableHead>Contacts</TableHead>
                <TableHead>Joined</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {members.map((member) => (
                <TableRow key={member.id}>
                  <TableCell>
                    <Link
                      href={`/members/${member.id}`}
                      className="font-medium text-[var(--primary)] hover:underline"
                    >
                      {member.displayName}
                    </Link>
                    {member.organizationName && (
                      <p className="text-xs text-[var(--muted-foreground)]">
                        {member.organizationName}
                      </p>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant={statusVariant[member.status] || "secondary"}>
                      {member.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm">
                    {member.tier?.name || "—"}
                  </TableCell>
                  <TableCell className="text-sm">
                    {member.contacts.length}
                  </TableCell>
                  <TableCell className="text-sm text-[var(--muted-foreground)]">
                    {member.joinDate ? formatDate(member.joinDate) : "—"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>

      {totalPages > 1 && (
        <div className="mt-4 flex justify-center gap-2">
          {page > 1 && (
            <Link href={`/members?page=${page - 1}&search=${params.search || ""}&status=${params.status || ""}`}>
              <Button variant="outline" size="sm">Previous</Button>
            </Link>
          )}
          <span className="flex items-center text-sm text-[var(--muted-foreground)]">
            Page {page} of {totalPages}
          </span>
          {page < totalPages && (
            <Link href={`/members?page=${page + 1}&search=${params.search || ""}&status=${params.status || ""}`}>
              <Button variant="outline" size="sm">Next</Button>
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
