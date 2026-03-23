"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Mail } from "lucide-react";

interface NewsletterSignupSectionProps {
  heading?: string;
  subheading?: string;
  buttonText?: string;
  embedCode?: string;
  successMessage?: string;
}

export function NewsletterSignupSection({
  heading = "Stay Updated",
  subheading,
  buttonText = "Subscribe",
  embedCode,
  successMessage = "Thanks for subscribing!",
}: NewsletterSignupSectionProps) {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  if (embedCode) {
    return (
      <section className="py-16 px-6">
        <div className="mx-auto max-w-2xl text-center">
          {heading && (
            <h2 className="mb-4 text-3xl font-bold text-[var(--foreground)]" data-editable-text="heading">
              {heading}
            </h2>
          )}
          <div dangerouslySetInnerHTML={{ __html: embedCode }} />
        </div>
      </section>
    );
  }

  return (
    <section className="py-16 px-6">
      <div className="mx-auto max-w-xl text-center">
        <Mail className="mx-auto mb-4 h-8 w-8 text-[var(--primary)]" />
        {heading && (
          <h2 className="mb-2 text-3xl font-bold text-[var(--foreground)]" data-editable-text="heading">
            {heading}
          </h2>
        )}
        {subheading && (
          <p className="mb-6 text-[var(--muted-foreground)]" data-editable-text="subheading">{subheading}</p>
        )}
        {submitted ? (
          <p className="rounded-[var(--radius)] bg-green-50 p-4 text-green-700 dark:bg-green-900/20 dark:text-green-300" data-editable-text="successMessage">
            {successMessage}
          </p>
        ) : (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              setSubmitted(true);
            }}
            className="flex gap-2"
          >
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              required
              className="flex-1 rounded-[var(--radius)] border border-[var(--border)] bg-[var(--background)] px-4 py-2.5 text-sm text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
            />
            <Button type="submit" data-editable-text="buttonText">{buttonText}</Button>
          </form>
        )}
      </div>
    </section>
  );
}
