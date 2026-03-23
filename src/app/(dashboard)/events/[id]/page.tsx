import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { getEvent } from "@/actions/events";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  Calendar,
  Clock,
  MapPin,
  Video,
  Users,
  Ticket,
  DollarSign,
  Mail,
  CheckCircle,
  XCircle,
  UserCheck,
  AlertCircle,
} from "lucide-react";
import { format } from "date-fns";
import { EventActions } from "./event-actions";

const STATUS_STYLE: Record<string, { label: string; className: string }> = {
  DRAFT: { label: "Draft", className: "bg-gray-100 text-gray-700" },
  PUBLISHED: { label: "Published", className: "bg-green-100 text-green-700" },
  CANCELLED: { label: "Cancelled", className: "bg-red-100 text-red-700" },
  COMPLETED: { label: "Completed", className: "bg-blue-100 text-blue-700" },
};

const REG_STATUS: Record<string, { icon: typeof CheckCircle; className: string }> = {
  REGISTERED: { icon: CheckCircle, className: "text-green-600" },
  WAITLISTED: { icon: AlertCircle, className: "text-yellow-600" },
  CHECKED_IN: { icon: UserCheck, className: "text-blue-600" },
  CANCELLED: { icon: XCircle, className: "text-red-400" },
  NO_SHOW: { icon: XCircle, className: "text-gray-400" },
};

export const metadata: Metadata = { title: "Event Details" };

