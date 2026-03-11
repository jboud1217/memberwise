"use client";

import { createContext, useContext } from "react";
import type { LayoutTemplate } from "./templates";

interface TemplateContextValue {
  template: LayoutTemplate;
  overrides: Record<string, unknown> | null;
}

const TemplateContext = createContext<TemplateContextValue | null>(null);

export function TemplateProvider({
  template,
  overrides,
  children,
}: {
  template: LayoutTemplate;
  overrides: Record<string, unknown> | null;
  children: React.ReactNode;
}) {
  return (
    <TemplateContext.Provider value={{ template, overrides }}>
      {children}
    </TemplateContext.Provider>
  );
}

export function useTemplate() {
  const ctx = useContext(TemplateContext);
  if (!ctx) throw new Error("useTemplate must be used within TemplateProvider");
  return ctx;
}
