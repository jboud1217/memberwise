"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Send } from "lucide-react";

interface ContactFormSectionProps {
  fields?: string[];
}

export function ContactFormSection({ fields = ["name", "email", "message"] }: ContactFormSectionProps) {
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitted(true);
  }

  if (submitted) {
    return (
      <section className="py-16 px-6">
        <div className="mx-auto max-w-lg rounded-[var(--radius)] border border-[var(--border)] bg-[var(--card)] p-8 text-center">
          <p className="text-lg font-medium text-[var(--card-foreground)]">
            Thank you for your message!
          </p>
          <p className="mt-2 text-sm text-[var(--muted-foreground)]">
            We&apos;ll get back to you as soon as possible.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="py-16 px-6">
      <div className="mx-auto max-w-lg">
        <form
          onSubmit={handleSubmit}
          className="space-y-4 rounded-[var(--radius)] border border-[var(--border)] bg-[var(--card)] p-6"
        >
          {fields.includes("name") && (
            <div>
              <Label htmlFor="name">Name</Label>
              <Input id="name" placeholder="Your name" required />
            </div>
          )}
          {fields.includes("email") && (
            <div>
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder="you@example.com" required />
            </div>
          )}
          {fields.includes("company") && (
            <div>
              <Label htmlFor="company">Company / Organization</Label>
              <Input id="company" placeholder="Your company" />
            </div>
          )}
          {fields.includes("subject") && (
            <div>
              <Label htmlFor="subject">Subject</Label>
              <Input id="subject" placeholder="Subject" required />
            </div>
          )}
          {fields.includes("message") && (
            <div>
              <Label htmlFor="message">Message</Label>
              <Textarea id="message" placeholder="Your message..." rows={5} required />
            </div>
          )}
          <Button type="submit" className="w-full">
            <Send className="mr-2 h-4 w-4" />
            Send Message
          </Button>
        </form>
      </div>
    </section>
  );
}
