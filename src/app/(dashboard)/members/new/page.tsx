"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { MemberForm } from "@/components/members/member-form";
import { createMember } from "@/actions/members";
import { getTiers } from "@/actions/tiers";
import type { MemberInput } from "@/lib/validators/member";
import { Skeleton } from "@/components/ui/skeleton";

export default function NewMemberPage() {
  const router = useRouter();
  const [tiers, setTiers] = useState<{ id: string; name: string }[]>([]);
  const [tiersLoaded, setTiersLoaded] = useState(false);

  useEffect(() => {
    getTiers()
      .then((data) => setTiers(data.map((t) => ({ id: t.id, name: t.name }))))
      .catch(() => {})
      .finally(() => setTiersLoaded(true));
  }, []);

  async function handleSubmit(data: MemberInput) {
    const result = await createMember(data);
    if (result.error) return { error: result.error };
    router.push("/members");
    return {};
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Add Member</h1>
        <p className="text-sm text-[var(--muted-foreground)]">Create a new member record</p>
      </div>
      {tiersLoaded ? (
        <MemberForm tiers={tiers} onSubmit={handleSubmit} submitLabel="Create Member" />
      ) : (
        <div className="space-y-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-full rounded-lg" />
          ))}
        </div>
      )}
    </div>
  );
}
