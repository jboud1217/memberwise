import Link from "next/link";
import { getContacts } from "@/actions/contacts";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus } from "lucide-react";

export default async function ContactsPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; page?: string }>;
}) {
  const params = await searchParams;
  const page = parseInt(params.page || "1", 10);
  const { contacts, total } = await getContacts({ search: params.search, page });

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Contacts</h1>
          <p className="text-sm text-[var(--muted-foreground)]">{total} total contacts</p>
        </div>
        <Button>
          <Plus className="h-4 w-4" />
          Add Contact
        </Button>
      </div>

      <Card>
        {contacts.length === 0 ? (
          <div className="p-8 text-center text-sm text-[var(--muted-foreground)]">
            No contacts yet. Contacts are individuals linked to member records.
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Member</TableHead>
                <TableHead>Primary</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {contacts.map((contact) => (
                <TableRow key={contact.id}>
                  <TableCell className="font-medium">
                    {contact.firstName} {contact.lastName}
                  </TableCell>
                  <TableCell className="text-sm">{contact.email || "—"}</TableCell>
                  <TableCell className="text-sm">{contact.phone || "—"}</TableCell>
                  <TableCell>
                    {contact.member ? (
                      <Link
                        href={`/members/${contact.member.id}`}
                        className="text-sm text-[var(--primary)] hover:underline"
                      >
                        {contact.member.displayName}
                      </Link>
                    ) : (
                      <span className="text-sm text-[var(--muted-foreground)]">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {contact.isPrimary && <Badge variant="secondary">Primary</Badge>}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>
    </div>
  );
}
