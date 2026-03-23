import type { Metadata } from "next";
import { getVolunteerOpportunities, getVolunteerLogs, getVolunteerStats } from "@/actions/volunteers";
import { getMembers } from "@/actions/members";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  HandHeart,
  Clock,
  Users,
  CalendarDays,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { format } from "date-fns";
import { VolunteerActions } from "./volunteer-actions";

export const metadata: Metadata = { title: "Volunteers" };

export default async function VolunteersPage() {
  const [{ opportunities }, { logs }, stats, { members: memberList }] = await Promise.all([
    getVolunteerOpportunities({ pageSize: 20 }),
    getVolunteerLogs({ pageSize: 25 }),
    getVolunteerStats(),
    getMembers({ pageSize: 200 }),
  ]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Volunteers</h1>
          <p className="text-sm text-[var(--muted-foreground)]">
            Track volunteer hours, manage opportunities, and recognize contributions
          </p>
        </div>
        <VolunteerActions
          members={memberList.map((m) => ({ id: m.id, displayName: m.displayName || "" }))}
          opportunities={opportunities.map((o) => ({ id: o.id, title: o.title }))}
        />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5 stagger-children">
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="rounded-lg bg-green-50 p-2">
              <Clock className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <div className="text-2xl font-bold">{stats.totalHours.toFixed(1)}</div>
              <div className="text-xs text-[var(--muted-foreground)]">Total Hours</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="rounded-lg bg-blue-50 p-2">
              <Clock className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <div className="text-2xl font-bold">{stats.ytdHours.toFixed(1)}</div>
              <div className="text-xs text-[var(--muted-foreground)]">YTD Hours</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="rounded-lg bg-purple-50 p-2">
              <Users className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <div className="text-2xl font-bold">{stats.activeVolunteers}</div>
              <div className="text-xs text-[var(--muted-foreground)]">Active Volunteers</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="rounded-lg bg-amber-50 p-2">
              <CalendarDays className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <div className="text-2xl font-bold">{stats.activeOpportunities}</div>
              <div className="text-xs text-[var(--muted-foreground)]">Opportunities</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="rounded-lg bg-red-50 p-2">
              <AlertCircle className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <div className="text-2xl font-bold">{stats.pendingApproval}</div>
              <div className="text-xs text-[var(--muted-foreground)]">Pending Approval</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Opportunities */}
      {opportunities.length > 0 && (
        <div>
          <h2 className="mb-3 text-lg font-semibold">Volunteer Opportunities</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 stagger-children">
            {opportunities.map((opp) => (
              <Card key={opp.id} className="transition-all hover:shadow-[var(--shadow-sm)] hover:border-[var(--ring)]/20">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <h3 className="font-semibold">{opp.title}</h3>
                    <Badge variant={opp.isActive ? "default" : "secondary"}>
                      {opp.isActive ? "Active" : "Closed"}
                    </Badge>
                  </div>
                  {opp.description && (
                    <p className="mt-1 line-clamp-2 text-sm text-[var(--muted-foreground)]">
                      {opp.description}
                    </p>
                  )}
                  <div className="mt-3 flex items-center gap-3 text-xs text-[var(--muted-foreground)]">
                    {opp.date && (
                      <span>{format(new Date(opp.date), "MMM d, yyyy")}</span>
                    )}
                    {opp.location && <span>{opp.location}</span>}
                    <span>{opp._count.logs} volunteers</span>
                  </div>
                  {opp.skills.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {opp.skills.map((skill) => (
                        <Badge key={skill} variant="secondary" className="text-[10px]">
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Hour Logs */}
      {logs.length === 0 && opportunities.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <HandHeart className="mb-4 h-12 w-12 text-[var(--muted-foreground)]" />
            <h3 className="mb-2 text-lg font-semibold">No volunteer activity yet</h3>
            <p className="mb-6 max-w-sm text-sm text-[var(--muted-foreground)]">
              Create volunteer opportunities and track member hours to recognize contributions.
            </p>
            <VolunteerActions
              members={memberList.map((m) => ({ id: m.id, displayName: m.displayName || "" }))}
              opportunities={[]}
            />
          </CardContent>
        </Card>
      ) : (
        <div>
          <h2 className="mb-3 text-lg font-semibold">Recent Volunteer Hours</h2>
          <Card>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-[var(--muted-foreground)]">
                    <th className="px-4 py-3 font-medium">Date</th>
                    <th className="px-4 py-3 font-medium">Volunteer</th>
                    <th className="px-4 py-3 font-medium">Opportunity</th>
                    <th className="px-4 py-3 font-medium">Hours</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log) => (
                    <tr key={log.id} className="border-b last:border-0 transition-colors hover:bg-[var(--accent)]/50">
                      <td className="px-4 py-3">{format(new Date(log.date), "MMM d, yyyy")}</td>
                      <td className="px-4 py-3">{log.member.displayName}</td>
                      <td className="px-4 py-3">{log.opportunity?.title || "—"}</td>
                      <td className="px-4 py-3 font-medium">{log.hours}h</td>
                      <td className="px-4 py-3">
                        {log.approved ? (
                          <Badge className="bg-green-100 text-green-700">
                            <CheckCircle2 className="mr-1 h-3 w-3" />
                            Approved
                          </Badge>
                        ) : (
                          <Badge className="bg-yellow-100 text-yellow-700">
                            <AlertCircle className="mr-1 h-3 w-3" />
                            Pending
                          </Badge>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
