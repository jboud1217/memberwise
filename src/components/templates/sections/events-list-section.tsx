import { Calendar, MapPin } from "lucide-react";

interface EventItem {
  title: string;
  date: string;
  location: string;
  description: string;
}

interface EventsListSectionProps {
  heading?: string;
  subheading?: string;
  showPast?: boolean;
  limit?: number;
  events?: EventItem[];
}

export function EventsListSection({
  heading,
  subheading,
  limit = 10,
  events: propEvents,
}: EventsListSectionProps) {
  // Use provided events or placeholder data
  const events = (propEvents || [
    { title: "Monthly Member Meeting", date: "Upcoming", location: "Main Hall", description: "Our regular monthly gathering for all members." },
    { title: "Annual Gala", date: "Upcoming", location: "Grand Ballroom", description: "Celebrate the year's achievements with fellow members." },
    { title: "Workshop: Getting Started", date: "Upcoming", location: "Conference Room A", description: "An introductory workshop for new members." },
  ]).slice(0, limit);

  return (
    <section className="py-16 px-6">
      <div className="mx-auto max-w-4xl">
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
        <div className="space-y-4">
          {events.map((event, i) => (
            <div
              key={i}
              className="flex gap-4 rounded-[var(--radius)] border border-[var(--border)] bg-[var(--card)] p-5"
              data-array-item="events"
              data-item-index={i}
            >
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[var(--radius)] bg-[var(--primary)]/10">
                <Calendar className="h-5 w-5 text-[var(--primary)]" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-[var(--card-foreground)]" data-editable-text={`events.${i}.title`}>{event.title}</h3>
                <p className="mt-1 text-sm text-[var(--muted-foreground)]" data-editable-text={`events.${i}.description`}>{event.description}</p>
                <div className="mt-2 flex items-center gap-4 text-xs text-[var(--muted-foreground)]">
                  <span className="flex items-center gap-1" data-editable-text={`events.${i}.date`}>
                    <Calendar className="h-3 w-3" />
                    {event.date}
                  </span>
                  <span className="flex items-center gap-1" data-editable-text={`events.${i}.location`}>
                    <MapPin className="h-3 w-3" />
                    {event.location}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
