"use client";

import Link from "next/link";
import { Badge } from "./badge";
import { cn } from "@/lib/utils";
import { Mail, Phone, Calendar, CreditCard, ArrowRight } from "lucide-react";

const STATUS_VARIANT: Record<string, "success" | "destructive" | "warning" | "secondary" | "outline"> = {
  ACTIVE: "success",
  LAPSED: "destructive",
  SUSPENDED: "warning",
  PROSPECT: "secondary",
  ARCHIVED: "outline",
};

const AVATAR_COLORS = [
  "from-indigo-400 to-indigo-600",
  "from-emerald-400 to-emerald-600",
  "from-amber-400 to-amber-600",
  "from-rose-400 to-rose-600",
  "from-violet-400 to-violet-600",
  "from-cyan-400 to-cyan-600",
];

function getAvatarColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function getInitials(name: string): string {
  return name.split(/\s+/).slice(0, 2).map((w) => w[0]).join("").toUpperCase();
}

interface MemberPreviewProps {
  member: {
    id: string;
    displayName: string;
    status: string;
    email?: string | null;
    phone?: string | null;
    tierName?: string | null;
    joinDate?: Date | string | null;
    totalPaid?: number;
  };
}

export function MemberPreviewContent({ member }: MemberPreviewProps) {
  return (
    <div>
      <div className="flex items-center gap-3 mb-3">
        <div
          className={cn(
            "flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br text-sm font-bold text-white shadow-sm",
            getAvatarColor(member.displayName)
          )}
        >
          {getInitials(member.displayName)}
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-semibold truncate">{member.displayName}</p>
          <div className="flex items-center gap-1.5 mt-0.5">
            <Badge variant={STATUS_VARIANT[member.status] || "secondary"} className="text-[10px] py-0">
              {member.status}
            </Badge>
            {member.tierName && (
              <span className="text-[11px] text-[var(--primary)]">{member.tierName}</span>
            )}
          </div>
        </div>
      </div>

      <div className="space-y-1.5 text-xs text-[var(--muted-foreground)]">
        {member.email && (
          <div className="flex items-center gap-2">
            <Mail className="h-3 w-3 shrink-0" />
            <span className="truncate">{member.email}</span>
          </div>
        )}
        {member.phone && (
          <div className="flex items-center gap-2">
            <Phone className="h-3 w-3 shrink-0" />
            <span>{member.phone}</span>
          </div>
        )}
        {member.joinDate && (
          <div className="flex items-center gap-2">
            <Calendar className="h-3 w-3 shrink-0" />
            <span>
              Joined{" "}
              {new Date(member.joinDate).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </span>
          </div>
        )}
        {member.totalPaid !== undefined && member.totalPaid > 0 && (
          <div className="flex items-center gap-2">
            <CreditCard className="h-3 w-3 shrink-0" />
            <span>${(member.totalPaid / 100).toLocaleString("en-US", { minimumFractionDigits: 2 })}</span>
          </div>
        )}
      </div>

      <Link
        href={`/members/${member.id}`}
        className="mt-3 flex items-center justify-center gap-1.5 rounded-lg bg-[var(--accent)] px-3 py-1.5 text-xs font-medium text-[var(--accent-foreground)] transition-colors hover:bg-[var(--primary)] hover:text-white"
      >
        View Profile
        <ArrowRight className="h-3 w-3" />
      </Link>
    </div>
  );
}
