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

const SHADOW_CLASSES: Record<string, string> = {
  sm: "shadow-sm",
  md: "shadow-md",
  lg: "shadow-lg",
  xl: "shadow-xl",
  "2xl": "shadow-2xl",
};

function buildBackgroundImage(style: SectionStyle): string | undefined {
  const layers: string[] = [];

  if (style.backgroundOverlay) {
    layers.push(`linear-gradient(${style.backgroundOverlay}, ${style.backgroundOverlay})`);
  }

  if (style.backgroundGradient) {
    const g = style.backgroundGradient;
    const stops = g.stops.map((s) => `${s.color} ${s.position}%`).join(", ");
    if (g.type === "radial") {
      layers.push(`radial-gradient(circle, ${stops})`);
    } else {
      layers.push(`linear-gradient(${g.angle ?? 180}deg, ${stops})`);
    }
  }

  if (style.backgroundImage) {
    layers.push(`url(${style.backgroundImage})`);
  }

  return layers.length > 0 ? layers.join(", ") : undefined;
}

export function SectionWrapper({ style, children }: SectionWrapperProps) {
  if (!style || Object.keys(style).length === 0) {
    return <>{children}</>;
  }

  const bgImage = buildBackgroundImage(style);

  const cssVars: React.CSSProperties = {
    backgroundColor: style.backgroundColor || undefined,
    color: style.textColor || undefined,
    paddingTop: style.padding?.top || undefined,
    paddingBottom: style.padding?.bottom || undefined,
    borderRadius: style.borderRadius || undefined,
    fontFamily: style.fontFamily || undefined,
    backgroundImage: bgImage,
    backgroundSize: style.backgroundImage || style.backgroundGradient ? "cover" : undefined,
    backgroundPosition: style.backgroundImage ? "center" : undefined,
    backgroundAttachment: style.parallax ? "fixed" : undefined,
    borderTop: style.borderTop || undefined,
    borderBottom: style.borderBottom || undefined,
    marginTop: style.marginTop || undefined,
    marginBottom: style.marginBottom || undefined,
    minHeight: style.minHeight || undefined,
  };

  const verticalAlignClass =
    style.verticalAlign === "center"
      ? "flex items-center"
      : style.verticalAlign === "bottom"
      ? "flex items-end"
      : style.verticalAlign === "top"
      ? "flex items-start"
      : "";

  const maxWidthClass = MAX_WIDTH_CLASSES[style.maxWidth || ""] || "";
  const shadowClass = SHADOW_CLASSES[style.boxShadow || ""] || "";

  const classNames = [
    style.customClassName,
    shadowClass,
    verticalAlignClass,
  ]
    .filter(Boolean)
    .join(" ") || undefined;

  const animationAttr =
    style.animation && style.animation !== "none" ? style.animation : undefined;

  return (
    <section
      style={cssVars}
      className={classNames}
      data-animate={animationAttr}
      data-animate-delay={style.animationDelay || undefined}
    >
      {maxWidthClass ? (
        <div className={`mx-auto px-4 ${maxWidthClass} w-full`}>{children}</div>
      ) : (
        children
      )}
    </section>
  );
}
