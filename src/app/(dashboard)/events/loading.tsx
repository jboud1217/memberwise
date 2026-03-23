import { Skeleton } from "@/components/ui/skeleton";

export default function EventsLoading() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <Skeleton className="h-8 w-24" />
          <Skeleton className="mt-2 h-4 w-48" />
        </div>
        <Skeleton className="h-9 w-36 rounded-lg" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-[var(--border)] bg-[var(--card)] overflow-hidden">
            <Skeleton className="h-32 w-full" />
            <div className="p-4">
              <Skeleton className="h-5 w-40" />
              <Skeleton className="mt-2 h-4 w-32" />
              <Skeleton className="mt-3 h-4 w-24" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
