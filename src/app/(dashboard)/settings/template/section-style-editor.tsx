"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Plus, X, Palette } from "lucide-react";
import type { SectionStyle, AnimationType, BackgroundGradient, GradientStop } from "@/lib/types/site-document";

// ─── Field Helper ────────────────────────────────────

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <Label className="text-xs text-[var(--muted-foreground)]">{label}</Label>
      {children}
    </div>
  );
}

// ─── Color Input ─────────────────────────────────────

function ColorInput({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <div className="flex items-center gap-2">
      <div className="relative">
        <input
          type="color"
          value={value || "#ffffff"}
          onChange={(e) => onChange(e.target.value)}
          className="h-8 w-8 cursor-pointer rounded border border-[var(--border)] bg-transparent p-0.5"
        />
      </div>
      <Input
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder || "#000000"}
        className="flex-1 text-xs font-mono"
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange("")}
          className="rounded p-1 text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
        >
          <X className="h-3 w-3" />
        </button>
      )}
    </div>
  );
}

// ─── Padding Editor ──────────────────────────────────

const PADDING_PRESETS = [
  { label: "None", value: "0" },
  { label: "Small", value: "2rem" },
  { label: "Medium", value: "4rem" },
  { label: "Large", value: "6rem" },
  { label: "XL", value: "8rem" },
];

function PaddingEditor({
  padding,
  onChange,
}: {
  padding?: { top: string; bottom: string };
  onChange: (p: { top: string; bottom: string }) => void;
}) {
  const top = padding?.top || "4rem";
  const bottom = padding?.bottom || "4rem";

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-2 gap-2">
        <Field label="Top">
          <Select value={top} onChange={(e) => onChange({ top: e.target.value, bottom })}>
            {PADDING_PRESETS.map((p) => (
              <option key={p.value} value={p.value}>{p.label}</option>
            ))}
          </Select>
        </Field>
        <Field label="Bottom">
          <Select value={bottom} onChange={(e) => onChange({ top, bottom: e.target.value })}>
            {PADDING_PRESETS.map((p) => (
              <option key={p.value} value={p.value}>{p.label}</option>
            ))}
          </Select>
        </Field>
      </div>
    </div>
  );
}

// ─── Gradient Editor ─────────────────────────────────

