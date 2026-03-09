"use client";

import { useRouter, useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { MemberForm } from "@/components/members/member-form";
import { getMember, updateMember } from "@/actions/members";
import type { MemberInput } from "@/lib/validators/member";
import { Spinner } from "@/components/ui/spinner";

export default function EditMemberPage() {
  const router = useRouter();
  const params = useParams();
  const memberId = params.memberId as string;
  const [member, setMember] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getMember(memberId).then((m) => {
      setMember(m as Record<string, unknown> | null);
      setLoading(false);
    });
  }, [memberId]);

  async function handleSubmit(data: MemberInput) {
    const result = await updateMember(memberId, data);
    if (result.error) return { error: result.error };
    router.push(`/members/${memberId}`);
    return {};
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }

  if (!member) {
    return <p className="py-12 text-center text-[var(--muted-foreground)]">Member not found</p>;
  }

  const formatDateStr = (d: unknown) => {
    if (!d) return undefined;
    return new Date(d as string).toISOString().split("T")[0];
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Edit Member</h1>
        <p className="text-sm text-[var(--muted-foreground)]">{member.displayName as string}</p>
      </div>
      <MemberForm
        defaultValues={{
          displayName: member.displayName as string,
          organizationName: (member.organizationName as string) || undefined,
          status: member.status as MemberInput["status"],
          tierId: (member.tierId as string) || undefined,
          address1: (member.address1 as string) || undefined,
          address2: (member.address2 as string) || undefined,
          city: (member.city as string) || undefined,
          state: (member.state as string) || undefined,
          zip: (member.zip as string) || undefined,
          country: (member.country as string) || undefined,
          memberNumber: (member.memberNumber as string) || undefined,
          joinDate: formatDateStr(member.joinDate),
          renewalDate: formatDateStr(member.renewalDate),
          expirationDate: formatDateStr(member.expirationDate),
          notes: (member.notes as string) || undefined,
        }}
        tiers={[]}
        onSubmit={handleSubmit}
        submitLabel="Update Member"
      />
    </div>
  );
}