export default async function EventDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const event = await getEvent(id);
  if (!event) notFound();

  const badge = STATUS_STYLE[event.status] || STATUS_STYLE.DRAFT;
  const activeRegistrations = event.registrations.filter(
    (r) => r.status === "REGISTERED" || r.status === "CHECKED_IN"
  );
  const checkedIn = event.registrations.filter((r) => r.status === "CHECKED_IN").length;
  const waitlisted = event.registrations.filter((r) => r.status === "WAITLISTED").length;
  const revenue = activeRegistrations.reduce((sum, r) => sum + r.amountPaid, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-4">
          <Link href="/events">
            <Button variant="outline" size="sm">
              <ArrowLeft className="mr-1 h-4 w-4" />
              Events
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold">{event.title}</h1>
              <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${badge.className}`}>
                {badge.label}
              </span>
            </div>
            <div className="mt-1 flex items-center gap-4 text-sm text-[var(--muted-foreground)]">
              <span className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                {format(new Date(event.startDate), "EEEE, MMMM d, yyyy")}
              </span>
              {!event.allDay && (
                <span className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  {format(new Date(event.startDate), "h:mm a")} -{" "}
                  {format(new Date(event.endDate), "h:mm a")}
                </span>
              )}
            </div>
          </div>
        </div>
        <EventActions event={event} />
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="rounded-lg bg-green-50 p-2">
              <Users className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <div className="text-2xl font-bold">
                {activeRegistrations.length}
                {event.capacity && <span className="text-sm font-normal text-[var(--muted-foreground)]">/{event.capacity}</span>}
              </div>
              <div className="text-xs text-[var(--muted-foreground)]">Registered</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="rounded-lg bg-blue-50 p-2">
              <UserCheck className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <div className="text-2xl font-bold">{checkedIn}</div>
              <div className="text-xs text-[var(--muted-foreground)]">Checked In</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="rounded-lg bg-yellow-50 p-2">
              <AlertCircle className="h-5 w-5 text-yellow-600" />
            </div>
            <div>
              <div className="text-2xl font-bold">{waitlisted}</div>
              <div className="text-xs text-[var(--muted-foreground)]">Waitlisted</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="rounded-lg bg-purple-50 p-2">
              <DollarSign className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <div className="text-2xl font-bold">${(revenue / 100).toFixed(0)}</div>
              <div className="text-xs text-[var(--muted-foreground)]">Revenue</div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Left: Details */}
        <div className="col-span-2 space-y-6">
          {/* Description */}
          {event.description && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">About This Event</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-wrap text-sm leading-relaxed">{event.description}</p>
              </CardContent>
            </Card>
          )}

          {/* Registrations list */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Registrations ({event.registrations.length})</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              {event.registrations.length === 0 ? (
                <p className="py-8 text-center text-sm text-[var(--muted-foreground)]">
                  No registrations yet
                </p>
              ) : (
                <div className="space-y-2">
                  {event.registrations.map((reg) => {
                    const st = REG_STATUS[reg.status] || REG_STATUS.REGISTERED;
                    const Icon = st.icon;
                    const name =
                      reg.member?.displayName ||
                      (reg.contact
                        ? `${reg.contact.firstName} ${reg.contact.lastName}`
                        : reg.guestName || "Unknown");

                    return (
                      <div
                        key={reg.id}
                        className="flex items-center justify-between rounded-md border border-[var(--border)] px-3 py-2"
                      >
                        <div className="flex items-center gap-3">
                          <Icon className={`h-4 w-4 ${st.className}`} />
                          <div>
                            <div className="text-sm font-medium">{name}</div>
                            <div className="text-xs text-[var(--muted-foreground)]">
                              {reg.contact?.email || reg.guestEmail || ""}
                              {reg.ticketType && ` · ${reg.ticketType.name}`}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-[var(--muted-foreground)]">
                          {reg.amountPaid > 0 && (
                            <span className="font-medium">${(reg.amountPaid / 100).toFixed(2)}</span>
                          )}
                          <span>{format(new Date(reg.createdAt), "MMM d")}</span>
                          <Badge variant="secondary" className="text-[10px] capitalize">
                            {reg.status.toLowerCase().replace("_", " ")}
                          </Badge>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right: Info sidebar */}
        <div className="space-y-4">
          {/* Location */}
          {(event.venueName || event.virtualUrl) && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-sm">
                  {event.format === "VIRTUAL" ? (
                    <Video className="h-4 w-4" />
                  ) : (
                    <MapPin className="h-4 w-4" />
                  )}
                  Location
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm">
                {event.venueName && <div className="font-medium">{event.venueName}</div>}
                {event.address1 && <div>{event.address1}</div>}
                {(event.city || event.state || event.zip) && (
                  <div>
                    {[event.city, event.state].filter(Boolean).join(", ")} {event.zip}
                  </div>
                )}
                {event.virtualUrl && (
                  <a
                    href={event.virtualUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2 inline-block text-blue-600 hover:underline"
                  >
                    Join Virtual Meeting
                  </a>
                )}
              </CardContent>
            </Card>
          )}

          {/* Pricing */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm">
                <Ticket className="h-4 w-4" />
                Pricing
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm">
              {event.isFree ? (
                <Badge variant="secondary">Free Event</Badge>
              ) : (
                <div className="space-y-1">
                  {event.nonMemberPrice && (
                    <div className="flex justify-between">
                      <span>Non-member</span>
                      <span className="font-medium">${(event.nonMemberPrice / 100).toFixed(2)}</span>
                    </div>
                  )}
                  {event.memberPrice && (
                    <div className="flex justify-between">
                      <span>Member</span>
                      <span className="font-medium">${(event.memberPrice / 100).toFixed(2)}</span>
                    </div>
                  )}
                  {event.ticketTypes.length > 0 && (
                    <div className="mt-3 space-y-1 border-t border-[var(--border)] pt-2">
                      {event.ticketTypes.map((tt) => (
                        <div key={tt.id} className="flex justify-between">
                          <span>{tt.name}</span>
                          <span className="font-medium">${(tt.price / 100).toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Contact */}
          {(event.contactName || event.contactEmail) && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-sm">
                  <Mail className="h-4 w-4" />
                  Event Contact
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm">
                {event.contactName && <div className="font-medium">{event.contactName}</div>}
                {event.contactEmail && (
                  <a href={`mailto:${event.contactEmail}`} className="text-blue-600 hover:underline">
                    {event.contactEmail}
                  </a>
                )}
              </CardContent>
            </Card>
          )}

          {/* Tags */}
          {event.tags.length > 0 && (
            <Card>
              <CardContent className="flex flex-wrap gap-1 p-4">
                {event.tags.map((tag) => (
                  <Badge key={tag} variant="secondary">
                    {tag}
                  </Badge>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
