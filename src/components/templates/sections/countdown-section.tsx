"use client";

import { useEffect, useState } from "react";

interface CountdownSectionProps {
  heading?: string;
  subheading?: string;
  targetDate?: string;
  expiredMessage?: string;
  ctaText?: string;
  ctaLink?: string;
}

function calcTimeLeft(target: string) {
  const diff = new Date(target).getTime() - Date.now();
  if (diff <= 0) return null;
  return {
    days: Math.floor(diff / (1000 * 60 * 60 * 24)),
    hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((diff / (1000 * 60)) % 60),
    seconds: Math.floor((diff / 1000) % 60),
  };
}

function CountdownUnit({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex flex-col items-center">
      <span className="text-4xl font-bold tabular-nums text-[var(--foreground)] sm:text-5xl">
        {String(value).padStart(2, "0")}
      </span>
      <span className="mt-1 text-xs uppercase tracking-wider text-[var(--muted-foreground)]">
        {label}
      </span>
    </div>
  );
}

export function CountdownSection({
  heading,
  subheading,
  targetDate,
  expiredMessage = "This event has passed!",
  ctaText,
  ctaLink,
}: CountdownSectionProps) {
  const [timeLeft, setTimeLeft] = useState(targetDate ? calcTimeLeft(targetDate) : null);

  useEffect(() => {
    if (!targetDate) return;
    const interval = setInterval(() => {
      setTimeLeft(calcTimeLeft(targetDate));
    }, 1000);
    return () => clearInterval(interval);
  }, [targetDate]);

  return (
    <section className="py-16 px-6">
      <div className="mx-auto max-w-2xl text-center">
        {heading && (
          <h2 className="mb-2 text-3xl font-bold text-[var(--foreground)]" data-editable-text="heading">
            {heading}
          </h2>
        )}
        {subheading && (
          <p className="mb-8 text-lg text-[var(--muted-foreground)]" data-editable-text="subheading">{subheading}</p>
        )}
        {!targetDate ? (
          <div className="rounded-[var(--radius)] border border-dashed border-[var(--border)] bg-[var(--muted)] p-12">
            <p className="text-sm text-[var(--muted-foreground)]">Set a target date to start the countdown</p>
          </div>
        ) : timeLeft ? (
          <div className="flex items-center justify-center gap-6 sm:gap-10">
            <CountdownUnit value={timeLeft.days} label="Days" />
            <span className="text-3xl font-light text-[var(--muted-foreground)]">:</span>
            <CountdownUnit value={timeLeft.hours} label="Hours" />
            <span className="text-3xl font-light text-[var(--muted-foreground)]">:</span>
            <CountdownUnit value={timeLeft.minutes} label="Minutes" />
            <span className="text-3xl font-light text-[var(--muted-foreground)]">:</span>
            <CountdownUnit value={timeLeft.seconds} label="Seconds" />
          </div>
        ) : (
          <p className="text-lg text-[var(--muted-foreground)]" data-editable-text="expiredMessage">{expiredMessage}</p>
        )}
        {ctaText && ctaLink && (
          <div className="mt-8">
            <a
              href={ctaLink}
              className="inline-flex items-center rounded-[var(--radius)] bg-[var(--primary)] px-6 py-3 text-sm font-medium text-[var(--primary-foreground)] shadow-sm transition-all hover:opacity-90"
              data-editable-link="ctaLink"
              data-link-text-path="ctaText"
              data-editable-text="ctaText"
            >
              {ctaText}
            </a>
          </div>
        )}
      </div>
    </section>
  );
}
