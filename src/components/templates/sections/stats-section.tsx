interface StatItem {
  value: string;
  label: string;
}

interface StatsSectionProps {
  heading?: string;
  items: StatItem[];
}

export function StatsSection({ heading, items }: StatsSectionProps) {
  return (
    <section className="py-16 px-6">
      <div className="mx-auto max-w-5xl">
        {heading && (
          <h2 className="mb-12 text-center text-3xl font-bold text-[var(--foreground)]" data-editable-text="heading">
            {heading}
          </h2>
        )}
        <div className="grid grid-cols-2 gap-8 lg:grid-cols-4">
          {items.map((item, i) => (
            <div key={item.label} className="text-center" data-array-item="items" data-item-index={i}>
              <p className="text-3xl font-bold text-[var(--primary)] sm:text-4xl" data-editable-text={`items.${i}.value`}>
                {item.value}
              </p>
              <p className="mt-1 text-sm text-[var(--muted-foreground)]" data-editable-text={`items.${i}.label`}>{item.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
