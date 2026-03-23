import { TableSkeleton } from "@/components/ui/page-skeleton";
import { Skeleton } from "@/components/ui/skeleton";

export default function VolunteersLoading() {
  return (
    <div className="animate-fade-in">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <Skeleton className="h-8 w-32" />
          <Skeleton className="mt-2 h-4 w-44" />
        </div>
        <Skeleton className="h-9 w-28 rounded-lg" />
      </div>
      <TableSkeleton rows={8} cols={4} />
    </div>
  );
}