function GradientEditor({
  gradient,
  onChange,
  onRemove,
}: {
  gradient?: BackgroundGradient;
  onChange: (g: BackgroundGradient) => void;
  onRemove: () => void;
}) {
  const g = gradient || { type: "linear" as const, angle: 180, stops: [{ color: "#6366f1", position: 0 }, { color: "#8b5cf6", position: 100 }] };

  function updateStop(index: number, updates: Partial<GradientStop>) {
    const stops = [...g.stops];
    stops[index] = { ...stops[index], ...updates };
    onChange({ ...g, stops });
  }

  function addStop() {
    onChange({ ...g, stops: [...g.stops, { color: "#000000", position: 50 }] });
  }

  function removeStop(index: number) {
    if (g.stops.length <= 2) return;
    onChange({ ...g, stops: g.stops.filter((_, i) => i !== index) });
  }

  // CSS preview
  const preview = g.type === "linear"
    ? `linear-gradient(${g.angle || 180}deg, ${g.stops.map((s) => `${s.color} ${s.position}%`).join(", ")})`
    : `radial-gradient(circle, ${g.stops.map((s) => `${s.color} ${s.position}%`).join(", ")})`;

  return (
    <div className="space-y-3 rounded-lg border border-[var(--border)] p-3">
      {/* Preview */}
      <div className="h-10 rounded-md border border-[var(--border)]" style={{ background: preview }} />

      <div className="grid grid-cols-2 gap-2">
        <Field label="Type">
          <Select value={g.type} onChange={(e) => onChange({ ...g, type: e.target.value as "linear" | "radial" })}>
            <option value="linear">Linear</option>
            <option value="radial">Radial</option>
          </Select>
        </Field>
        {g.type === "linear" && (
          <Field label="Angle">
            <div className="flex items-center gap-2">
              <input
                type="range"
                min={0}
                max={360}
                value={g.angle || 180}
                onChange={(e) => onChange({ ...g, angle: parseInt(e.target.value) })}
                className="flex-1"
              />
              <span className="text-[10px] font-mono text-[var(--muted-foreground)] w-8 text-right">{g.angle || 180}°</span>
            </div>
          </Field>
        )}
      </div>

      {/* Stops */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-medium text-[var(--muted-foreground)]">Color Stops</span>
          <button type="button" onClick={addStop} className="flex items-center gap-0.5 text-[10px] text-[var(--primary)] hover:underline">
            <Plus className="h-3 w-3" /> Add
          </button>
        </div>
        {g.stops.map((stop, i) => (
          <div key={i} className="flex items-center gap-2">
            <input
              type="color"
              value={stop.color}
              onChange={(e) => updateStop(i, { color: e.target.value })}
              className="h-7 w-7 cursor-pointer rounded border border-[var(--border)] p-0.5"
            />
            <Input
              value={stop.color}
              onChange={(e) => updateStop(i, { color: e.target.value })}
              className="flex-1 text-xs font-mono"
            />
            <div className="flex items-center gap-1">
              <input
                type="range"
                min={0}
                max={100}
                value={stop.position}
                onChange={(e) => updateStop(i, { position: parseInt(e.target.value) })}
                className="w-16"
              />
              <span className="text-[10px] font-mono text-[var(--muted-foreground)] w-7 text-right">{stop.position}%</span>
            </div>
            {g.stops.length > 2 && (
              <button type="button" onClick={() => removeStop(i)} className="rounded p-0.5 text-[var(--muted-foreground)] hover:text-red-500">
                <X className="h-3 w-3" />
              </button>
            )}
          </div>
        ))}
      </div>

      <button type="button" onClick={onRemove} className="text-[10px] text-red-500 hover:underline">
        Remove gradient
      </button>
    </div>
  );
}

// ─── Main Style Editor ───────────────────────────────

const ANIMATION_OPTIONS: { label: string; value: AnimationType }[] = [
  { label: "None", value: "none" },
  { label: "Fade In", value: "fade-in" },
  { label: "Slide Up", value: "slide-up" },
  { label: "Slide Down", value: "slide-down" },
  { label: "Slide Left", value: "slide-left" },
  { label: "Slide Right", value: "slide-right" },
  { label: "Zoom In", value: "zoom-in" },
  { label: "Blur In", value: "blur-in" },
];

const SHADOW_OPTIONS = [
  { label: "None", value: "none" },
  { label: "Small", value: "sm" },
  { label: "Medium", value: "md" },
  { label: "Large", value: "lg" },
  { label: "XL", value: "xl" },
  { label: "2XL", value: "2xl" },
];

const MAX_WIDTH_OPTIONS = [
  { label: "Small (640px)", value: "sm" },
  { label: "Medium (768px)", value: "md" },
  { label: "Large (1024px)", value: "lg" },
  { label: "XL (1280px)", value: "xl" },
  { label: "Full Width", value: "full" },
];

const ALIGN_OPTIONS = [
  { label: "Top", value: "top" },
  { label: "Center", value: "center" },
  { label: "Bottom", value: "bottom" },
];

interface SectionStyleEditorProps {
  style: SectionStyle;
  onChange: (style: SectionStyle) => void;
}

export function SectionStyleEditor({ style, onChange }: SectionStyleEditorProps) {
  const [showGradient, setShowGradient] = useState(!!style.backgroundGradient);

  function update(patch: Partial<SectionStyle>) {
    onChange({ ...style, ...patch });
  }

  return (
    <div className="space-y-4">
      {/* Colors */}
      <div>
        <h4 className="mb-2 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">
          <Palette className="h-3.5 w-3.5" /> Colors
        </h4>
        <div className="space-y-3">
          <Field label="Background Color">
            <ColorInput
              value={style.backgroundColor || ""}
              onChange={(v) => update({ backgroundColor: v || undefined })}
              placeholder="Transparent"
            />
          </Field>
          <Field label="Text Color">
            <ColorInput
              value={style.textColor || ""}
              onChange={(v) => update({ textColor: v || undefined })}
              placeholder="Inherit from theme"
            />
          </Field>

          {/* Gradient */}
          {showGradient ? (
            <Field label="Background Gradient">
              <GradientEditor
                gradient={style.backgroundGradient}
                onChange={(g) => update({ backgroundGradient: g })}
                onRemove={() => {
                  update({ backgroundGradient: undefined });
                  setShowGradient(false);
                }}
              />
            </Field>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setShowGradient(true);
                update({
                  backgroundGradient: {
                    type: "linear",
                    angle: 180,
                    stops: [
                      { color: "#6366f1", position: 0 },
                      { color: "#8b5cf6", position: 100 },
                    ],
                  },
                });
              }}
              className="w-full text-xs border-dashed"
            >
              <Plus className="h-3 w-3" /> Add Gradient
            </Button>
          )}

          <Field label="Background Image URL">
            <Input
              value={style.backgroundImage || ""}
              onChange={(e) => update({ backgroundImage: e.target.value || undefined })}
              placeholder="https://..."
              className="text-xs"
            />
          </Field>
          {style.backgroundImage && (
            <Field label="Overlay Color">
              <ColorInput
                value={style.backgroundOverlay || ""}
                onChange={(v) => update({ backgroundOverlay: v || undefined })}
                placeholder="e.g. rgba(0,0,0,0.5)"
              />
            </Field>
          )}
        </div>
      </div>

      {/* Spacing */}
      <div>
        <h4 className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">
          Spacing
        </h4>
        <div className="space-y-3">
          <Field label="Padding">
            <PaddingEditor
              padding={style.padding}
              onChange={(p) => update({ padding: p })}
            />
          </Field>
          <div className="grid grid-cols-2 gap-2">
            <Field label="Margin Top">
              <Select
                value={style.marginTop || "0"}
                onChange={(e) => update({ marginTop: e.target.value === "0" ? undefined : e.target.value })}
              >
                {PADDING_PRESETS.map((p) => (
                  <option key={p.value} value={p.value}>{p.label}</option>
                ))}
              </Select>
            </Field>
            <Field label="Margin Bottom">
              <Select
                value={style.marginBottom || "0"}
                onChange={(e) => update({ marginBottom: e.target.value === "0" ? undefined : e.target.value })}
              >
                {PADDING_PRESETS.map((p) => (
                  <option key={p.value} value={p.value}>{p.label}</option>
                ))}
              </Select>
            </Field>
          </div>
        </div>
      </div>

      {/* Layout */}
      <div>
        <h4 className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">
          Layout
        </h4>
        <div className="space-y-3">
          <Field label="Max Width">
            <Select
              value={style.maxWidth || "xl"}
              onChange={(e) => update({ maxWidth: e.target.value as SectionStyle["maxWidth"] })}
            >
              {MAX_WIDTH_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </Select>
          </Field>
          <Field label="Min Height">
            <Input
              value={style.minHeight || ""}
              onChange={(e) => update({ minHeight: e.target.value || undefined })}
              placeholder="auto"
              className="text-xs"
            />
          </Field>
          <Field label="Vertical Alignment">
            <Select
              value={style.verticalAlign || "top"}
              onChange={(e) => update({ verticalAlign: e.target.value as SectionStyle["verticalAlign"] })}
            >
              {ALIGN_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </Select>
          </Field>
        </div>
      </div>

      {/* Effects */}
      <div>
        <h4 className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">
          Effects
        </h4>
        <div className="space-y-3">
          <Field label="Animation">
            <Select
              value={style.animation || "none"}
              onChange={(e) => update({ animation: e.target.value === "none" ? undefined : e.target.value as AnimationType })}
            >
              {ANIMATION_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </Select>
          </Field>
          {style.animation && style.animation !== "none" && (
            <Field label="Animation Delay">
              <Input
                value={style.animationDelay || ""}
                onChange={(e) => update({ animationDelay: e.target.value || undefined })}
                placeholder="0s"
                className="text-xs"
              />
            </Field>
          )}
          <Field label="Box Shadow">
            <Select
              value={style.boxShadow || "none"}
              onChange={(e) => update({ boxShadow: e.target.value === "none" ? undefined : e.target.value as SectionStyle["boxShadow"] })}
            >
              {SHADOW_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </Select>
          </Field>
          <Field label="Border Radius">
            <Input
              value={style.borderRadius || ""}
              onChange={(e) => update({ borderRadius: e.target.value || undefined })}
              placeholder="0"
              className="text-xs"
            />
          </Field>
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 text-xs">
              <input
                type="checkbox"
                checked={style.parallax || false}
                onChange={(e) => update({ parallax: e.target.checked || undefined })}
                className="rounded border-[var(--border)]"
              />
              Parallax scrolling
            </label>
          </div>
        </div>
      </div>

      {/* Borders */}
      <div>
        <h4 className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">
          Borders
        </h4>
        <div className="space-y-3">
          <Field label="Border Top">
            <Input
              value={style.borderTop || ""}
              onChange={(e) => update({ borderTop: e.target.value || undefined })}
              placeholder="e.g. 1px solid #e5e7eb"
              className="text-xs"
            />
          </Field>
          <Field label="Border Bottom">
            <Input
              value={style.borderBottom || ""}
              onChange={(e) => update({ borderBottom: e.target.value || undefined })}
              placeholder="e.g. 1px solid #e5e7eb"
              className="text-xs"
            />
          </Field>
        </div>
      </div>

      {/* Advanced */}
      <div>
        <h4 className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">
          Advanced
        </h4>
        <div className="space-y-3">
          <Field label="Custom CSS Class">
            <Input
              value={style.customClassName || ""}
              onChange={(e) => update({ customClassName: e.target.value || undefined })}
              placeholder="my-custom-class"
              className="text-xs font-mono"
            />
          </Field>
        </div>
      </div>
    </div>
  );
}
