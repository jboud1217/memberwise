import * as LucideIcons from "lucide-react";

interface FeatureItem {
  icon: string;
  title: string;
  description: string;
}

interface FeaturesSectionProps {
  heading?: string;
  items: FeatureItem[];
}

export function FeaturesSection({ heading, items }: FeaturesSectionProps) {
  return (
    <section className="py-16 px-6">
      <div className="mx-auto max-w-6xl">
        {heading && (
          <h2 className="mb-12 text-center text-3xl font-bold text-[var(--foreground)]" data-editable-text="heading">
            {heading}
          </h2>
        )}
        <div
          className={`grid gap-8 ${
            items.length === 3 ? "sm:grid-cols-3" : "sm:grid-cols-2 lg:grid-cols-4"
          }`}
        >
          {items.map((item, index) => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const Icon = (LucideIcons as any)[item.icon] || LucideIcons.Star;
            return (
              <div
                key={item.title}
                className="rounded-[var(--radius)] border border-[var(--border)] bg-[var(--card)] p-6 text-center"
                data-array-item="items"
                data-item-index={index}
              >
                <div
                  className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[var(--primary)]/10"
                  data-editable-icon={item.icon}
                  data-item-index={index}
                  data-prop-path={`items.${index}.icon`}
                >
                  <Icon className="h-6 w-6 text-[var(--primary)]" />
                </div>
                <h3
                  className="mb-2 text-lg font-semibold text-[var(--card-foreground)]"
                  data-editable-text={`items.${index}.title`}
                >
                  {item.title}
                </h3>
                <p
                  className="text-sm text-[var(--muted-foreground)]"
                  data-editable-text={`items.${index}.description`}
                >
                  {item.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
