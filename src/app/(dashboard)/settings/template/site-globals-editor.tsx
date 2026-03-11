"use client";

import { useState } from "react";
import { saveSiteGlobals } from "@/actions/template";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import type { SiteHeader, SiteFooter, SiteFonts, NavLink, SocialLink, FooterColumn } from "@/lib/types/site-document";
import { AVAILABLE_FONTS } from "@/lib/types/site-document";
import { Textarea } from "@/components/ui/textarea";
import {
  Save,
  Plus,
  Trash2,
  CheckCircle,
  Link2,
  Menu,
  PanelBottom,
  X,
  Type,
  Palette,
  Code,
} from "lucide-react";

interface SiteGlobalsEditorProps {
  header: SiteHeader;
  footer: SiteFooter;
  siteName: string;
  fonts?: SiteFonts;
  themeVariables?: Record<string, string>;
  customCss?: string;
}

const DEFAULT_THEME_VARS: { key: string; label: string; type: "color" | "text" }[] = [
  { key: "--primary", label: "Primary Color", type: "color" },
  { key: "--primary-foreground", label: "Primary Text", type: "color" },
  { key: "--background", label: "Background", type: "color" },
  { key: "--foreground", label: "Text Color", type: "color" },
  { key: "--muted", label: "Muted Background", type: "color" },
  { key: "--muted-foreground", label: "Muted Text", type: "color" },
  { key: "--accent", label: "Accent", type: "color" },
  { key: "--border", label: "Borders", type: "color" },
  { key: "--card", label: "Card Background", type: "color" },
  { key: "--card-foreground", label: "Card Text", type: "color" },
];

