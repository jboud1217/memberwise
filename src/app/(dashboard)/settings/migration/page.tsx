import type { Metadata } from "next";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { tenantPrisma } from "@/lib/prisma-tenant";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  Circle,
  Upload,
  Globe,
  Users,
  CreditCard,
  Mail,
  CalendarDays,
  Layout,
  Shield,
  Zap,
  ArrowLeftRight,
  Sparkles,
  FileSpreadsheet,
  ExternalLink,
} from "lucide-react";
import { WebsiteImporter } from "./website-importer";

export const metadata: Metadata = { title: "Migration" };

export default async function MigrationPage() {
  const session = await auth();
  if (!session?.user?.organizationId) redirect("/login");
  const orgId = session.user.organizationId;
  const db = tenantPrisma(prisma, orgId);

  const [org, memberCount, tierCount, eventCount, campaignCount, importJobs] =
    await Promise.all([
      prisma.organization.findUnique({
        where: { id: orgId },
        select: { name: true, stripeConnectOnboarded: true, customDomain: true, domainVerified: true, siteDocument: true },
      }),
      db.member.count({}),
      db.membershipTier.count({}),
      db.event.count({}),
      db.emailCampaign.count({}),
      prisma.importJob.findMany({
        where: { organizationId: orgId },
        orderBy: { createdAt: "desc" },
        take: 5,
        select: { id: true, status: true, fileName: true, totalRows: true, processedRows: true, createdAt: true },
      }),
    ]);

  const hasMembers = memberCount > 0;
  const hasTiers = tierCount > 0;
  const hasWebsite = !!org?.siteDocument;
  const hasDomain = !!org?.domainVerified;
  const hasPayments = !!org?.stripeConnectOnboarded;
  const hasEvents = eventCount > 0;
  const hasEmail = campaignCount > 0;

  const steps = [
    { label: "Import Members & Data", href: "/members/import", done: hasMembers, icon: Upload, description: "Bring your members, contacts, dues, and custom fields from MemberClicks or any other platform" },
    { label: "Set Up Membership Tiers", href: "/tiers", done: hasTiers, icon: Users, description: "Configure your membership levels with pricing — auto-created from your import data" },
    { label: "Build Your Website", href: "/settings/template", done: hasWebsite, icon: Layout, description: "Design your public site with our drag-and-drop builder — no WordPress needed" },
    { label: "Connect Domain", href: "/settings/domain", done: hasDomain, icon: Globe, description: "Point your existing domain to Memberwise for a seamless transition" },
    { label: "Connect Payments", href: "/settings/billing", done: hasPayments, icon: CreditCard, description: "Set up Stripe to collect dues, event fees, and donations online" },
    { label: "Create Events", href: "/events/create", done: hasEvents, icon: CalendarDays, description: "Set up events with registration, ticketing, and capacity management" },
    { label: "Send First Email", href: "/email/new", done: hasEmail, icon: Mail, description: "Welcome your members to the new platform with a branded email campaign" },
  ];

  const completedSteps = steps.filter((s) => s.done).length;
  const progress = Math.round((completedSteps / steps.length) * 100);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Migration Center</h1>
        <p className="mt-0.5 text-sm text-[var(--muted-foreground)]">
          Everything you need to move from MemberClicks (or any platform) to Memberwise
        </p>
      </div>

      {/* Why Memberwise vs WordPress + MemberClicks */}
      <Card className="mb-6 border-indigo-200 bg-gradient-to-br from-indigo-50/80 to-violet-50/80">
        <CardContent className="pt-6">
          <div className="flex items-start gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 shadow-sm">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-base font-semibold">Why Memberwise Instead of WordPress + MemberClicks?</h2>
              <p className="mt-1 text-sm text-[var(--muted-foreground)]">
                Your client is debating between a separate WordPress site or staying in MemberClicks. Here&apos;s why Memberwise is the better answer:
              </p>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <ComparisonPoint
                  icon={<ArrowLeftRight className="h-4 w-4" />}
                  title="One Platform, Not Two"
                  description="No juggling WordPress + MC. Members, website, payments, and emails are all in one place. No broken links between systems."
                />
                <ComparisonPoint
                  icon={<Globe className="h-4 w-4" />}
                  title="Modern Website Builder"
                  description="Drag-and-drop site builder with 32 section types, AI content generation, and live preview. No WordPress plugins to manage."
                />
                <ComparisonPoint
                  icon={<Shield className="h-4 w-4" />}
                  title="Seamless Member Experience"
                  description="Members click 'Join Now' and it works — no redirecting between platforms. Registration, payments, and portal are integrated."
                />
                <ComparisonPoint
                  icon={<Zap className="h-4 w-4" />}
                  title="Zero Maintenance"
                  description="No WordPress updates, plugin conflicts, or security patches. No MC contract renewals. One modern platform that just works."
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Migration Progress */}
      <Card className="mb-6">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-semibold">Migration Progress</CardTitle>
            <Badge variant={progress === 100 ? "success" : "secondary"}>
              {completedSteps}/{steps.length} complete
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          {/* Progress bar */}
          <div className="mb-5 h-2 overflow-hidden rounded-full bg-[var(--muted)]">
            <div
              className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-violet-500 transition-all duration-700"
              style={{ width: `${progress}%` }}
            />
          </div>

          {/* Steps */}
          <div className="space-y-2">
            {steps.map((step, i) => (
              <Link
                key={step.label}
                href={step.href}
                className="group flex items-start gap-3 rounded-lg border border-[var(--border)] bg-[var(--card)] p-3 transition-all hover:border-[var(--primary)]/30 hover:shadow-sm"
              >
                <div className="mt-0.5">
                  {step.done ? (
                    <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                  ) : (
                    <Circle className="h-5 w-5 text-[var(--muted-foreground)]" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <step.icon className="h-4 w-4 text-[var(--muted-foreground)]" />
                    <p className={`text-sm font-medium ${step.done ? "text-[var(--muted-foreground)] line-through" : ""}`}>
                      {step.label}
                    </p>
                  </div>
                  <p className="mt-0.5 text-xs text-[var(--muted-foreground)]">
                    {step.description}
                  </p>
                </div>
                <ArrowRight className="mt-1 h-4 w-4 shrink-0 text-[var(--muted-foreground)] opacity-0 transition-opacity group-hover:opacity-60" />
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Website Content Import */}
      <Card className="mb-6">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold">Import Website Content</CardTitle>
          <CardDescription>
            Paste your current website URL and we&apos;ll extract the content to populate your new site sections
          </CardDescription>
        </CardHeader>
        <CardContent>
          <WebsiteImporter />
        </CardContent>
      </Card>

      {/* Previous Imports */}
      {importJobs.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold">Import History</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {importJobs.map((job) => (
                <div
                  key={job.id}
                  className="flex items-center justify-between rounded-lg border border-[var(--border)] bg-[var(--card)] px-3 py-2"
                >
                  <div className="flex items-center gap-2">
                    <FileSpreadsheet className="h-4 w-4 text-[var(--muted-foreground)]" />
                    <div>
                      <p className="text-xs font-medium">{job.fileName}</p>
                      <p className="text-[10px] text-[var(--muted-foreground)]">
                        {job.processedRows}/{job.totalRows} rows &middot;{" "}
                        {new Date(job.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <Badge
                    variant={
                      job.status === "COMPLETED" ? "success" : job.status === "IMPORTING" ? "secondary" : "outline"
                    }
                  >
                    {job.status}
                  </Badge>
                </div>
              ))}
            </div>
            <Link href="/members/import" className="mt-3 inline-flex items-center gap-1 text-xs text-[var(--primary)] hover:underline">
              Import more data <ArrowRight className="h-3 w-3" />
            </Link>
          </CardContent>
        </Card>
      )}

      {/* FAQ for MemberClicks migrants */}
      <Card className="mt-6">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold">Common Questions from MemberClicks Users</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <FAQ
              q="Do I need a separate WordPress site?"
              a="No. Memberwise includes a full website builder with 32 section types, custom themes, and AI-powered content generation. Your public website, member portal, event registration, and payment processing are all built in. There's no need to maintain a separate WordPress installation."
            />
            <FAQ
              q="Will 'Join Now' buttons work without MemberClicks?"
              a="Yes — Memberwise handles the entire member journey. Join Now links go to your built-in registration flow, which connects directly to membership tiers, payment processing via Stripe, and your member database. No redirects to external systems."
            />
            <FAQ
              q="Can I keep my existing domain?"
              a="Absolutely. Go to Settings → Domain to point your current domain (e.g. yourorg.com) to Memberwise. We handle SSL certificates automatically. Your members won't notice any difference in the URL."
            />
            <FAQ
              q="What happens to my MemberClicks data?"
              a="Export your data from MemberClicks as a CSV, then use our Import Wizard. We auto-detect MemberClicks' bracket notation format, map all your fields, and preserve member types, dues, join dates, custom fields, and organization relationships. Most imports complete in under 5 minutes."
            />
            <FAQ
              q="Can I improve the web templates like fixing margins?"
              a="Memberwise gives you full control over every section's styling — padding, margins, colors, gradients, animations, shadows, and more. Use the Style tab on any section in the Site Builder to fine-tune exactly how it looks. No CSS knowledge required."
            />
            <FAQ
              q="What about email campaigns and events?"
              a="Both are built in. Create and send branded email campaigns directly from the platform, and manage events with registration, multiple ticket types, member pricing, capacity management, waitlists, and check-in tracking."
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function ComparisonPoint({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="flex items-start gap-2.5 rounded-lg bg-white/60 p-3">
      <div className="mt-0.5 text-indigo-600">{icon}</div>
      <div>
        <p className="text-sm font-medium">{title}</p>
        <p className="mt-0.5 text-xs text-[var(--muted-foreground)]">{description}</p>
      </div>
    </div>
  );
}

function FAQ({ q, a }: { q: string; a: string }) {
  return (
    <div>
      <p className="text-sm font-medium">{q}</p>
      <p className="mt-1 text-xs text-[var(--muted-foreground)] leading-relaxed">{a}</p>
    </div>
  );
}
