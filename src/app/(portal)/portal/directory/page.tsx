import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

export default function PortalDirectoryPage() {
  return (
    <div>
      <h1 className="mb-4 text-2xl font-bold">Member Directory</h1>
      <p className="mb-6 text-[var(--muted-foreground)]">
        Find and connect with other members
      </p>

      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted-foreground)]" />
        <Input placeholder="Search directory..." className="pl-9" />
      </div>

      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-sm text-[var(--muted-foreground)]">
            The member directory will be available once your organization enables it.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