export function SiteGlobalsEditor({
  header: initialHeader,
  footer: initialFooter,
  siteName,
  fonts: initialFonts,
  themeVariables: initialThemeVars,
  customCss: initialCustomCss,
}: SiteGlobalsEditorProps) {
  const [header, setHeader] = useState<SiteHeader>(initialHeader);
  const [footer, setFooter] = useState<SiteFooter>(initialFooter);
  const [fonts, setFonts] = useState<SiteFonts>(initialFonts || { heading: "Inter", body: "Inter" });
  const [themeVars, setThemeVars] = useState<Record<string, string>>(initialThemeVars || {});
  const [customCss, setCustomCss] = useState(initialCustomCss || "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function handleSave() {
    setSaving(true);
    await saveSiteGlobals({
      header,
      footer,
      fonts,
      customCss: customCss || undefined,
      theme: { baseThemeId: "custom", variables: themeVars },
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  // ─── Header nav links ──────────────────

  function addNavLink() {
    setHeader((h) => ({
      ...h,
      navLinks: [...h.navLinks, { label: "New Link", href: "/" }],
    }));
    setSaved(false);
  }

  function updateNavLink(index: number, updates: Partial<NavLink>) {
    setHeader((h) => ({
      ...h,
      navLinks: h.navLinks.map((link, i) => (i === index ? { ...link, ...updates } : link)),
    }));
    setSaved(false);
  }

  function removeNavLink(index: number) {
    setHeader((h) => ({
      ...h,
      navLinks: h.navLinks.filter((_, i) => i !== index),
    }));
    setSaved(false);
  }

  // ─── Footer social links ──────────────

  function addSocialLink() {
    setFooter((f) => ({
      ...f,
      socialLinks: [...(f.socialLinks || []), { platform: "Website", url: "" }],
    }));
    setSaved(false);
  }

  function updateSocialLink(index: number, updates: Partial<SocialLink>) {
    setFooter((f) => ({
      ...f,
      socialLinks: (f.socialLinks || []).map((link, i) => (i === index ? { ...link, ...updates } : link)),
    }));
    setSaved(false);
  }

  function removeSocialLink(index: number) {
    setFooter((f) => ({
      ...f,
      socialLinks: (f.socialLinks || []).filter((_, i) => i !== index),
    }));
    setSaved(false);
  }

  return (
    <div className="space-y-6">
      {/* Header Settings */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Menu className="h-5 w-5 text-[var(--primary)]" />
            <div>
              <CardTitle className="text-lg">Header / Navigation</CardTitle>
              <CardDescription>Configure your site header, logo display, and navigation links</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-xs">Header Layout</Label>
              <Select
                value={header.layout}
                onChange={(e) => { setHeader((h) => ({ ...h, layout: e.target.value as SiteHeader["layout"] })); setSaved(false); }}
                className="mt-1 text-sm"
              >
                <option value="left-aligned">Logo Left, Nav Right</option>
                <option value="centered">Centered</option>
                <option value="logo-center">Logo Center, Nav Below</option>
              </Select>
            </div>
            <div className="flex items-end gap-3">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="show-logo"
                  checked={header.showLogo}
                  onChange={(e) => { setHeader((h) => ({ ...h, showLogo: e.target.checked })); setSaved(false); }}
                  className="h-4 w-4 rounded border-[var(--input)]"
                />
                <Label htmlFor="show-logo" className="text-sm font-normal">Show Logo</Label>
              </div>
            </div>
          </div>

          {/* Nav Links */}
          <div>
            <Label className="text-xs">Navigation Links</Label>
            <div className="mt-2 space-y-2">
              {header.navLinks.map((link, i) => (
                <div key={i} className="flex items-center gap-2">
                  <Input
                    value={link.label}
                    onChange={(e) => updateNavLink(i, { label: e.target.value })}
                    placeholder="Label"
                    className="w-36 text-xs"
                  />
                  <Input
                    value={link.href}
                    onChange={(e) => updateNavLink(i, { href: e.target.value })}
                    placeholder="/about"
                    className="flex-1 text-xs"
                  />
                  <div className="flex items-center gap-1">
                    <input
                      type="checkbox"
                      checked={link.external || false}
                      onChange={(e) => updateNavLink(i, { external: e.target.checked })}
                      title="Open in new tab"
                      className="h-3 w-3"
                    />
                    <span className="text-[10px] text-[var(--muted-foreground)]">ext</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeNavLink(i)}
                    className="rounded p-1 text-[var(--muted-foreground)] hover:text-red-500"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
              <Button variant="outline" size="sm" onClick={addNavLink}>
                <Plus className="h-3.5 w-3.5" /> Add Link
              </Button>
            </div>
          </div>

          {/* CTA Button */}
          <div>
            <Label className="text-xs">Header CTA Button (optional)</Label>
            <div className="mt-2 grid grid-cols-2 gap-2">
              <Input
                value={header.ctaButton?.label || ""}
                onChange={(e) => {
                  setHeader((h) => ({
                    ...h,
                    ctaButton: e.target.value ? { label: e.target.value, href: h.ctaButton?.href || "/portal" } : undefined,
                  }));
                  setSaved(false);
                }}
                placeholder="Button text (leave empty to hide)"
                className="text-xs"
              />
              <Input
                value={header.ctaButton?.href || ""}
                onChange={(e) => {
                  setHeader((h) => ({
                    ...h,
                    ctaButton: h.ctaButton ? { ...h.ctaButton, href: e.target.value } : undefined,
                  }));
                  setSaved(false);
                }}
                placeholder="/portal"
                className="text-xs"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Footer Settings */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <PanelBottom className="h-5 w-5 text-[var(--primary)]" />
            <div>
              <CardTitle className="text-lg">Footer</CardTitle>
              <CardDescription>Configure your site footer, copyright text, and social links</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-xs">Footer Layout</Label>
              <Select
                value={footer.layout}
                onChange={(e) => { setFooter((f) => ({ ...f, layout: e.target.value as SiteFooter["layout"] })); setSaved(false); }}
                className="mt-1 text-sm"
              >
                <option value="simple">Simple (centered)</option>
                <option value="columns">Multi-column</option>
                <option value="minimal">Minimal</option>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Copyright Text</Label>
              <Input
                value={footer.copyright || ""}
                onChange={(e) => { setFooter((f) => ({ ...f, copyright: e.target.value })); setSaved(false); }}
                placeholder={`© ${new Date().getFullYear()} ${siteName}`}
                className="mt-1 text-xs"
              />
            </div>
          </div>

          {/* Social Links */}
          <div>
            <Label className="text-xs">Social Links</Label>
            <div className="mt-2 space-y-2">
              {(footer.socialLinks || []).map((link, i) => (
                <div key={i} className="flex items-center gap-2">
                  <Select
                    value={link.platform}
                    onChange={(e) => updateSocialLink(i, { platform: e.target.value })}
                    className="w-32 text-xs"
                  >
                    <option value="Facebook">Facebook</option>
                    <option value="Twitter">Twitter / X</option>
                    <option value="Instagram">Instagram</option>
                    <option value="LinkedIn">LinkedIn</option>
                    <option value="YouTube">YouTube</option>
                    <option value="TikTok">TikTok</option>
                    <option value="Website">Website</option>
                  </Select>
                  <Input
                    value={link.url}
                    onChange={(e) => updateSocialLink(i, { url: e.target.value })}
                    placeholder="https://..."
                    className="flex-1 text-xs"
                  />
                  <button
                    type="button"
                    onClick={() => removeSocialLink(i)}
                    className="rounded p-1 text-[var(--muted-foreground)] hover:text-red-500"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
              <Button variant="outline" size="sm" onClick={addSocialLink}>
                <Plus className="h-3.5 w-3.5" /> Add Social Link
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Font Settings */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Type className="h-5 w-5 text-[var(--primary)]" />
            <div>
              <CardTitle className="text-lg">Typography</CardTitle>
              <CardDescription>Choose fonts for headings and body text</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-xs">Heading Font</Label>
              <Select
                value={fonts.heading}
                onChange={(e) => { setFonts((f) => ({ ...f, heading: e.target.value })); setSaved(false); }}
                className="mt-1 text-sm"
              >
                {AVAILABLE_FONTS.map((font) => (
                  <option key={font} value={font}>{font}</option>
                ))}
              </Select>
              <p className="mt-2 text-lg" style={{ fontFamily: fonts.heading }}>
                The quick brown fox
              </p>
            </div>
            <div>
              <Label className="text-xs">Body Font</Label>
              <Select
                value={fonts.body}
                onChange={(e) => { setFonts((f) => ({ ...f, body: e.target.value })); setSaved(false); }}
                className="mt-1 text-sm"
              >
                {AVAILABLE_FONTS.map((font) => (
                  <option key={font} value={font}>{font}</option>
                ))}
              </Select>
              <p className="mt-2 text-sm" style={{ fontFamily: fonts.body }}>
                The quick brown fox jumps over the lazy dog.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Theme Color Overrides */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Palette className="h-5 w-5 text-[var(--primary)]" />
            <div>
              <CardTitle className="text-lg">Theme Colors</CardTitle>
              <CardDescription>Override individual color variables for your site theme</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3">
            {DEFAULT_THEME_VARS.map((v) => (
              <div key={v.key}>
                <Label className="text-xs">{v.label}</Label>
                <div className="mt-1 flex items-center gap-2">
                  <input
                    type="color"
                    value={themeVars[v.key] || "#888888"}
                    onChange={(e) => { setThemeVars((prev) => ({ ...prev, [v.key]: e.target.value })); setSaved(false); }}
                    className="h-8 w-8 cursor-pointer rounded border border-[var(--border)]"
                  />
                  <Input
                    value={themeVars[v.key] || ""}
                    onChange={(e) => { setThemeVars((prev) => ({ ...prev, [v.key]: e.target.value })); setSaved(false); }}
                    placeholder={`var(${v.key})`}
                    className="flex-1 text-xs"
                  />
                  {themeVars[v.key] && (
                    <button
                      type="button"
                      onClick={() => {
                        setThemeVars((prev) => {
                          const next = { ...prev };
                          delete next[v.key];
                          return next;
                        });
                        setSaved(false);
                      }}
                      className="rounded p-1 text-[var(--muted-foreground)] hover:text-red-500"
                      title="Reset to theme default"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Custom CSS */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Code className="h-5 w-5 text-[var(--primary)]" />
            <div>
              <CardTitle className="text-lg">Custom CSS</CardTitle>
              <CardDescription>Add custom CSS that gets injected into your site</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Textarea
            value={customCss}
            onChange={(e) => { setCustomCss(e.target.value); setSaved(false); }}
            placeholder={`.my-hero {\n  background: linear-gradient(135deg, #667eea, #764ba2);\n}\n\n.custom-button {\n  border-radius: 999px;\n}`}
            rows={10}
            className="font-mono text-xs"
          />
          <p className="mt-2 text-[10px] text-[var(--muted-foreground)]">
            CSS is injected globally into your public site. Use custom class names from section style settings.
          </p>
        </CardContent>
      </Card>

      {/* Save */}
      <div className="flex items-center gap-3">
        <Button onClick={handleSave} disabled={saving}>
          {saving ? (
            <Spinner className="mr-2 h-4 w-4" />
          ) : saved ? (
            <CheckCircle className="mr-2 h-4 w-4" />
          ) : (
            <Save className="mr-2 h-4 w-4" />
          )}
          {saved ? "Saved!" : "Save Header & Footer"}
        </Button>
        {saved && (
          <span className="text-sm text-green-600">Changes published</span>
        )}
      </div>
    </div>
  );
}
