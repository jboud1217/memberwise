import type { Metadata } from "next";
import Link from "next/link";
import { getEvents, getEventStats } from "@/actions/events";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Plus,
  Calendar,
  MapPin,
  Video,
  Users,
  Clock,
  BarChart3,
  CalendarCheck,
  Ticket,
} from "lucide-react";
import { format } from "date-fns";

interface PageParams {
  search?: string;
  status?: string;
  page?: string;
}

const STATUS_BADGE: Record<string, { label: string; className: string }> = {
  DRAFT: { label: "Draft", className: "bg-gray-100 text-gray-700" },
  PUBLISHED: { label: "Published", className: "bg-green-100 text-green-700" },
  CANCELLED: { label: "Cancelled", className: "bg-red-100 text-red-700" },
  COMPLETED: { label: "Completed", className: "bg-blue-100 text-blue-700" },
};

const FORMAT_ICON: Record<string, typeof MapPin> = {
  IN_PERSON: MapPin,
  VIRTUAL: Video,
  HYBRID: Users,
};

export const metadata: Metadata = { title: "Events" };

export default async function EventsPage({
  searchParams,
}: {
  searchParams: Promise<PageParams>;
}) {
  const params = await searchParams;
  const page = parseInt(params.page || "1", 10);

  const [{ events, total }, stats] = await Promise.all([
    getEvents({
      search: params.search,
      status: params.status,
      page,
      pageSize: 20,
    }),
    getEventStats(),
  ]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Events</h1>
          <p className="text-sm text-[var(--muted-foreground)]">
            Plan, manage, and track your organization&apos;s events
          </p>
        </div>
        <Link href="/events/create">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Create Event
          </Button>
        </Link>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-4 gap-4 stagger-children">
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="rounded-lg bg-blue-50 p-2">
              <Calendar className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <div className="text-2xl font-bold">{stats.total}</div>
              <div className="text-xs text-[var(--muted-foreground)]">Total Events</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="rounded-lg bg-green-50 p-2">
              <CalendarCheck className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <div className="text-2xl font-bold">{stats.upcoming}</div>
              <div className="text-xs text-[var(--muted-foreground)]">Upcoming</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="rounded-lg bg-purple-50 p-2">
              <Ticket className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <div className="text-2xl font-bold">{stats.totalRegistrations}</div>
              <div className="text-xs text-[var(--muted-foreground)]">Total Registrations</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="rounded-lg bg-amber-50 p-2">
              <BarChart3 className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <div className="text-2xl font-bold">{stats.thisMonth}</div>
              <div className="text-xs text-[var(--muted-foreground)]">This Month</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Events list */}
      {events.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <Calendar className="mb-4 h-12 w-12 text-[var(--muted-foreground)]" />
            <h3 className="mb-2 text-lg font-semibold">No events yet</h3>
            <p className="mb-6 max-w-sm text-sm text-[var(--muted-foreground)]">
              Create your first event to start managing registrations, ticket sales, and check-ins.
            </p>
            <Link href="/events/create">
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Create Your First Event
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {events.map((event) => {
            const FormatIcon = FORMAT_ICON[event.format] || Calendar;
            const badge = STATUS_BADGE[event.status] || STATUS_BADGE.DRAFT;
            const isPast = new Date(event.endDate) < new Date();
            const isSoon =
              !isPast &&
              new Date(event.startDate).getTime() - Date.now() < 7 * 24 * 60 * 60 * 1000;

            return (
              <Link key={event.id} href={`/events/${event.id}`}>
                <Card className="transition-all hover:bg-[var(--muted)]/30 hover:shadow-[var(--shadow-sm)]">
                  <CardContent className="flex items-center gap-4 p-4">
                    {/* Date block */}
                    <div className="flex h-14 w-14 flex-shrink-0 flex-col items-center justify-center rounded-lg bg-[var(--muted)]">
                      <span className="text-xs font-medium uppercase text-[var(--muted-foreground)]">
                        {format(new Date(event.startDate), "MMM")}
                      </span>
                      <span className="text-xl font-bold leading-tight">
                        {format(new Date(event.startDate), "d")}
                      </span>
                    </div>

                    {/* Details */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="truncate font-semibold">{event.title}</h3>
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${badge.className}`}>
                          {badge.label}
                        </span>
                        {isSoon && (
                          <span className="rounded-full bg-orange-100 px-2 py-0.5 text-[10px] font-medium text-orange-700">
                            Soon
                          </span>
                        )}
                      </div>
                      <div className="mt-1 flex items-center gap-4 text-xs text-[var(--muted-foreground)]">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {format(new Date(event.startDate), "h:mm a")}
                          {" - "}
                          {format(new Date(event.endDate), "h:mm a")}
                        </span>
                        <span className="flex items-center gap-1">
                          <FormatIcon className="h-3 w-3" />
                          {event.format === "IN_PERSON"
                            ? event.venueName || "In Person"
                            : event.format === "VIRTUAL"
                            ? "Virtual"
                            : "Hybrid"}
                        </span>
                        {event.capacity && (
                          <span className="flex items-center gap-1">
                            <Users className="h-3 w-3" />
                            {event._count.registrations}/{event.capacity}
                          </span>
                        )}
                        {!event.isFree && event.nonMemberPrice && (
                          <span className="flex items-center gap-1">
                            <Ticket className="h-3 w-3" />$
                            {(event.nonMemberPrice / 100).toFixed(0)}
                            {event.memberPrice && event.memberPrice < event.nonMemberPrice
                              ? ` ($${(event.memberPrice / 100).toFixed(0)} members)`
                              : ""}
                          </span>
                        )}
                        {event.isFree && (
                          <Badge variant="secondary" className="text-[10px]">
                            Free
                          </Badge>
                        )}
                      </div>
                    </div>

                    {/* Registration count */}
                    <div className="flex-shrink-0 text-right">
                      <div className="text-lg font-bold">{event._count.registrations}</div>
                      <div className="text-xs text-[var(--muted-foreground)]">registered</div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
