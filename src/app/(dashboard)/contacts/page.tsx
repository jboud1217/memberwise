import type { Metadata } from "next";
import Link from "next/link";
import { getContacts } from "@/actions/contacts";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, ChevronRight, ContactRound, Mail, Phone, ArrowUpRight } from "lucide-react";
import { ContactSearch } from "./contact-search";
import { AddContactButton } from "./add-contact";
import { ExportContactsButton } from "./export-contacts";

function getPageNumbers(current: number, total: number): (number | "ellipsis")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const pages: (number | "ellipsis")[] = [1];
  if (current > 3) pages.push("ellipsis");
  for (let i = Math.max(2, current - 1); i <= Math.min(total - 1, current + 1); i++) pages.push(i);
  if (current < total - 2) pages.push("ellipsis");
  pages.push(total);
  return pages;
}

export const metadata: Metadata = { title: "Contacts" };

export default async function ContactsPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; page?: string }>;
}) {
  const params = await searchParams;
  const page = parseInt(params.page || "1", 10);
  const search = params.search || "";
  const { contacts, total, totalPages } = await getContacts({ search, page });

  function buildUrl(p: number) {
    const qp = new URLSearchParams();
    qp.set("page", String(p));
    if (search) qp.set("search", search);
    return `/contacts?${qp.toString()}`;
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Contacts</h1>
          <p className="mt-0.5 text-sm text-[var(--muted-foreground)]">{total} contact{total !== 1 ? "s" : ""} linked to members</p>
        </div>
        <div className="flex gap-2">
          <ExportContactsButton />
          <AddContactButton />
        </div>
      </div>

      <div className="mb-4">
        <ContactSearch defaultValue={search} />
      </div>

      <Card className="overflow-hidden">
        {contacts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <ContactRound className="mb-3 h-10 w-10 text-[var(--muted-foreground)]/40" />
            <p className="text-base font-medium">
              {search ? "No contacts found" : "No contacts yet"}
            </p>
            <p className="mt-1 text-sm text-[var(--muted-foreground)]">
              {search
                ? `No contacts matching "${search}".`
                : "Contacts are individuals linked to member records."}
            </p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Member</TableHead>
                <TableHead>Role</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {contacts.map((contact) => (
                <TableRow key={contact.id} className="group transition-colors hover:bg-[var(--accent)]/50">
                  <TableCell>
                    <span className="font-medium">{contact.firstName} {contact.lastName}</span>
                  </TableCell>
                  <TableCell>
                    {contact.email ? (
                      <span className="inline-flex items-center gap-1.5 text-sm">
                        <Mail className="h-3 w-3 text-[var(--muted-foreground)]" />
                        {contact.email}
                      </span>
                    ) : (
                      <span className="text-sm text-[var(--muted-foreground)]">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {contact.phone ? (
                      <span className="inline-flex items-center gap-1.5 text-sm">
                        <Phone className="h-3 w-3 text-[var(--muted-foreground)]" />
                        {contact.phone}
                      </span>
                    ) : (
                      <span className="text-sm text-[var(--muted-foreground)]">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {contact.member ? (
                      <Link
                        href={`/members/${contact.member.id}`}
                        className="inline-flex items-center gap-1 text-sm text-[var(--foreground)] font-medium hover:text-[var(--primary)] transition-colors"
                      >
                        {contact.member.displayName}
                        <ArrowUpRight className="h-3 w-3 opacity-0 group-hover:opacity-60 transition-opacity" />
                      </Link>
                    ) : (
                      <span className="text-sm text-[var(--muted-foreground)]">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {contact.isPrimary && <Badge variant="secondary" className="text-xs">Primary</Badge>}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>

      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between">
          <p className="text-sm text-[var(--muted-foreground)]">
            Showing {(page - 1) * 20 + 1}–{Math.min(page * 20, total)} of {total}
          </p>
          <div className="flex items-center gap-1">
            {page > 1 ? (
              <Link href={buildUrl(page - 1)}>
                <Button variant="outline" size="sm" className="h-8 w-8 p-0"><ChevronLeft className="h-4 w-4" /></Button>
              </Link>
            ) : (
              <Button variant="outline" size="sm" className="h-8 w-8 p-0" disabled><ChevronLeft className="h-4 w-4" /></Button>
            )}
            {getPageNumbers(page, totalPages).map((p, i) =>
              p === "ellipsis" ? (
                <span key={`e${i}`} className="flex h-8 w-8 items-center justify-center text-sm text-[var(--muted-foreground)]">...</span>
              ) : (
                <Link key={p} href={buildUrl(p)}>
                  <Button variant={p === page ? "default" : "outline"} size="sm" className="h-8 w-8 p-0 text-xs">{p}</Button>
                </Link>
              )
            )}
            {page < totalPages ? (
              <Link href={buildUrl(page + 1)}>
                <Button variant="outline" size="sm" className="h-8 w-8 p-0"><ChevronRight className="h-4 w-4" /></Button>
              </Link>
            ) : (
              <Button variant="outline" size="sm" className="h-8 w-8 p-0" disabled><ChevronRight className="h-4 w-4" /></Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
