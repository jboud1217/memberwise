interface SpacerSectionProps {
  height?: string;
}

export function SpacerSection({ height = "4rem" }: SpacerSectionProps) {
  return (
    <div
      style={{ height, minHeight: "1rem" }}
      aria-hidden="true"
      data-editable-spacer="height"
      className="relative"
    >
      {/* Visual indicator for visual mode */}
      <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity" style={{ pointerEvents: "none" }}>
        <span className="rounded bg-[var(--muted)] px-2 py-0.5 text-[10px] text-[var(--muted-foreground)] font-medium">
          {height}
        </span>
      </div>
    </div>
  );
}
