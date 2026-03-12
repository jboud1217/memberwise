import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PricingTier {
  name: string;
  price: string;
  period?: string;
  description?: string;
  features: string[];
  ctaText?: string;
  ctaLink?: string;
  highlighted?: boolean;
}

interface PricingSectionProps {
  heading?: string;
  subheading?: string;
  tiers?: PricingTier[];
}

export function PricingSection({
  heading,
  subheading,
  tiers = [],
}: PricingSectionProps) {
  return (
    <section className="py-16 px-6">
      <div className="mx-auto max-w-6xl">
        {heading && (
          <h2 className="mb-3 text-center text-3xl font-bold text-[var(--foreground)]">
            {heading}
          </h2>
        )}
        {subheading && (
          <p className="mb-10 text-center text-lg text-[var(--muted-foreground)]">
            {subheading}
          </p>
        )}
        <div
          className={`grid gap-6 ${
            tiers.length === 2
              ? "sm:grid-cols-2 max-w-3xl mx-auto"
              : tiers.length >= 4
              ? "sm:grid-cols-2 lg:grid-cols-4"
              : "sm:grid-cols-2 lg:grid-cols-3 max-w-5xl mx-auto"
          }`}
        >
          {tiers.map((tier, i) => (
            <div
              key={i}
              className={`relative flex flex-col rounded-[var(--radius)] border p-6 ${
                tier.highlighted
                  ? "border-[var(--primary)] bg-[var(--primary)]/5 shadow-lg ring-1 ring-[var(--primary)]"
                  : "border-[var(--border)] bg-[var(--card)]"
              }`}
            >
              {tier.highlighted && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-[var(--primary)] px-3 py-0.5 text-xs font-medium text-white">
                  Popular
                </span>
              )}
              <h3 className="text-lg font-semibold text-[var(--card-foreground)]">
                {tier.name}
              </h3>
              <div className="mt-3 flex items-baseline gap-1">
                <span className="text-4xl font-bold text-[var(--foreground)]">
                  {tier.price}
                </span>
                {tier.period && (
                  <span className="text-sm text-[var(--muted-foreground)]">
                    /{tier.period}
                  </span>
                )}
              </div>
              {tier.description && (
                <p className="mt-2 text-sm text-[var(--muted-foreground)]">
                  {tier.description}
                </p>
              )}
              <ul className="mt-6 flex-1 space-y-3">
                {tier.features.map((feature, j) => (
                  <li key={j} className="flex items-start gap-2 text-sm text-[var(--card-foreground)]">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-[var(--primary)]" />
                    {feature}
                  </li>
                ))}
              </ul>
              {tier.ctaText && (
                <div className="mt-6">
                  <a href={tier.ctaLink || "#"} className="block">
                    <Button
                      className="w-full"
                      variant={tier.highlighted ? "default" : "outline"}
                    >
                      {tier.ctaText}
                    </Button>
                  </a>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
