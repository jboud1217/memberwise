interface TimelineEvent {
  date: string;
  title: string;
  description?: string;
}

interface TimelineSectionProps {
  heading?: string;
  events?: TimelineEvent[];
}

export function TimelineSection({
  heading,
  events = [],
}: TimelineSectionProps) {
  return (
    <section className="py-16 px-6">
      <div className="mx-auto max-w-3xl">
        {heading && (
          <h2 className="mb-12 text-center text-3xl font-bold text-[var(--foreground)]" data-editable-text="heading">
            {heading}
          </h2>
        )}
        <div className="relative">
          {/* Vertical line */}
          <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-[var(--border)] sm:left-1/2 sm:-translate-x-px" />

          <div className="space-y-8">
            {events.map((event, i) => {
              const isLeft = i % 2 === 0;
              return (
                <div
                  key={i}
                  className={`relative flex items-start gap-6 sm:gap-0 ${
                    isLeft ? "sm:flex-row" : "sm:flex-row-reverse"
                  }`}
                  data-array-item="events"
                  data-item-index={i}
                >
                  {/* Dot */}
                  <div className="absolute left-4 mt-1.5 h-3 w-3 -translate-x-1/2 rounded-full border-2 border-[var(--primary)] bg-[var(--background)] sm:left-1/2" />

                  {/* Content */}
                  <div className={`ml-10 sm:ml-0 sm:w-1/2 ${isLeft ? "sm:pr-10 sm:text-right" : "sm:pl-10"}`}>
                    <span className="inline-block rounded-full bg-[var(--primary)]/10 px-3 py-0.5 text-xs font-medium text-[var(--primary)]" data-editable-text={`events.${i}.date`}>
                      {event.date}
                    </span>
                    <h3 className="mt-2 text-lg font-semibold text-[var(--foreground)]" data-editable-text={`events.${i}.title`}>
                      {event.title}
                    </h3>
                    {event.description && (
                      <p className="mt-1 text-sm text-[var(--muted-foreground)]" data-editable-text={`events.${i}.description`}>
                        {event.description}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
