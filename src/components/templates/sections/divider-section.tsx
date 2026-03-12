interface DividerSectionProps {
  style?: "solid" | "dashed" | "dotted" | "gradient";
  width?: "narrow" | "medium" | "full";
  color?: string;
}

export function DividerSection({
  style = "solid",
  width = "medium",
  color,
}: DividerSectionProps) {
  const widthClass =
    width === "narrow"
      ? "max-w-xs"
      : width === "full"
      ? "max-w-none"
      : "max-w-2xl";

  if (style === "gradient") {
    return (
      <div className="py-6 px-6">
        <div
          className={`mx-auto h-px ${widthClass}`}
          style={{
            background: `linear-gradient(to right, transparent, ${
              color || "var(--border)"
            }, transparent)`,
          }}
        />
      </div>
    );
  }

  return (
    <div className="py-6 px-6">
      <hr
        className={`mx-auto ${widthClass} border-t`}
        style={{
          borderStyle: style,
          borderColor: color || "var(--border)",
        }}
      />
    </div>
  );
}
