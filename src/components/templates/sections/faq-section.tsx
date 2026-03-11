"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";

interface FaqItem {
  question: string;
  answer: string;
}

interface FaqSectionProps {
  heading?: string;
  items: FaqItem[];
}

export function FaqSection({ heading, items }: FaqSectionProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <section className="py-16 px-6">
      <div className="mx-auto max-w-3xl">
        {heading && (
          <h2 className="mb-8 text-center text-3xl font-bold text-[var(--foreground)]">
            {heading}
          </h2>
        )}
        <div className="space-y-3">
          {items.map((item, i) => (
            <div
              key={i}
              className="rounded-[var(--radius)] border border-[var(--border)] bg-[var(--card)]"
            >
              <button
                type="button"
                onClick={() => setOpenIndex(openIndex === i ? null : i)}
                className="flex w-full items-center justify-between p-4 text-left"
              >
                <span className="text-sm font-medium text-[var(--card-foreground)]">
                  {item.question}
                </span>
                <ChevronDown
                  className={`h-4 w-4 shrink-0 text-[var(--muted-foreground)] transition-transform ${
                    openIndex === i ? "rotate-180" : ""
                  }`}
                />
              </button>
              {openIndex === i && (
                <div className="border-t border-[var(--border)] px-4 py-3">
                  <p className="text-sm text-[var(--muted-foreground)]">{item.answer}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
