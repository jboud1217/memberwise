import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Upload } from "lucide-react";

export default function MembersPage() {
  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Members</h1>
          <p className="text-[var(--muted-foreground)]">
            Manage your organization&apos;s members
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/members/import">
            <Button variant="outline">
              <Upload className="h-4 w-4" />
              Import CSV
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

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">No members yet</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-[var(--muted-foreground)]">
            Get started by adding a member or importing from a CSV file.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
