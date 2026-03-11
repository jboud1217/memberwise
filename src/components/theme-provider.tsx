import { getThemeById, isDarkTheme } from "@/lib/themes";

interface ThemeProviderProps {
  themeId: string;
  children: React.ReactNode;
}

export function ThemeProvider({ themeId, children }: ThemeProviderProps) {
  const theme = getThemeById(themeId);
  const dark = isDarkTheme(themeId);

  return (
    <div
      style={{
        ...theme.variables,
        ...(dark ? { colorScheme: "dark" } : {}),
      } as React.CSSProperties}
    >
      {children}
    </div>
  );
}
