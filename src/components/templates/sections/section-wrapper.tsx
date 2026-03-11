import type { SectionStyle } from "@/lib/types/site-document";

interface SectionWrapperProps {
  style?: SectionStyle;
  children: React.ReactNode;
}

const MAX_WIDTH_CLASSES: Record<string, string> = {
  sm: "max-w-3xl",
  md: "max-w-5xl",
  lg: "max-w-7xl",
  xl: "max-w-[90rem]",
  full: "max-w-none",
};

export function SectionWrapper({ style, children }: SectionWrapperProps) {
  if (!style || Object.keys(style).length === 0) {
    return <>{children}</>;
  }

  const cssVars: React.CSSProperties = {
    backgroundColor: style.backgroundColor || undefined,
    color: style.textColor || undefined,
    paddingTop: style.padding?.top || undefined,
    paddingBottom: style.padding?.bottom || undefined,
    borderRadius: style.borderRadius || undefined,
    fontFamily: style.fontFamily || undefined,
    backgroundImage: style.backgroundImage
      ? `${style.backgroundOverlay ? `linear-gradient(${style.backgroundOverlay}, ${style.backgroundOverlay}), ` : ""}url(${style.backgroundImage})`
      : undefined,
    backgroundSize: style.backgroundImage ? "cover" : undefined,
    backgroundPosition: style.backgroundImage ? "center" : undefined,
  };

  const maxWidthClass = MAX_WIDTH_CLASSES[style.maxWidth || ""] || "";

  return (
    <section style={cssVars} className={style.customClassName || undefined}>
      {maxWidthClass ? (
        <div className={`mx-auto px-4 ${maxWidthClass}`}>{children}</div>
      ) : (
        children
      )}
    </section>
  );
}
