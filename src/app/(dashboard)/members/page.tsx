import Link from "next/link";
import { getMembers } from "@/actions/members";
import { getTiers } from "@/actions/tiers";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Plus, Upload, ChevronLeft, ChevronRight } from "lucide-react";
import { MembersTable } from "./members-table";
import { ExportButton } from "./export-button";

interface PageParams {
  search?: string;
  status?: string;
  tierId?: string;
  tierName?: string;
  page?: string;
  sortBy?: string;
  sortOrder?: string;
}

function buildPageUrl(params: PageParams, page: number) {
  const qp = new URLSearchParams();
  qp.set("page", String(page));
  if (params.search) qp.set("search", params.search);
  if (params.status) qp.set("status", params.status);
  if (params.tierId) qp.set("tierId", params.tierId);
  if (params.tierName) qp.set("tierName", params.tierName);
  if (params.sortBy) qp.set("sortBy", params.sortBy);
  if (params.sortOrder) qp.set("sortOrder", params.sortOrder);
  return `/members?${qp.toString()}`;
}

function getPageNumbers(current: number, total: number): (number | "ellipsis")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);

  const pages: (number | "ellipsis")[] = [1];

  if (current > 3) pages.push("ellipsis");

  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);
  for (let i = start; i <= end; i++) pages.push(i);

  if (current < total - 2) pages.push("ellipsis");

  pages.push(total);
  return pages;
}

export default async function MembersPage({
  searchParams,
}: {
  searchParams: Promise<PageParams>;
}) {
  const params = await searchParams;
  const page = parseInt(params.page || "1", 10);

  const [{ members, total, totalPages }, tiers] = await Promise.all([
    getMembers({
      search: params.search,
      status: params.status,
      tierId: params.tierId,
      tierName: params.tierName,
      page,
      sortBy: params.sortBy,
      sortOrder: params.sortOrder,
    }),
    getTiers(),
  ]);

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Members</h1>
          <p className="text-sm text-[var(--muted-foreground)]">
            {total} total member{total !== 1 ? "s" : ""}
          </p>
        </div>
        <div className="flex gap-2">
          <ExportButton />
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

      {/* Table */}
      <Card className="overflow-hidden">
        {members.length === 0 && !params.search && !params.status && !params.tierName ? (
          <div className="flex flex-col items-center justify-center p-12 text-center">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[var(--muted)]">
              <Plus className="h-5 w-5 text-[var(--muted-foreground)]" />
            </div>
            <p className="font-medium">No members yet</p>
            <p className="mt-1 text-sm text-[var(--muted-foreground)]">
              Get started by adding a member or importing from CSV.
            </p>
            <div className="mt-4 flex gap-2">
              <Link href="/members/import">
                <Button variant="outline" size="sm">
                  <Upload className="h-4 w-4" />
                  Import CSV
                </Button>
              </Link>
              <Link href="/members/new">
                <Button size="sm">
                  <Plus className="h-4 w-4" />
                  Add Member
                </Button>
              </Link>
            </div>
          </div>
        ) : (
          <MembersTable
            members={members}
            tiers={tiers.map((t) => ({ id: t.id, name: t.name }))}
            sortBy={params.sortBy || "displayName"}
            sortOrder={(params.sortOrder as "asc" | "desc") || "asc"}
            isEmpty={members.length === 0}
          />
        )}
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between">
          <p className="text-sm text-[var(--muted-foreground)]">
            Showing {(page - 1) * 20 + 1}–{Math.min(page * 20, total)} of {total}
          </p>
          <div className="flex items-center gap-1">
            {page > 1 ? (
              <Link href={buildPageUrl(params, page - 1)}>
                <Button variant="outline" size="sm" className="h-8 w-8 p-0">
                  <ChevronLeft className="h-4 w-4" />
                </Button>
              </Link>
            ) : (
              <Button variant="outline" size="sm" className="h-8 w-8 p-0" disabled>
                <ChevronLeft className="h-4 w-4" />
              </Button>
            )}
            {getPageNumbers(page, totalPages).map((p, i) =>
              p === "ellipsis" ? (
                <span key={`e${i}`} className="flex h-8 w-8 items-center justify-center text-sm text-[var(--muted-foreground)]">
                  ...
                </span>
              ) : (
                <Link key={p} href={buildPageUrl(params, p)}>
                  <Button
                    variant={p === page ? "default" : "outline"}
                    size="sm"
                    className="h-8 w-8 p-0 text-xs"
                  >
                    {p}
                  </Button>
                </Link>
              )
            )}
            {page < totalPages ? (
              <Link href={buildPageUrl(params, page + 1)}>
                <Button variant="outline" size="sm" className="h-8 w-8 p-0">
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </Link>
            ) : (
              <Button variant="outline" size="sm" className="h-8 w-8 p-0" disabled>
                <ChevronRight className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
