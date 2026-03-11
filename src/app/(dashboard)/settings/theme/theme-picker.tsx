"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { THEMES, isDarkTheme } from "@/lib/themes";
import { updateTheme } from "@/actions/onboarding";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { Check } from "lucide-react";

export function ThemePicker({ currentTheme }: { currentTheme: string }) {
  const router = useRouter();
  const [selectedTheme, setSelectedTheme] = useState(currentTheme);
  const [saving, startSaving] = useTransition();
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleSave() {
    if (!selectedTheme) return;
    setError(null);
    startSaving(async () => {
      try {
        await updateTheme(selectedTheme);
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to save theme.");
      }
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Select a Theme</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {THEMES.map((theme) => {
            const dark = isDarkTheme(theme.id);
            return (
              <button
                key={theme.id}
                type="button"
                onClick={() => {
                  setSelectedTheme(theme.id);
                  setSaved(false);
                  setError(null);
                }}
                className={`overflow-hidden rounded-lg border-2 text-left transition-all ${
                  selectedTheme === theme.id
                    ? "border-[var(--primary)] ring-2 ring-[var(--primary)] ring-offset-2"
                    : "border-[var(--border)] hover:border-[var(--muted-foreground)]"
                }`}
              >
                {/* Mini preview */}
                <div
                  style={{
                    backgroundColor: theme.variables["--background"],
                    color: theme.variables["--foreground"],
                    ...(dark ? { colorScheme: "dark" as const } : {}),
                  }}
                  className="p-2"
                >
                  <div
                    style={{ backgroundColor: theme.variables["--primary"] }}
                    className="mb-2 h-5 rounded-sm flex items-center px-1.5"
                  >
                    <div className="flex gap-0.5">
                      <div className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: theme.variables["--primary-foreground"], opacity: 0.7 }} />
                      <div className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: theme.variables["--primary-foreground"], opacity: 0.7 }} />
                      <div className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: theme.variables["--primary-foreground"], opacity: 0.7 }} />
                    </div>
                  </div>
                  <div
                    style={{
                      backgroundColor: theme.variables["--card"],
                      borderColor: theme.variables["--border"],
                      borderRadius: theme.variables["--radius"],
                    }}
                    className="mb-2 border p-1.5"
                  >
                    <div
                      className="mb-1 h-1.5 w-3/4 rounded-full"
                      style={{ backgroundColor: theme.variables["--foreground"], opacity: 0.6 }}
                    />
                    <div
                      className="h-1 w-1/2 rounded-full"
                      style={{ backgroundColor: theme.variables["--muted-foreground"], opacity: 0.4 }}
                    />
                  </div>
                  <div
                    style={{
                      backgroundColor: theme.variables["--primary"],
                      borderRadius: theme.variables["--radius"],
                    }}
                    className="h-4 w-full"
                  />
                </div>
                <div className="bg-[var(--background)] p-2">
                  <p className="text-xs font-medium">{theme.name}</p>
                  <p className="text-[10px] text-[var(--muted-foreground)] leading-tight">
                    {theme.description}
                  </p>
                </div>
              </button>
            );
          })}
        </div>

        {error && (
          <div className="mt-4 rounded-md bg-red-50 p-3 text-sm text-red-600">{error}</div>
        )}

        <div className="mt-6 flex items-center gap-3">
          <Button onClick={handleSave} disabled={!selectedTheme || saving || selectedTheme === currentTheme}>
            {saving ? (
              <Spinner className="mr-2 h-4 w-4" />
            ) : saved ? (
              <Check className="mr-2 h-4 w-4" />
            ) : null}
            {saved ? "Saved!" : "Save Theme"}
          </Button>
          {saved && (
            <span className="text-sm text-green-600">Theme updated successfully</span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
