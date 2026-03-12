"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useRef, useTransition } from "react";
import { Search, X } from "lucide-react";

export function ContactSearch({ defaultValue }: { defaultValue: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const inputRef = useRef<HTMLInputElement>(null);
  const [isPending, startTransition] = useTransition();
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  function handleSearch(value: string) {
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      startTransition(() => {
        const params = new URLSearchParams(searchParams.toString());
        if (value) {
          params.set("search", value);
          params.delete("page");
        } else {
          params.delete("search");
          params.delete("page");
        }
        router.push(`/contacts?${params.toString()}`);
      });
    }, 300);
  }

  function handleClear() {
    if (inputRef.current) inputRef.current.value = "";
    startTransition(() => {
      const params = new URLSearchParams(searchParams.toString());
      params.delete("search");
      params.delete("page");
      router.push(`/contacts?${params.toString()}`);
    });
  }

  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted-foreground)]" />
      <input
        ref={inputRef}
        type="text"
        placeholder="Search by name or email..."
        defaultValue={defaultValue}
        onChange={(e) => handleSearch(e.target.value)}
        className={`w-full rounded-lg border border-[var(--border)] bg-[var(--background)] py-2 pl-10 pr-10 text-sm outline-none transition-colors placeholder:text-[var(--muted-foreground)] focus:border-[var(--ring)] focus:ring-2 focus:ring-[var(--ring)]/20 ${isPending ? "opacity-60" : ""}`}
      />
      {defaultValue && (
        <button
          onClick={handleClear}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
