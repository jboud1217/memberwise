import type { Metadata } from "next";
import { getCommittees, getCommitteeStats } from "@/actions/committees";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Users2,
  Calendar,
  MapPin,
  Video,
} from "lucide-react";
import { CommitteeActions } from "./committee-actions";

const ROLE_LABEL: Record<string, string> = {
  CHAIR: "Chair",
  VICE_CHAIR: "Vice Chair",
  SECRETARY: "Secretary",
  TREASURER: "Treasurer",
  MEMBER: "Member",
};

export const metadata: Metadata = { title: "Committees" };

export default async function CommitteesPage() {
  const [committees, stats] = await Promise.all([
    getCommittees(),
    getCommitteeStats(),
  ]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Committees</h1>
          <p className="text-sm text-[var(--muted-foreground)]">
            Manage committees, boards, and working groups
          </p>
        </div>
        <CommitteeActions />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 stagger-children">
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="rounded-lg bg-blue-50 p-2">
              <Users2 className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <div className="text-2xl font-bold">{stats.totalCommittees}</div>
              <div className="text-xs text-[var(--muted-foreground)]">Total Committees</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="rounded-lg bg-green-50 p-2">
              <Users2 className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <div className="text-2xl font-bold">{stats.activeCommittees}</div>
              <div className="text-xs text-[var(--muted-foreground)]">Active</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="rounded-lg bg-purple-50 p-2">
              <Users2 className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <div className="text-2xl font-bold">{stats.totalMembers}</div>
              <div className="text-xs text-[var(--muted-foreground)]">Committee Members</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Committees List */}
      {committees.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <Users2 className="mb-4 h-12 w-12 text-[var(--muted-foreground)]" />
            <h3 className="mb-2 text-lg font-semibold">No committees yet</h3>
            <p className="mb-6 max-w-sm text-sm text-[var(--muted-foreground)]">
              Create committees and working groups to organize your members and track their roles.
            </p>
            <CommitteeActions />
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 stagger-children">
          {committees.map((committee) => (
            <Card key={committee.id} className="cursor-pointer transition-all hover:bg-[var(--muted)]/30 hover:shadow-[var(--shadow-sm)] hover:border-[var(--ring)]/20">
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <h3 className="text-lg font-semibold">{committee.name}</h3>
                  <Badge variant={committee.isActive ? "default" : "secondary"}>
                    {committee.isActive ? "Active" : "Inactive"}
                  </Badge>
                </div>

                {committee.description && (
                  <p className="mt-2 line-clamp-2 text-sm text-[var(--muted-foreground)]">
                    {committee.description}
                  </p>
                )}

                <div className="mt-4 space-y-2 text-xs text-[var(--muted-foreground)]">
                  <div className="flex items-center gap-2">
                    <Users2 className="h-3.5 w-3.5" />
                    {committee._count.members} members
                  </div>
                  {committee.meetingSchedule && (
                    <div className="flex items-center gap-2">
                      <Calendar className="h-3.5 w-3.5" />
                      {committee.meetingSchedule}
                    </div>
                  )}
                  {committee.meetingLocation && (
                    <div className="flex items-center gap-2">
                      <MapPin className="h-3.5 w-3.5" />
                      {committee.meetingLocation}
                    </div>
                  )}
                  {committee.meetingUrl && (
                    <div className="flex items-center gap-2">
                      <Video className="h-3.5 w-3.5" />
                      Virtual meeting available
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
