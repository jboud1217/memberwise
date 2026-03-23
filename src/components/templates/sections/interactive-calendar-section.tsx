"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Calendar,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Clock,
  Filter,
  Grid3X3,
  ImageIcon,
  LayoutList,
  List,
  MapPin,
  Tag,
  Users,
  Video,
  X,
} from "lucide-react";
import { getPublicEvents, type PublicEvent } from "@/actions/public-events";

// ─── Types ───────────────────────────────────────────

type ViewMode = "month" | "week" | "agenda";

interface InteractiveCalendarSectionProps {
  heading?: string;
  subheading?: string;
  showPastEvents?: boolean;
  accentColor?: string;
}

// ─── Helpers ─────────────────────────────────────────

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfWeek(year: number, month: number) {
  return new Date(year, month, 1).getDay();
}

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const MONTH_SHORT = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const DAY_FULL = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString([], { weekday: "long", month: "long", day: "numeric", year: "numeric" });
}

function formatShortDate(iso: string) {
  return new Date(iso).toLocaleDateString([], { month: "short", day: "numeric" });
}

function isPast(iso: string) {
  return new Date(iso) < new Date();
}

function isSameDay(d1: Date, d2: Date) {
  return d1.getFullYear() === d2.getFullYear() && d1.getMonth() === d2.getMonth() && d1.getDate() === d2.getDate();
}

function eventFallsOnDay(event: PublicEvent, year: number, month: number, day: number): boolean {
  const dayStart = new Date(year, month, day);
  const dayEnd = new Date(year, month, day + 1);
  const eStart = new Date(event.startDate);
  const eEnd = new Date(event.endDate);
  return eStart < dayEnd && eEnd >= dayStart;
}

function getWeekDates(date: Date): Date[] {
  const start = new Date(date);
  start.setDate(start.getDate() - start.getDay());
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    return d;
  });
}

function getAllTags(events: PublicEvent[]): string[] {
  const tags = new Set<string>();
  events.forEach((e) => e.tags?.forEach((t) => tags.add(t)));
  return Array.from(tags).sort();
}

// ─── Hover Preview Tooltip ───────────────────────────

function EventTooltip({
  event,
  anchorRect,
}: {
  event: PublicEvent;
  anchorRect: DOMRect;
}) {
  const past = isPast(event.endDate);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ top: 0, left: 0 });

  useEffect(() => {
    if (!tooltipRef.current) return;
    const tt = tooltipRef.current.getBoundingClientRect();
    let top = anchorRect.top - tt.height - 8;
    let left = anchorRect.left + anchorRect.width / 2 - tt.width / 2;
    // Flip below if no room above
    if (top < 8) top = anchorRect.bottom + 8;
    // Clamp horizontal
    if (left < 8) left = 8;
    if (left + tt.width > window.innerWidth - 8) left = window.innerWidth - tt.width - 8;
    setPos({ top, left });
  }, [anchorRect]);

  return (
    <div
      ref={tooltipRef}
      className="fixed z-[9998] w-72 animate-[fadeScale_150ms_ease-out] rounded-xl border border-[var(--border)] bg-[var(--card)] p-3 shadow-xl"
      style={{ top: pos.top, left: pos.left }}
    >
      {event.coverImage && (
        <div className="mb-2 h-24 w-full overflow-hidden rounded-lg">
          <img src={event.coverImage} alt="" className="h-full w-full object-cover" />
        </div>
      )}
      <div className="flex items-center gap-1.5 mb-1">
        <span className={`inline-block h-2 w-2 rounded-full ${past ? "bg-[var(--muted-foreground)]" : "bg-emerald-500"}`} />
        <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">
          {past ? "Past" : "Upcoming"}
        </span>
      </div>
      <h4 className="text-sm font-bold text-[var(--foreground)] leading-tight">{event.title}</h4>
      <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-0.5 text-[11px] text-[var(--muted-foreground)]">
        <span className="flex items-center gap-1">
          <Clock className="h-3 w-3" />
          {event.allDay ? "All day" : `${formatTime(event.startDate)} – ${formatTime(event.endDate)}`}
        </span>
        {event.venueName && (
          <span className="flex items-center gap-1">
            <MapPin className="h-3 w-3" />
            {event.venueName}
          </span>
        )}
      </div>
      {event.description && (
        <p className="mt-1.5 text-[11px] text-[var(--muted-foreground)] line-clamp-2">{event.description}</p>
      )}
      <p className="mt-2 text-[10px] font-medium text-[var(--primary)]">Click to view details</p>
    </div>
  );
}

// ─── Event Detail Modal ──────────────────────────────

