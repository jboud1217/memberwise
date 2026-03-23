import { TableSkeleton } from "@/components/ui/page-skeleton";
import { Skeleton } from "@/components/ui/skeleton";

export default function ContactsLoading() {
  return (
    <div className="animate-fade-in">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <Skeleton className="h-8 w-28" />
          <Skeleton className="mt-2 h-4 w-40" />
        </div>
        <Skeleton className="h-9 w-28 rounded-lg" />
      </div>
      <div className="mb-4 flex gap-2">
        <Skeleton className="h-10 flex-1 rounded-lg" />
      </div>
      <TableSkeleton rows={8} cols={4} />
    </div>
  );
}
