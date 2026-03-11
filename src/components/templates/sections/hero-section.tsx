import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface HeroSectionProps {
  heading: string;
  subheading?: string;
  ctaText?: string;
  ctaLink?: string;
  backgroundImage?: string;
  size?: "small" | "large";
}

export function HeroSection({
  heading,
  subheading,
  ctaText,
  ctaLink,
  backgroundImage,
  size,
}: HeroSectionProps) {
  const isSmall = size === "small";
  const isLarge = size === "large";

  return (
    <section
      className={`relative flex items-center justify-center text-center ${
        isSmall ? "py-16" : isLarge ? "min-h-[80vh] py-24" : "min-h-[60vh] py-20"
      }`}
      style={
        backgroundImage
          ? {
              backgroundImage: `linear-gradient(to bottom, rgba(0,0,0,0.5), rgba(0,0,0,0.6)), url(${backgroundImage})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
            }
          : undefined
      }
    >
      <div className="relative z-10 mx-auto max-w-3xl px-6">
        <h1
          className={`font-bold tracking-tight ${
            isSmall ? "text-3xl" : "text-4xl sm:text-5xl lg:text-6xl"
          }`}
          style={backgroundImage ? { color: "#ffffff" } : { color: "var(--foreground)" }}
        >
          {heading}
        </h1>
        {subheading && (
          <p
            className={`mt-4 ${isSmall ? "text-base" : "text-lg sm:text-xl"}`}
            style={
              backgroundImage
                ? { color: "rgba(255,255,255,0.9)" }
                : { color: "var(--muted-foreground)" }
            }
          >
            {subheading}
          </p>
        )}
        {ctaText && ctaLink && (
          <div className="mt-8">
            <a href={ctaLink}>
              <Button size="lg">
                {ctaText}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </a>
          </div>
        )}
      </div>
    </section>
  );
}
