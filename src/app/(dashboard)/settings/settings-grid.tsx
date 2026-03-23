"use client";

import { useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Users,
  CreditCard,
  Building2,
  Globe,
  Palette,
  Layout,
  ListFilter,
  ArrowLeftRight,
  Mail,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import { SettingsSearch } from "./settings-search";
import { cn } from "@/lib/utils";

interface SettingsCardData {
  title: string;
  description: string;
  icon: typeof Building2;
  href?: string;
  status?: "connected" | "configured" | "not_configured" | "action_needed";
  statusLabel?: string;
  keywords: string[];
  highlight?: boolean;
  actionLabel?: string;
}

const STATUS_STYLES = {
  connected: { badge: "success" as const, icon: CheckCircle2, color: "text-emerald-600" },
  configured: { badge: "success" as const, icon: CheckCircle2, color: "text-emerald-600" },
  not_configured: { badge: "secondary" as const, icon: AlertCircle, color: "text-[var(--muted-foreground)]" },
  action_needed: { badge: "warning" as const, icon: AlertCircle, color: "text-amber-600" },
};

export function SettingsGrid({
  orgName,
  stripeConnected,
  domainVerified,
  customDomain,
  emailProvider,
  customFieldCount,
  theme,
  layoutTemplate,
}: {
  orgName: string;
  stripeConnected: boolean;
  domainVerified: boolean;
  customDomain: string | null;
  emailProvider: string | null;
  customFieldCount: number;
  theme: string | null;
  layoutTemplate: string | null;
}) {
  const [searchQuery, setSearchQuery] = useState("");

  const cards: SettingsCardData[] = [
    {
      title: "Organization",
      description: "Name, logo, address, and contact info",
      icon: Building2,
      status: "configured",
      statusLabel: orgName,
      keywords: ["org", "name", "logo", "address", "contact", "info", "organization"],
      actionLabel: "Edit Organization",
    },
    {
      title: "Team",
      description: "Invite admins and manage roles",
      icon: Users,
      href: "/settings/team",
      keywords: ["team", "admin", "roles", "invite", "members", "permissions"],
      actionLabel: "Manage Team",
    },
    {
      title: "Billing",
      description: "Subscription and Stripe connection",
      icon: CreditCard,
      href: "/settings/billing",
      status: stripeConnected ? "connected" : "not_configured",
      statusLabel: stripeConnected ? "Connected" : "Not connected",
      keywords: ["billing", "stripe", "payment", "subscription", "connect"],
    },
    {
      title: "Domain",
      description: "Custom domain and DNS configuration",
      icon: Globe,
      href: "/settings/domain",
      status: domainVerified ? "connected" : "not_configured",
      statusLabel: customDomain || "Not configured",
      keywords: ["domain", "dns", "url", "custom", "website"],
    },
    {
      title: "Email",
      description: "Email provider, API keys, and sender settings",
      icon: Mail,
      href: "/settings/email",
      status: emailProvider ? "connected" : "not_configured",
      statusLabel: emailProvider
        ? `${emailProvider.charAt(0).toUpperCase()}${emailProvider.slice(1)} connected`
        : "Not configured",
      keywords: ["email", "provider", "api", "sender", "resend", "sendgrid", "mailgun", "smtp"],
    },
    {
      title: "Custom Fields",
      description: "Collect additional member information",
      icon: ListFilter,
      href: "/settings/custom-fields",
      statusLabel: `${customFieldCount} ${customFieldCount === 1 ? "field" : "fields"}`,
      keywords: ["custom", "fields", "data", "member", "additional", "information"],
    },
    {
      title: "Theme",
      description: "Portal visual style and colors",
      icon: Palette,
      href: "/settings/theme",
      statusLabel: theme || "Modern Minimal",
      keywords: ["theme", "style", "colors", "visual", "design", "branding"],
    },
    {
      title: "Layout Template",
      description: "Page layouts and site structure",
      icon: Layout,
      href: "/settings/template",
      statusLabel: layoutTemplate || "Starter",
      keywords: ["layout", "template", "site", "structure", "pages", "builder"],
    },
    {
      title: "Data Cleanup",
      description: "Standardize addresses, find duplicates, and remove unused fields",
      icon: Sparkles,
      href: "/settings/data-cleanup",
      keywords: ["data", "cleanup", "standardize", "address", "duplicate", "merge", "fields", "clean"],
      actionLabel: "Review Data",
    },
    {
      title: "Migration Center",
      description: "Import data and website content from other platforms",
      icon: ArrowLeftRight,
      href: "/settings/migration",
      highlight: true,
      keywords: ["migration", "import", "transfer", "memberclicks", "wild apricot", "platform"],
      actionLabel: "Get Started",
    },
  ];

  const filteredCards = searchQuery
    ? cards.filter((card) => {
        const q = searchQuery.toLowerCase();
        return (
          card.title.toLowerCase().includes(q) ||
          card.description.toLowerCase().includes(q) ||
          card.keywords.some((k) => k.includes(q))
        );
      })
    : cards;

  // Group by setup status
  const needsSetup = filteredCards.filter(
    (c) => c.status === "not_configured" || c.status === "action_needed"
  );
  const configured = filteredCards.filter(
    (c) => !needsSetup.includes(c) && !c.highlight
  );
  const highlighted = filteredCards.filter((c) => c.highlight);

  const renderCard = (card: SettingsCardData) => {
    const statusStyle = card.status ? STATUS_STYLES[card.status] : null;
    const StatusIcon = statusStyle?.icon;

    const content = (
      <Card
        className={cn(
          "group transition-all duration-200 hover:shadow-md",
          card.href && "cursor-pointer",
          card.highlight &&
            "border-indigo-200 bg-gradient-to-br from-indigo-50/50 to-violet-50/50"
        )}
      >
        <CardHeader>
          <div className="flex items-start justify-between">
            <card.icon
              className={cn(
                "h-8 w-8",
                card.highlight ? "text-indigo-600" : "text-[var(--primary)]"
              )}
            />
            {card.href && (
              <ArrowRight className="h-4 w-4 text-[var(--muted-foreground)] opacity-0 transition-all duration-200 group-hover:opacity-100 group-hover:translate-x-0.5" />
            )}
          </div>
          <CardTitle className="text-lg">{card.title}</CardTitle>
          <CardDescription>{card.description}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            {StatusIcon && (
              <StatusIcon className={cn("h-4 w-4", statusStyle?.color)} />
            )}
            {card.statusLabel && (
              <Badge
                variant={
                  card.highlight
                    ? "secondary"
                    : statusStyle?.badge || "secondary"
                }
                className={cn(
                  card.highlight && "bg-indigo-100 text-indigo-700"
                )}
              >
                {card.statusLabel}
              </Badge>
            )}
            {card.actionLabel && !card.status && (
              <Button variant="outline" size="sm">
                {card.actionLabel}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );

    return card.href ? (
      <Link key={card.title} href={card.href}>
        {content}
      </Link>
    ) : (
      <div key={card.title}>{content}</div>
    );
  };

  return (
    <>
      <SettingsSearch onSearch={setSearchQuery} />

      {searchQuery && filteredCards.length === 0 && (
        <div className="py-12 text-center text-sm text-[var(--muted-foreground)]">
          No settings match &ldquo;{searchQuery}&rdquo;
        </div>
      )}

      {/* Needs Setup section */}
      {needsSetup.length > 0 && !searchQuery && (
        <div className="mb-6">
          <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-[var(--muted-foreground)]">
            <AlertCircle className="h-4 w-4 text-amber-500" />
            Needs Setup
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 stagger-children">
            {needsSetup.map(renderCard)}
          </div>
        </div>
      )}

      {/* Configured section */}
      {configured.length > 0 && (
        <div className="mb-6">
          {!searchQuery && needsSetup.length > 0 && (
            <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-[var(--muted-foreground)]">
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              Configured
            </h2>
          )}
          <div className="grid gap-4 sm:grid-cols-2 stagger-children">
            {configured.map(renderCard)}
          </div>
        </div>
      )}

      {/* Highlighted (Migration) */}
      {highlighted.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 stagger-children">
          {highlighted.map(renderCard)}
        </div>
      )}
    </>
  );
}
