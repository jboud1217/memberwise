import { Calendar } from "lucide-react";

interface CalendarWidgetSectionProps {
  heading?: string;
  embedCode?: string;
  calendarUrl?: string;
  provider?: "google" | "outlook" | "calendly" | "other";
}

export function CalendarWidgetSection({
  heading,
  embedCode,
  calendarUrl,
  provider = "google",
}: CalendarWidgetSectionProps) {
  return (
    <section className="py-16 px-6">
      <div className="mx-auto max-w-4xl">
        {heading && (
          <h2 className="mb-8 text-center text-3xl font-bold text-[var(--foreground)]" data-editable-text="heading">
            {heading}
          </h2>
        )}
        {embedCode ? (
          <div dangerouslySetInnerHTML={{ __html: embedCode }} />
        ) : calendarUrl ? (
          <div className="h-[600px] w-full overflow-hidden rounded-[var(--radius)] shadow-md">
            <iframe
              src={calendarUrl}
              className="h-full w-full border-0"
              loading="lazy"
              title={heading || "Calendar"}
            />
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center rounded-[var(--radius)] border border-dashed border-[var(--border)] bg-[var(--muted)] p-12 text-center">
            <Calendar className="h-10 w-10 text-[var(--muted-foreground)]/40 mb-3" />
            <p className="text-sm font-medium text-[var(--foreground)]">
              {provider === "google"
                ? "Google Calendar"
                : provider === "calendly"
                ? "Calendly"
                : provider === "outlook"
                ? "Outlook Calendar"
                : "Calendar"}{" "}
              Widget
            </p>
            <p className="mt-1 text-xs text-[var(--muted-foreground)]">
              Paste your calendar embed URL or embed code
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
