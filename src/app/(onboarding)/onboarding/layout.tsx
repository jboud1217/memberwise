export default function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div
      className="relative min-h-screen bg-slate-950 text-slate-50"
      style={{
        colorScheme: "dark",
        // Force dark-mode CSS variable overrides inline
        "--background": "#09090b",
        "--foreground": "#f8fafc",
        "--muted": "#18181b",
        "--muted-foreground": "#a1a1aa",
        "--border": "#27272a",
        "--input": "#27272a",
        "--ring": "#818cf8",
        "--primary": "#818cf8",
        "--primary-foreground": "#ffffff",
        "--secondary": "#27272a",
        "--secondary-foreground": "#f8fafc",
        "--accent": "#1e1b4b",
        "--accent-foreground": "#c7d2fe",
        "--card": "#111113",
        "--card-foreground": "#f8fafc",
        "--shadow-sm": "0 1px 2px rgba(0,0,0,0.3)",
        "--shadow-md": "0 4px 6px -1px rgba(0,0,0,0.4), 0 2px 4px -2px rgba(0,0,0,0.3)",
        "--shadow-xs": "0 1px 2px rgba(0,0,0,0.2)",
      } as React.CSSProperties}
    >
      {/* Gradient background layers */}
      <div className="pointer-events-none fixed inset-0">
        {/* Glows */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 80% 50% at 50% -10%, rgba(99,102,241,0.3) 0%, transparent 60%), radial-gradient(ellipse 60% 40% at 85% 15%, rgba(139,92,246,0.2) 0%, transparent 50%), radial-gradient(ellipse 50% 35% at 15% 75%, rgba(79,70,229,0.15) 0%, transparent 50%)",
          }}
        />
        {/* Dot grid */}
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              "radial-gradient(circle, rgba(255,255,255,0.7) 1px, transparent 1px)",
            backgroundSize: "24px 24px",
          }}
        />
      </div>
      <div className="relative z-10">{children}</div>
    </div>
  );
}