function EventModal({
  event,
  onClose,
  onPrev,
  onNext,
  hasPrev,
  hasNext,
}: {
  event: PublicEvent;
  onClose: () => void;
  onPrev?: () => void;
  onNext?: () => void;
  hasPrev?: boolean;
  hasNext?: boolean;
}) {
  const past = isPast(event.endDate);
  const locationParts = [event.venueName, event.city, event.state].filter(Boolean);
  const location = locationParts.join(", ");
  const [showFullBody, setShowFullBody] = useState(false);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft" && hasPrev && onPrev) onPrev();
      if (e.key === "ArrowRight" && hasNext && onNext) onNext();
    }
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose, onPrev, onNext, hasPrev, hasNext]);

  // Capacity bar
  const capacityPct = event.capacity ? Math.min(100, (event.registrationCount / event.capacity) * 100) : 0;

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-[fadeIn_150ms_ease-out]" />

      {/* Prev/Next navigation arrows */}
      {hasPrev && onPrev && (
        <button
          onClick={(e) => { e.stopPropagation(); onPrev(); }}
          className="absolute left-2 top-1/2 z-10 -translate-y-1/2 rounded-full bg-black/40 p-2 text-white backdrop-blur-sm transition-all hover:bg-black/60 hover:scale-110 sm:left-6"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
      )}
      {hasNext && onNext && (
        <button
          onClick={(e) => { e.stopPropagation(); onNext(); }}
          className="absolute right-2 top-1/2 z-10 -translate-y-1/2 rounded-full bg-black/40 p-2 text-white backdrop-blur-sm transition-all hover:bg-black/60 hover:scale-110 sm:right-6"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      )}

      {/* Modal content */}
      <div className="relative z-10 w-full max-w-lg max-h-[85vh] overflow-y-auto rounded-2xl bg-[var(--card)] shadow-2xl border border-[var(--border)] animate-[modalSlideUp_200ms_ease-out]">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute right-3 top-3 z-10 rounded-full bg-black/30 p-1.5 text-white backdrop-blur-sm transition-all hover:bg-black/50 hover:scale-110"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Cover image */}
        {event.coverImage ? (
          <div className="relative h-52 w-full overflow-hidden rounded-t-2xl">
            <img
              src={event.coverImage}
              alt={event.title}
              className="h-full w-full object-cover transition-transform duration-500 hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
            <div className="absolute bottom-3 left-4 right-4">
              <div className="flex items-center gap-2 mb-1.5">
                {past ? (
                  <span className="rounded-full bg-white/20 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-white backdrop-blur-sm">
                    Completed
                  </span>
                ) : (
                  <span className="rounded-full bg-emerald-500/80 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-white backdrop-blur-sm">
                    Upcoming
                  </span>
                )}
                {event.format !== "IN_PERSON" && (
                  <span className="rounded-full bg-blue-500/80 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-white backdrop-blur-sm">
                    {event.format === "VIRTUAL" ? "Virtual" : "Hybrid"}
                  </span>
                )}
              </div>
              <h3 className="text-lg font-bold text-white leading-tight drop-shadow-md">{event.title}</h3>
            </div>
          </div>
        ) : (
          <div className={`relative overflow-hidden rounded-t-2xl ${past ? "h-28" : "h-20"} bg-gradient-to-br from-[var(--primary)]/20 via-[var(--accent)] to-[var(--muted)]`}>
            <div className="absolute inset-0 flex items-center justify-center opacity-10">
              <Calendar className="h-20 w-20" />
            </div>
          </div>
        )}

        {/* Content */}
        <div className="p-6">
          {/* Title (when no cover image shows it inline) */}
          {!event.coverImage && (
            <>
              <div className="mb-2 flex items-center gap-2">
                {past ? (
                  <span className="rounded-full bg-[var(--muted)] px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">Completed</span>
                ) : (
                  <span className="rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-emerald-600">Upcoming</span>
                )}
                {event.format !== "IN_PERSON" && (
                  <span className="rounded-full bg-blue-500/10 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-blue-600">
                    {event.format === "VIRTUAL" ? "Virtual" : "Hybrid"}
                  </span>
                )}
              </div>
              <h3 className="text-xl font-bold text-[var(--foreground)]">{event.title}</h3>
            </>
          )}

          {/* Info rows — clickable/expandable */}
          <div className="mt-4 space-y-2.5">
            <div className="flex items-start gap-2.5 text-sm text-[var(--muted-foreground)]">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[var(--primary)]/10">
                <Calendar className="h-4 w-4 text-[var(--primary)]" />
              </div>
              <div>
                <p className="font-medium text-[var(--foreground)]">{formatDate(event.startDate)}</p>
                {!event.allDay && (
                  <p className="flex items-center gap-1 text-xs mt-0.5">
                    <Clock className="h-3 w-3" />
                    {formatTime(event.startDate)} – {formatTime(event.endDate)}
                  </p>
                )}
              </div>
            </div>

            {location && (
              <div className="flex items-start gap-2.5 text-sm text-[var(--muted-foreground)]">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[var(--primary)]/10">
                  <MapPin className="h-4 w-4 text-[var(--primary)]" />
                </div>
                <div>
                  <p className="font-medium text-[var(--foreground)]">{event.venueName || location}</p>
                  {event.address1 && <p className="text-xs mt-0.5">{event.address1}</p>}
                  {event.city && (
                    <p className="text-xs">{[event.city, event.state].filter(Boolean).join(", ")}</p>
                  )}
                </div>
              </div>
            )}

            {event.virtualUrl && !past && (
              <div className="flex items-center gap-2.5 text-sm">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-500/10">
                  <Video className="h-4 w-4 text-blue-600" />
                </div>
                <a
                  href={event.virtualUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-[var(--primary)] underline underline-offset-2 hover:opacity-80"
                >
                  Join Virtual Event
                </a>
              </div>
            )}

            {/* Capacity with visual bar */}
            {!past && event.capacity && (
              <div className="flex items-start gap-2.5 text-sm text-[var(--muted-foreground)]">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[var(--primary)]/10">
                  <Users className="h-4 w-4 text-[var(--primary)]" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-[var(--foreground)]">
                    {event.registrationCount} / {event.capacity} registered
                  </p>
                  <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-[var(--muted)]">
                    <div
                      className={`h-full rounded-full transition-all duration-700 ease-out ${
                        capacityPct >= 90 ? "bg-red-500" : capacityPct >= 70 ? "bg-amber-500" : "bg-emerald-500"
                      }`}
                      style={{ width: `${capacityPct}%` }}
                    />
                  </div>
                  {capacityPct >= 90 && (
                    <p className="mt-1 text-[10px] font-medium text-red-500">Almost full!</p>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Description — expandable */}
          {event.description && (
            <div className="mt-5 border-t border-[var(--border)] pt-4">
              <p className={`text-sm leading-relaxed text-[var(--muted-foreground)] ${!showFullBody && event.body ? "line-clamp-3" : ""}`}>
                {event.description}
              </p>
            </div>
          )}

          {/* Body — expandable section for past events */}
          {past && event.body && (
            <div className="mt-2">
              <button
                onClick={() => setShowFullBody(!showFullBody)}
                className="flex items-center gap-1 text-xs font-medium text-[var(--primary)] hover:underline"
              >
                {showFullBody ? "Show less" : "Read more"}
                {showFullBody ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
              </button>
              {showFullBody && (
                <div className="mt-2 animate-[expand_200ms_ease-out]">
                  <div
                    className="prose prose-sm max-w-none text-[var(--muted-foreground)]"
                    dangerouslySetInnerHTML={{ __html: event.body }}
                  />
                </div>
              )}
            </div>
          )}

          {/* Tags — clickable */}
          {event.tags && event.tags.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-1.5">
              {event.tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 rounded-full bg-[var(--accent)] px-2.5 py-0.5 text-[10px] font-medium text-[var(--accent-foreground)] transition-colors hover:bg-[var(--primary)]/15 cursor-default"
                >
                  <Tag className="h-2.5 w-2.5" />
                  {tag}
                </span>
              ))}
            </div>
          )}

          {/* Pricing & registration for future events */}
          {!past && (
            <div className="mt-5 border-t border-[var(--border)] pt-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-[var(--foreground)]">
                  {event.isFree
                    ? "Free Event"
                    : event.nonMemberPrice
                      ? `$${event.nonMemberPrice}`
                      : "Paid Event"}
                </span>
                {!event.isFree && event.memberPrice && (
                  <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-600">
                    Members: ${event.memberPrice}
                  </span>
                )}
              </div>
              {event.capacity && event.registrationCount >= event.capacity ? (
                <div className="rounded-[var(--radius)] bg-[var(--muted)] px-4 py-3 text-center text-sm font-medium text-[var(--muted-foreground)]">
                  Event is Full
                </div>
              ) : (
                <button className="group w-full rounded-[var(--radius)] bg-[var(--primary)] px-4 py-3 text-sm font-semibold text-[var(--primary-foreground)] shadow-sm transition-all hover:shadow-md hover:scale-[1.02] active:scale-[0.98]">
                  Register Now
                  <ChevronRight className="inline-block ml-1 h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </button>
              )}
            </div>
          )}

          {/* Contact */}
          {(event.contactName || event.contactEmail) && (
            <div className="mt-4 rounded-[var(--radius)] bg-[var(--muted)] p-3 text-xs text-[var(--muted-foreground)]">
              <p className="font-medium text-[var(--foreground)]">Contact</p>
              {event.contactName && <p>{event.contactName}</p>}
              {event.contactEmail && (
                <a href={`mailto:${event.contactEmail}`} className="text-[var(--primary)] hover:underline">
                  {event.contactEmail}
                </a>
              )}
            </div>
          )}

          {/* Keyboard hint */}
          <div className="mt-4 flex items-center justify-center gap-3 text-[10px] text-[var(--muted-foreground)]">
            {hasPrev && <span className="rounded border border-[var(--border)] px-1.5 py-0.5 font-mono">&#x2190;</span>}
            <span className="rounded border border-[var(--border)] px-1.5 py-0.5 font-mono">ESC</span>
            {hasNext && <span className="rounded border border-[var(--border)] px-1.5 py-0.5 font-mono">&#x2192;</span>}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Day Popover (expanded day view) ─────────────────

function DayPopover({
  date,
  events,
  onEventClick,
  onClose,
  anchorRect,
}: {
  date: Date;
  events: PublicEvent[];
  onEventClick: (event: PublicEvent) => void;
  onClose: () => void;
  anchorRect: DOMRect;
}) {
  const popRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ top: 0, left: 0 });

  useEffect(() => {
    if (!popRef.current) return;
    const pop = popRef.current.getBoundingClientRect();
    let top = anchorRect.bottom + 4;
    let left = anchorRect.left + anchorRect.width / 2 - pop.width / 2;
    if (top + pop.height > window.innerHeight - 16) top = anchorRect.top - pop.height - 4;
    if (left < 8) left = 8;
    if (left + pop.width > window.innerWidth - 8) left = window.innerWidth - pop.width - 8;
    setPos({ top, left });
  }, [anchorRect]);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (popRef.current && !popRef.current.contains(e.target as Node)) onClose();
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    setTimeout(() => document.addEventListener("mousedown", onClick), 0);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  return (
    <div
      ref={popRef}
      className="fixed z-[9997] w-72 animate-[fadeScale_150ms_ease-out] rounded-xl border border-[var(--border)] bg-[var(--card)] p-3 shadow-2xl"
      style={{ top: pos.top, left: pos.left }}
    >
      <div className="mb-2 flex items-center justify-between">
        <h4 className="text-sm font-bold text-[var(--foreground)]">
          {DAY_FULL[date.getDay()]}, {MONTH_SHORT[date.getMonth()]} {date.getDate()}
        </h4>
        <button onClick={onClose} className="rounded-full p-1 text-[var(--muted-foreground)] hover:bg-[var(--accent)] transition-colors">
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
      {events.length === 0 ? (
        <p className="py-3 text-center text-xs text-[var(--muted-foreground)]">No events</p>
      ) : (
        <div className="max-h-64 space-y-1.5 overflow-y-auto">
          {events.map((event) => {
            const past = isPast(event.endDate);
            return (
              <button
                key={event.id}
                onClick={() => { onEventClick(event); onClose(); }}
                className="flex w-full items-start gap-2 rounded-lg p-2 text-left transition-all hover:bg-[var(--accent)]"
              >
                <div className={`mt-1 h-2 w-2 shrink-0 rounded-full ${past ? "bg-[var(--muted-foreground)]" : "bg-emerald-500"}`} />
                <div className="flex-1 overflow-hidden">
                  <p className="text-xs font-semibold text-[var(--foreground)] truncate">{event.title}</p>
                  <p className="text-[10px] text-[var(--muted-foreground)]">
                    {event.allDay ? "All day" : formatTime(event.startDate)}
                    {event.venueName && ` · ${event.venueName}`}
                  </p>
                </div>
                <ChevronRight className="mt-1 h-3 w-3 shrink-0 text-[var(--muted-foreground)]" />
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Day Cell ────────────────────────────────────────

function DayCell({
  day,
  isToday,
  isCurrentMonth,
  isSelected,
  events,
  onEventClick,
  onDayClick,
  onEventHover,
  onEventLeave,
}: {
  day: number;
  isToday: boolean;
  isCurrentMonth: boolean;
  isSelected: boolean;
  events: PublicEvent[];
  onEventClick: (event: PublicEvent) => void;
  onDayClick: (e: React.MouseEvent) => void;
  onEventHover: (event: PublicEvent, rect: DOMRect) => void;
  onEventLeave: () => void;
}) {
  const maxVisible = 2;
  const visible = events.slice(0, maxVisible);
  const overflow = events.length - maxVisible;

  return (
    <div
      onClick={events.length > 0 ? onDayClick : undefined}
      className={`min-h-[80px] border border-[var(--border)] p-1 transition-all duration-150 sm:min-h-[100px] sm:p-1.5 ${
        isCurrentMonth ? "bg-[var(--card)]" : "bg-[var(--muted)]/30"
      } ${isSelected ? "ring-2 ring-[var(--primary)] ring-inset" : ""} ${
        events.length > 0 ? "cursor-pointer hover:bg-[var(--accent)]/30" : ""
      }`}
    >
      <span
        className={`mb-0.5 inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium transition-all sm:h-7 sm:w-7 sm:text-sm ${
          isToday
            ? "bg-[var(--primary)] text-[var(--primary-foreground)] font-bold shadow-sm shadow-[var(--primary)]/25"
            : isCurrentMonth
              ? "text-[var(--foreground)]"
              : "text-[var(--muted-foreground)]/50"
        }`}
      >
        {day}
      </span>
      <div className="space-y-0.5">
        {visible.map((event) => {
          const past = isPast(event.endDate);
          return (
            <button
              key={event.id}
              onClick={(e) => { e.stopPropagation(); onEventClick(event); }}
              onMouseEnter={(e) => onEventHover(event, e.currentTarget.getBoundingClientRect())}
              onMouseLeave={onEventLeave}
              className={`block w-full truncate rounded-md px-1.5 py-0.5 text-left text-[10px] font-medium leading-tight transition-all hover:shadow-sm hover:scale-[1.02] sm:text-xs ${
                past
                  ? "bg-[var(--muted)] text-[var(--muted-foreground)] hover:bg-[var(--muted)]/80"
                  : "bg-[var(--primary)]/15 text-[var(--primary)] hover:bg-[var(--primary)]/25"
              }`}
            >
              {!event.allDay && <span className="mr-0.5 opacity-60">{formatTime(event.startDate).replace(/\s/g, "").toLowerCase()}</span>}
              {event.title}
            </button>
          );
        })}
        {overflow > 0 && (
          <button
            onClick={onDayClick}
            className="block w-full px-1 text-[9px] font-semibold text-[var(--primary)] hover:underline sm:text-[10px]"
          >
            +{overflow} more
          </button>
        )}
      </div>
      {/* Event dot indicators on mobile when events overflow */}
      {events.length > 0 && (
        <div className="mt-0.5 flex justify-center gap-0.5 sm:hidden">
          {events.slice(0, 4).map((e, i) => (
            <div key={i} className={`h-1 w-1 rounded-full ${isPast(e.endDate) ? "bg-[var(--muted-foreground)]" : "bg-[var(--primary)]"}`} />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Week View ───────────────────────────────────────

function WeekView({
  weekDates,
  events,
  onEventClick,
  onEventHover,
  onEventLeave,
}: {
  weekDates: Date[];
  events: PublicEvent[];
  onEventClick: (event: PublicEvent) => void;
  onEventHover: (event: PublicEvent, rect: DOMRect) => void;
  onEventLeave: () => void;
}) {
  const today = new Date();

  return (
    <div className="overflow-hidden rounded-[var(--radius)] border border-[var(--border)] shadow-sm">
      <div className="grid grid-cols-7 divide-x divide-[var(--border)]">
        {weekDates.map((date, i) => {
          const isToday = isSameDay(date, today);
          const dayEvents = events.filter((e) =>
            eventFallsOnDay(e, date.getFullYear(), date.getMonth(), date.getDate())
          );

          return (
            <div
              key={i}
              className={`min-h-[180px] p-2 transition-colors ${
                isToday ? "bg-[var(--primary)]/5" : "bg-[var(--card)]"
              }`}
            >
              <div className="mb-2 text-center">
                <div className="text-[10px] font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">
                  {DAY_NAMES[i]}
                </div>
                <div
                  className={`mx-auto mt-0.5 inline-flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold ${
                    isToday
                      ? "bg-[var(--primary)] text-[var(--primary-foreground)] shadow-sm"
                      : "text-[var(--foreground)]"
                  }`}
                >
                  {date.getDate()}
                </div>
              </div>
              <div className="space-y-1">
                {dayEvents.map((event) => {
                  const past = isPast(event.endDate);
                  return (
                    <button
                      key={event.id}
                      onClick={() => onEventClick(event)}
                      onMouseEnter={(e) => onEventHover(event, e.currentTarget.getBoundingClientRect())}
                      onMouseLeave={onEventLeave}
                      className={`block w-full rounded-md p-1.5 text-left transition-all hover:shadow-sm hover:scale-[1.02] ${
                        past
                          ? "bg-[var(--muted)] hover:bg-[var(--muted)]/80"
                          : "bg-[var(--primary)]/10 hover:bg-[var(--primary)]/20"
                      }`}
                    >
                      <p className={`text-[10px] font-semibold leading-tight truncate ${
                        past ? "text-[var(--muted-foreground)]" : "text-[var(--primary)]"
                      }`}>
                        {event.title}
                      </p>
                      <p className="mt-0.5 text-[9px] text-[var(--muted-foreground)]">
                        {event.allDay ? "All day" : formatTime(event.startDate)}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Agenda View ─────────────────────────────────────

function AgendaView({
  events,
  onEventClick,
  showPast,
}: {
  events: PublicEvent[];
  onEventClick: (event: PublicEvent) => void;
  showPast: boolean;
}) {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  // Group events by date
  const grouped = useMemo(() => {
    const sorted = [...events].sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
    const groups: { date: string; label: string; events: PublicEvent[] }[] = [];
    for (const event of sorted) {
      if (!showPast && isPast(event.endDate)) continue;
      const dateKey = new Date(event.startDate).toDateString();
      const existing = groups.find((g) => g.date === dateKey);
      if (existing) {
        existing.events.push(event);
      } else {
        groups.push({ date: dateKey, label: formatDate(event.startDate), events: [event] });
      }
    }
    return groups;
  }, [events, showPast]);

  if (grouped.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-[var(--radius)] border border-dashed border-[var(--border)] bg-[var(--muted)] p-12 text-center">
        <Calendar className="mb-3 h-10 w-10 text-[var(--muted-foreground)]/40" />
        <p className="text-sm font-medium text-[var(--foreground)]">No events</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {grouped.map((group) => (
        <div key={group.date}>
          <div className="mb-2 flex items-center gap-3">
            <div className={`flex h-10 w-10 shrink-0 flex-col items-center justify-center rounded-lg ${
              isSameDay(new Date(group.date), new Date())
                ? "bg-[var(--primary)] text-[var(--primary-foreground)]"
                : "bg-[var(--muted)] text-[var(--foreground)]"
            }`}>
              <span className="text-[9px] font-bold uppercase leading-none">
                {MONTH_SHORT[new Date(group.date).getMonth()]}
              </span>
              <span className="text-sm font-bold leading-tight">
                {new Date(group.date).getDate()}
              </span>
            </div>
            <div>
              <p className="text-sm font-semibold text-[var(--foreground)]">
                {DAY_FULL[new Date(group.date).getDay()]}
              </p>
              <p className="text-[10px] text-[var(--muted-foreground)]">{group.events.length} event{group.events.length !== 1 ? "s" : ""}</p>
            </div>
          </div>
          <div className="ml-5 border-l-2 border-[var(--border)] pl-5 space-y-2">
            {group.events.map((event) => {
              const past = isPast(event.endDate);
              const isExpanded = expandedIds.has(event.id);

              return (
                <div
                  key={event.id}
                  className={`overflow-hidden rounded-[var(--radius)] border transition-all duration-200 ${
                    isExpanded ? "border-[var(--primary)]/30 shadow-md" : "border-[var(--border)]"
                  } bg-[var(--card)]`}
                >
                  {/* Collapsed header — always visible */}
                  <button
                    onClick={() => toggleExpand(event.id)}
                    className="flex w-full items-center gap-3 p-3 text-left transition-colors hover:bg-[var(--accent)]/30"
                  >
                    <div className={`h-2.5 w-2.5 shrink-0 rounded-full ${past ? "bg-[var(--muted-foreground)]" : "bg-emerald-500 shadow-sm shadow-emerald-500/30"}`} />
                    <div className="flex-1 overflow-hidden">
                      <p className="text-sm font-semibold text-[var(--card-foreground)] truncate">{event.title}</p>
                      <p className="text-[11px] text-[var(--muted-foreground)]">
                        {event.allDay ? "All day" : `${formatTime(event.startDate)} – ${formatTime(event.endDate)}`}
                        {event.venueName && ` · ${event.venueName}`}
                      </p>
                    </div>
                    {event.coverImage && (
                      <div className="h-10 w-14 shrink-0 overflow-hidden rounded">
                        <img src={event.coverImage} alt="" className="h-full w-full object-cover" />
                      </div>
                    )}
                    <ChevronDown className={`h-4 w-4 shrink-0 text-[var(--muted-foreground)] transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`} />
                  </button>

                  {/* Expanded content */}
                  {isExpanded && (
                    <div className="border-t border-[var(--border)] animate-[expand_200ms_ease-out]">
                      {event.coverImage && (
                        <div className="h-36 w-full overflow-hidden">
                          <img src={event.coverImage} alt={event.title} className="h-full w-full object-cover" />
                        </div>
                      )}
                      <div className="p-3 space-y-2 text-xs text-[var(--muted-foreground)]">
                        {event.description && (
                          <p className="leading-relaxed">{event.description}</p>
                        )}
                        <div className="flex flex-wrap gap-x-4 gap-y-1">
                          {event.venueName && (
                            <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{event.venueName}</span>
                          )}
                          {event.format === "VIRTUAL" && (
                            <span className="flex items-center gap-1"><Video className="h-3 w-3" />Virtual</span>
                          )}
                          {!event.isFree && (
                            <span className="flex items-center gap-1">
                              ${event.nonMemberPrice || "Paid"}
                            </span>
                          )}
                        </div>
                        {event.tags && event.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {event.tags.map((tag) => (
                              <span key={tag} className="rounded-full bg-[var(--accent)] px-2 py-0.5 text-[10px] font-medium">{tag}</span>
                            ))}
                          </div>
                        )}
                        <button
                          onClick={(e) => { e.stopPropagation(); onEventClick(event); }}
                          className="mt-1 inline-flex items-center gap-1 text-[11px] font-semibold text-[var(--primary)] hover:underline"
                        >
                          View full details <ChevronRight className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Mini Month Picker ───────────────────────────────

function MiniMonthPicker({
  currentYear,
  currentMonth,
  onSelect,
  onClose,
}: {
  currentYear: number;
  currentMonth: number;
  onSelect: (year: number, month: number) => void;
  onClose: () => void;
}) {
  const [year, setYear] = useState(currentYear);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    }
    setTimeout(() => document.addEventListener("mousedown", onClick), 0);
    return () => document.removeEventListener("mousedown", onClick);
  }, [onClose]);

  return (
    <div ref={ref} className="absolute top-full left-0 z-50 mt-1 w-56 animate-[fadeScale_150ms_ease-out] rounded-xl border border-[var(--border)] bg-[var(--card)] p-3 shadow-xl">
      <div className="mb-2 flex items-center justify-between">
        <button onClick={() => setYear((y) => y - 1)} className="rounded p-0.5 hover:bg-[var(--accent)]">
          <ChevronLeft className="h-4 w-4" />
        </button>
        <span className="text-sm font-bold text-[var(--foreground)]">{year}</span>
        <button onClick={() => setYear((y) => y + 1)} className="rounded p-0.5 hover:bg-[var(--accent)]">
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
      <div className="grid grid-cols-3 gap-1">
        {MONTH_SHORT.map((name, i) => {
          const isActive = year === currentYear && i === currentMonth;
          const isThisMonth = year === new Date().getFullYear() && i === new Date().getMonth();
          return (
            <button
              key={name}
              onClick={() => { onSelect(year, i); onClose(); }}
              className={`rounded-lg px-2 py-1.5 text-xs font-medium transition-all ${
                isActive
                  ? "bg-[var(--primary)] text-[var(--primary-foreground)] shadow-sm"
                  : isThisMonth
                    ? "bg-[var(--primary)]/10 text-[var(--primary)] hover:bg-[var(--primary)]/20"
                    : "text-[var(--foreground)] hover:bg-[var(--accent)]"
              }`}
            >
              {name}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── Tag Filter Bar ──────────────────────────────────

function TagFilterBar({
  allTags,
  selectedTags,
  onToggle,
  onClear,
}: {
  allTags: string[];
  selectedTags: Set<string>;
  onToggle: (tag: string) => void;
  onClear: () => void;
}) {
  if (allTags.length === 0) return null;

  return (
    <div className="mb-4 flex flex-wrap items-center gap-1.5">
      <Filter className="h-3.5 w-3.5 text-[var(--muted-foreground)]" />
      {allTags.map((tag) => (
        <button
          key={tag}
          onClick={() => onToggle(tag)}
          className={`rounded-full px-2.5 py-0.5 text-[10px] font-medium transition-all ${
            selectedTags.has(tag)
              ? "bg-[var(--primary)] text-[var(--primary-foreground)] shadow-sm"
              : "bg-[var(--accent)] text-[var(--accent-foreground)] hover:bg-[var(--accent)]/80"
          }`}
        >
          {tag}
        </button>
      ))}
      {selectedTags.size > 0 && (
        <button onClick={onClear} className="ml-1 text-[10px] font-medium text-[var(--primary)] hover:underline">
          Clear
        </button>
      )}
    </div>
  );
}

// ─── CSS Keyframes (injected once) ───────────────────

function AnimationStyles() {
  return (
    <style>{`
      @keyframes fadeScale {
        from { opacity: 0; transform: scale(0.95); }
        to { opacity: 1; transform: scale(1); }
      }
      @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
      }
      @keyframes modalSlideUp {
        from { opacity: 0; transform: translateY(16px) scale(0.97); }
        to { opacity: 1; transform: translateY(0) scale(1); }
      }
      @keyframes expand {
        from { opacity: 0; max-height: 0; }
        to { opacity: 1; max-height: 500px; }
      }
      @keyframes slideMonth {
        from { opacity: 0; transform: translateX(var(--slide-dir, 20px)); }
        to { opacity: 1; transform: translateX(0); }
      }
    `}</style>
  );
}

// ─── Main Component ──────────────────────────────────

export function InteractiveCalendarSection({
  heading,
  subheading,
  showPastEvents = true,
}: InteractiveCalendarSectionProps) {
  const today = new Date();
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [events, setEvents] = useState<PublicEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<PublicEvent | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("month");
  const [showMonthPicker, setShowMonthPicker] = useState(false);
  const [selectedTags, setSelectedTags] = useState<Set<string>>(new Set());
  const [hoveredEvent, setHoveredEvent] = useState<{ event: PublicEvent; rect: DOMRect } | null>(null);
  const [popoverDay, setPopoverDay] = useState<{ date: Date; rect: DOMRect } | null>(null);
  const [selectedDayKey, setSelectedDayKey] = useState<string | null>(null);
  const [slideDir, setSlideDir] = useState(1);
  const [weekOffset, setWeekOffset] = useState(0);
  const hoverTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const containerRef = useRef<HTMLDivElement>(null);
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);

  // Fetch events
  const fetchEvents = useCallback(async (year: number, month: number) => {
    setLoading(true);
    try {
      const data = await getPublicEvents({ year, month });
      setEvents(data);
    } catch {
      setEvents([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEvents(currentYear, currentMonth);
  }, [currentYear, currentMonth, fetchEvents]);

  // Filter events by tags
  const filteredEvents = useMemo(() => {
    if (selectedTags.size === 0) return events;
    return events.filter((e) => e.tags?.some((t) => selectedTags.has(t)));
  }, [events, selectedTags]);

  const allTags = useMemo(() => getAllTags(events), [events]);

  // Navigation
  function navigate(direction: 1 | -1) {
    setSlideDir(direction);
    setPopoverDay(null);
    setSelectedDayKey(null);

    if (viewMode === "week") {
      setWeekOffset((o) => o + direction);
      return;
    }

    if (direction === -1) {
      if (currentMonth === 0) { setCurrentMonth(11); setCurrentYear((y) => y - 1); }
      else setCurrentMonth((m) => m - 1);
    } else {
      if (currentMonth === 11) { setCurrentMonth(0); setCurrentYear((y) => y + 1); }
      else setCurrentMonth((m) => m + 1);
    }
  }

  function goToToday() {
    setCurrentYear(today.getFullYear());
    setCurrentMonth(today.getMonth());
    setWeekOffset(0);
    setPopoverDay(null);
    setSelectedDayKey(null);
  }

  // Week view dates
  const weekDates = useMemo(() => {
    const base = new Date(today);
    base.setDate(base.getDate() + weekOffset * 7);
    return getWeekDates(base);
  }, [weekOffset, today]);

  // Month grid
  const daysInMonth = getDaysInMonth(currentYear, currentMonth);
  const firstDay = getFirstDayOfWeek(currentYear, currentMonth);
  const prevMonthDays = getDaysInMonth(currentYear, currentMonth - 1);

  const calendarDays = useMemo(() => {
    const days: { day: number; month: number; year: number; isCurrentMonth: boolean }[] = [];
    for (let i = firstDay - 1; i >= 0; i--) {
      const d = prevMonthDays - i;
      const m = currentMonth === 0 ? 11 : currentMonth - 1;
      const y = currentMonth === 0 ? currentYear - 1 : currentYear;
      days.push({ day: d, month: m, year: y, isCurrentMonth: false });
    }
    for (let d = 1; d <= daysInMonth; d++) {
      days.push({ day: d, month: currentMonth, year: currentYear, isCurrentMonth: true });
    }
    const remaining = 42 - days.length;
    for (let d = 1; d <= remaining; d++) {
      const m = currentMonth === 11 ? 0 : currentMonth + 1;
      const y = currentMonth === 11 ? currentYear + 1 : currentYear;
      days.push({ day: d, month: m, year: y, isCurrentMonth: false });
    }
    return days;
  }, [currentYear, currentMonth, firstDay, prevMonthDays, daysInMonth]);

  const isCurrentMonthView = currentYear === today.getFullYear() && currentMonth === today.getMonth();

  // Selected event navigation (prev/next arrows in modal)
  const sortedEvents = useMemo(() =>
    [...filteredEvents].sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime()),
    [filteredEvents]
  );

  const selectedIdx = selectedEvent ? sortedEvents.findIndex((e) => e.id === selectedEvent.id) : -1;

  // Hover delay
  function handleEventHover(event: PublicEvent, rect: DOMRect) {
    if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
    hoverTimerRef.current = setTimeout(() => setHoveredEvent({ event, rect }), 400);
  }
  function handleEventLeave() {
    if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
    setHoveredEvent(null);
  }

  // Touch swipe
  function handleTouchStart(e: React.TouchEvent) {
    touchStartRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  }
  function handleTouchEnd(e: React.TouchEvent) {
    if (!touchStartRef.current) return;
    const dx = e.changedTouches[0].clientX - touchStartRef.current.x;
    const dy = e.changedTouches[0].clientY - touchStartRef.current.y;
    if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.5) {
      navigate(dx < 0 ? 1 : -1);
    }
    touchStartRef.current = null;
  }

  // Keyboard navigation
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (selectedEvent || popoverDay || showMonthPicker) return;
      if (e.key === "ArrowLeft") { e.preventDefault(); navigate(-1); }
      if (e.key === "ArrowRight") { e.preventDefault(); navigate(1); }
      if (e.key === "t" || e.key === "T") goToToday();
      if (e.key === "m" || e.key === "M") setViewMode("month");
      if (e.key === "w" || e.key === "W") setViewMode("week");
      if (e.key === "a" || e.key === "A") setViewMode("agenda");
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedEvent, popoverDay, showMonthPicker, currentYear, currentMonth, viewMode, weekOffset]);

  // View mode header label
  const headerLabel = viewMode === "week"
    ? `${formatShortDate(weekDates[0].toISOString())} – ${formatShortDate(weekDates[6].toISOString())}`
    : `${MONTH_NAMES[currentMonth]} ${currentYear}`;

  return (
    <section className="py-16 px-6">
      <AnimationStyles />
      <div className="mx-auto max-w-5xl" ref={containerRef}>
        {heading && (
          <h2 className="mb-2 text-center text-3xl font-bold text-[var(--foreground)]" data-editable-text="heading">
            {heading}
          </h2>
        )}
        {subheading && (
          <p className="mb-8 text-center text-lg text-[var(--muted-foreground)]" data-editable-text="subheading">
            {subheading}
          </p>
        )}

        {/* Toolbar */}
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          {/* Left: nav + month picker */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => navigate(-1)}
              className="rounded-[var(--radius)] border border-[var(--border)] p-2 text-[var(--foreground)] transition-all hover:bg-[var(--accent)] hover:shadow-sm active:scale-95"
              title="Previous (Arrow Left)"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={() => navigate(1)}
              className="rounded-[var(--radius)] border border-[var(--border)] p-2 text-[var(--foreground)] transition-all hover:bg-[var(--accent)] hover:shadow-sm active:scale-95"
              title="Next (Arrow Right)"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
            <button
              onClick={goToToday}
              className="ml-1 rounded-[var(--radius)] border border-[var(--border)] px-3 py-1.5 text-xs font-medium text-[var(--foreground)] transition-all hover:bg-[var(--accent)] hover:shadow-sm active:scale-95"
              title="Today (T)"
            >
              Today
            </button>
          </div>

          {/* Center: month/week label — clickable for month picker */}
          <div className="relative">
            <button
              onClick={() => viewMode !== "week" && setShowMonthPicker(!showMonthPicker)}
              className={`text-lg font-bold text-[var(--foreground)] sm:text-xl ${
                viewMode !== "week" ? "cursor-pointer hover:text-[var(--primary)] transition-colors" : ""
              }`}
              title={viewMode !== "week" ? "Jump to month" : undefined}
            >
              {headerLabel}
              {viewMode !== "week" && <ChevronDown className="ml-1 inline h-4 w-4 text-[var(--muted-foreground)]" />}
            </button>
            {showMonthPicker && (
              <MiniMonthPicker
                currentYear={currentYear}
                currentMonth={currentMonth}
                onSelect={(y, m) => { setCurrentYear(y); setCurrentMonth(m); }}
                onClose={() => setShowMonthPicker(false)}
              />
            )}
          </div>

          {/* Right: view toggle + stats */}
          <div className="flex items-center gap-2">
            {loading && (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-[var(--primary)] border-t-transparent" />
            )}
            <span className="hidden text-xs text-[var(--muted-foreground)] sm:inline">
              {filteredEvents.length} event{filteredEvents.length !== 1 ? "s" : ""}
            </span>
            <div className="flex rounded-[var(--radius)] border border-[var(--border)] overflow-hidden">
              {([
                { mode: "month" as ViewMode, icon: Grid3X3, label: "Month (M)" },
                { mode: "week" as ViewMode, icon: LayoutList, label: "Week (W)" },
                { mode: "agenda" as ViewMode, icon: List, label: "Agenda (A)" },
              ]).map(({ mode, icon: Icon, label }) => (
                <button
                  key={mode}
                  onClick={() => setViewMode(mode)}
                  title={label}
                  className={`px-2.5 py-1.5 transition-all ${
                    viewMode === mode
                      ? "bg-[var(--primary)] text-[var(--primary-foreground)]"
                      : "text-[var(--muted-foreground)] hover:bg-[var(--accent)] hover:text-[var(--foreground)]"
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Tag filters */}
        <TagFilterBar
          allTags={allTags}
          selectedTags={selectedTags}
          onToggle={(tag) => {
            setSelectedTags((prev) => {
              const next = new Set(prev);
              if (next.has(tag)) next.delete(tag); else next.add(tag);
              return next;
            });
          }}
          onClear={() => setSelectedTags(new Set())}
        />

        {/* Calendar content — swipeable */}
        <div
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          style={{ ["--slide-dir" as string]: slideDir > 0 ? "20px" : "-20px" }}
        >
          {/* Month View */}
          {viewMode === "month" && (
            <div key={`${currentYear}-${currentMonth}`} className="animate-[slideMonth_200ms_ease-out]">
              <div className="overflow-hidden rounded-[var(--radius)] border border-[var(--border)] shadow-sm">
                <div className="grid grid-cols-7 border-b border-[var(--border)] bg-[var(--muted)]">
                  {DAY_NAMES.map((name) => (
                    <div
                      key={name}
                      className="border-r border-[var(--border)] px-1 py-2 text-center text-[10px] font-semibold uppercase tracking-wider text-[var(--muted-foreground)] last:border-r-0 sm:text-xs"
                    >
                      {name}
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-7">
                  {calendarDays.map((cell, idx) => {
                    const isToday = cell.day === today.getDate() && cell.month === today.getMonth() && cell.year === today.getFullYear();
                    const dayKey = `${cell.year}-${cell.month}-${cell.day}`;
                    const dayEvents = filteredEvents.filter((e) => eventFallsOnDay(e, cell.year, cell.month, cell.day));

                    return (
                      <DayCell
                        key={idx}
                        day={cell.day}
                        isToday={isToday}
                        isCurrentMonth={cell.isCurrentMonth}
                        isSelected={selectedDayKey === dayKey}
                        events={dayEvents}
                        onEventClick={(e) => { setHoveredEvent(null); setSelectedEvent(e); }}
                        onDayClick={(e) => {
                          const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
                          setSelectedDayKey(dayKey);
                          setPopoverDay({ date: new Date(cell.year, cell.month, cell.day), rect });
                        }}
                        onEventHover={handleEventHover}
                        onEventLeave={handleEventLeave}
                      />
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Week View */}
          {viewMode === "week" && (
            <div key={weekOffset} className="animate-[slideMonth_200ms_ease-out]">
              <WeekView
                weekDates={weekDates}
                events={filteredEvents}
                onEventClick={(e) => { setHoveredEvent(null); setSelectedEvent(e); }}
                onEventHover={handleEventHover}
                onEventLeave={handleEventLeave}
              />
            </div>
          )}

          {/* Agenda View */}
          {viewMode === "agenda" && (
            <div className="animate-[fadeIn_200ms_ease-out]">
              <AgendaView
                events={filteredEvents}
                onEventClick={(e) => setSelectedEvent(e)}
                showPast={showPastEvents}
              />
            </div>
          )}
        </div>

        {/* Empty state */}
        {!loading && filteredEvents.length === 0 && viewMode !== "agenda" && (
          <div className="mt-6 flex flex-col items-center justify-center rounded-[var(--radius)] border border-dashed border-[var(--border)] bg-[var(--muted)] p-12 text-center">
            <Calendar className="mb-3 h-10 w-10 text-[var(--muted-foreground)]/40" />
            <p className="text-sm font-medium text-[var(--foreground)]">
              {selectedTags.size > 0 ? "No events match your filters" : "No events this month"}
            </p>
            <p className="mt-1 text-xs text-[var(--muted-foreground)]">
              {selectedTags.size > 0 ? "Try clearing filters or navigating to another month" : "Navigate to other months to see events"}
            </p>
          </div>
        )}

        {/* Keyboard shortcuts hint */}
        <div className="mt-3 flex flex-wrap justify-center gap-x-4 gap-y-1 text-[10px] text-[var(--muted-foreground)]">
          <span><kbd className="rounded border border-[var(--border)] px-1 py-0.5 font-mono text-[9px]">&#x2190;</kbd> <kbd className="rounded border border-[var(--border)] px-1 py-0.5 font-mono text-[9px]">&#x2192;</kbd> navigate</span>
          <span><kbd className="rounded border border-[var(--border)] px-1 py-0.5 font-mono text-[9px]">T</kbd> today</span>
          <span><kbd className="rounded border border-[var(--border)] px-1 py-0.5 font-mono text-[9px]">M</kbd> <kbd className="rounded border border-[var(--border)] px-1 py-0.5 font-mono text-[9px]">W</kbd> <kbd className="rounded border border-[var(--border)] px-1 py-0.5 font-mono text-[9px]">A</kbd> views</span>
          <span className="sm:hidden">Swipe to navigate</span>
        </div>
      </div>

      {/* Hover tooltip */}
      {hoveredEvent && !selectedEvent && !popoverDay && (
        <EventTooltip event={hoveredEvent.event} anchorRect={hoveredEvent.rect} />
      )}

      {/* Day popover */}
      {popoverDay && (
        <DayPopover
          date={popoverDay.date}
          events={filteredEvents.filter((e) =>
            eventFallsOnDay(e, popoverDay.date.getFullYear(), popoverDay.date.getMonth(), popoverDay.date.getDate())
          )}
          onEventClick={(e) => { setPopoverDay(null); setSelectedEvent(e); }}
          onClose={() => { setPopoverDay(null); setSelectedDayKey(null); }}
          anchorRect={popoverDay.rect}
        />
      )}

      {/* Event detail modal */}
      {selectedEvent && (
        <EventModal
          event={selectedEvent}
          onClose={() => setSelectedEvent(null)}
          hasPrev={selectedIdx > 0}
          hasNext={selectedIdx < sortedEvents.length - 1}
          onPrev={() => selectedIdx > 0 && setSelectedEvent(sortedEvents[selectedIdx - 1])}
          onNext={() => selectedIdx < sortedEvents.length - 1 && setSelectedEvent(sortedEvents[selectedIdx + 1])}
        />
      )}
    </section>
  );
}
