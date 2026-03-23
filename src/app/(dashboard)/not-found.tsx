import Link from "next/link";

export default function DashboardNotFound() {
  return (
    <div className="flex flex-col items-center justify-center py-24 px-4 text-center">
      <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--muted)]">
        <span className="text-2xl font-bold text-[var(--muted-foreground)]">?</span>
      </div>
      <h2 className="text-lg font-semibold">Page not found</h2>
      <p className="mt-1.5 text-sm text-[var(--muted-foreground)] max-w-md">
        This page doesn&apos;t exist. It may have been moved or removed.
      </p>
      <Link
        href="/dashboard"
        className="mt-5 rounded-xl bg-[var(--primary)] px-5 py-2.5 text-sm font-medium text-[var(--primary-foreground)] transition-colors hover:opacity-90"
      >
        Back to Dashboard
      </Link>
    </div>
  );
}
