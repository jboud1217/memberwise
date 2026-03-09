"use client";

import { useRouter } from "next/navigation";
import { MemberForm } from "@/components/members/member-form";
import { createMember } from "@/actions/members";
import type { MemberInput } from "@/lib/validators/member";

export default function NewMemberPage() {
  const router = useRouter();

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
      <MemberForm tiers={[]} onSubmit={handleSubmit} submitLabel="Create Member" />
    </div>
  );
}
