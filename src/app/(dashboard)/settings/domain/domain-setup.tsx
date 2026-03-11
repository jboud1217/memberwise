"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { saveCustomDomain, verifyDomain, removeDomain } from "@/actions/domain";
import {
  Globe,
  Copy,
  Check,
  AlertTriangle,
  CheckCircle,
  Trash2,
  RefreshCw,
  Info,
} from "lucide-react";

interface DomainSetupProps {
  customDomain: string | null;
  domainVerified: boolean;
  cnameTarget: string;
}

export function DomainSetup({ customDomain, domainVerified, cnameTarget }: DomainSetupProps) {
  const router = useRouter();
  const [domain, setDomain] = useState("");
  const [saving, setSaving] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [error, setError] = useState("");
  const [verifyResult, setVerifyResult] = useState<{
    verified: boolean;
    message?: string;
    found?: string[];
  } | null>(null);
  const [copied, setCopied] = useState(false);

  async function handleSave() {
    if (!domain.trim()) return;
    setError("");
    setSaving(true);
    const result = await saveCustomDomain(domain.trim());
    setSaving(false);
    if ("error" in result && result.error) {
      setError(result.error);
    } else {
      router.refresh();
    }
  }

  async function handleVerify() {
    setVerifying(true);
    setVerifyResult(null);
    const result = await verifyDomain();
    setVerifying(false);
    if ("error" in result && result.error) {
      setError(result.error);
    } else if ("verified" in result) {
      const verified = !!result.verified;
      setVerifyResult({
        verified,
        message: "message" in result ? (result.message as string) : undefined,
        found: "found" in result ? (result.found as string[]) : undefined,
      });
      if (verified) {
        router.refresh();
      }
    }
  }

  async function handleRemove() {
    setRemoving(true);
    await removeDomain();
    setRemoving(false);
    setVerifyResult(null);
    router.refresh();
  }

  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  // ─── State A: No domain configured ──────────────────────
  if (!customDomain) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Globe className="h-5 w-5" />
            Custom Domain
          </CardTitle>
          <CardDescription>
            Connect your own domain so members visit your site at your URL
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="domain">Domain Name</Label>
            <div className="flex gap-2">
              <Input
                id="domain"
                placeholder="members.yourorg.com"
                value={domain}
                onChange={(e) => setDomain(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSave()}
              />
              <Button onClick={handleSave} disabled={saving || !domain.trim()}>
                {saving ? <Spinner className="h-4 w-4" /> : "Save"}
              </Button>
            </div>
            <p className="text-sm text-[var(--muted-foreground)]">
              Enter the domain or subdomain you want members to use (e.g., members.yourorg.com)
            </p>
          </div>
          {error && (
            <div className="flex items-center gap-2 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              <AlertTriangle className="h-4 w-4 flex-shrink-0" />
              {error}
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  // ─── State B/C: Domain configured ───────────────────────
  return (
    <div className="space-y-6">
      {/* Domain status */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Globe className="h-5 w-5" />
              {customDomain}
            </CardTitle>
            <Badge variant={domainVerified ? "success" : "warning"}>
              {domainVerified ? "Verified" : "Pending Verification"}
            </Badge>
          </div>
        </CardHeader>
      </Card>

      {/* DNS instructions (shown when not yet verified) */}
      {!domainVerified && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">DNS Configuration</CardTitle>
            <CardDescription>
              Add a CNAME record at your DNS provider to point your domain to MemberWise
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Step-by-step instructions */}
            <div className="space-y-4">
              <div className="flex gap-3">
                <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-[var(--primary)] text-xs font-medium text-[var(--primary-foreground)]">
                  1
                </div>
                <div>
                  <p className="font-medium">Log in to your DNS provider</p>
                  <p className="text-sm text-[var(--muted-foreground)]">
                    This is where you manage your domain&apos;s DNS records (GoDaddy, Namecheap, Cloudflare, Route 53, etc.)
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-[var(--primary)] text-xs font-medium text-[var(--primary-foreground)]">
                  2
                </div>
                <div>
                  <p className="font-medium">Add a CNAME record</p>
                  <p className="text-sm text-[var(--muted-foreground)]">
                    Find &ldquo;DNS Records&rdquo; or &ldquo;DNS Management&rdquo; and add a new CNAME record with these values:
                  </p>
                </div>
              </div>
            </div>

            {/* CNAME record table */}
            <div className="rounded-md border border-[var(--border)] overflow-hidden">
              <div className="grid grid-cols-3 bg-[var(--muted)] px-4 py-2 text-xs font-medium uppercase tracking-wider text-[var(--muted-foreground)]">
                <div>Type</div>
                <div>Name</div>
                <div>Value</div>
              </div>
              <div className="grid grid-cols-3 items-center px-4 py-3">
                <code className="text-sm font-mono">CNAME</code>
                <code className="text-sm font-mono">{customDomain}</code>
                <div className="flex items-center gap-2">
                  <code className="text-sm font-mono">{cnameTarget}</code>
                  <button
                    onClick={() => copyToClipboard(cnameTarget)}
                    className="flex items-center gap-1 rounded px-2 py-1 text-xs text-[var(--muted-foreground)] hover:bg-[var(--muted)] hover:text-[var(--foreground)]"
                    title="Copy"
                  >
                    {copied ? (
                      <Check className="h-3.5 w-3.5 text-green-600" />
                    ) : (
                      <Copy className="h-3.5 w-3.5" />
                    )}
                  </button>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-[var(--primary)] text-xs font-medium text-[var(--primary-foreground)]">
                3
              </div>
              <div>
                <p className="font-medium">Click &ldquo;Verify DNS&rdquo; below</p>
                <p className="text-sm text-[var(--muted-foreground)]">
                  Once you&apos;ve saved the record, come back here and verify. It usually takes just a few minutes.
                </p>
              </div>
            </div>

            {/* Important notes */}
            <div className="rounded-md border border-blue-200 bg-blue-50 p-4 space-y-2">
              <div className="flex items-center gap-2 font-medium text-sm text-blue-800">
                <Info className="h-4 w-4" />
                Good to know
              </div>
              <ul className="space-y-1 text-sm text-blue-700">
                <li>DNS changes typically propagate within a few minutes, but can take up to an hour</li>
                <li>Your existing website and email are not affected — you&apos;re only adding a new record</li>
                <li>If using Cloudflare, set the proxy status to &ldquo;DNS only&rdquo; (grey cloud) initially</li>
              </ul>
            </div>

            {/* Verify result */}
            {verifyResult && !verifyResult.verified && (
              <div className="flex items-start gap-2 rounded-md border border-yellow-200 bg-yellow-50 p-3 text-sm text-yellow-700">
                <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <div>
                  <p>{verifyResult.message}</p>
                  {verifyResult.found && verifyResult.found.length > 0 && (
                    <p className="mt-1 text-xs">
                      Current CNAME target: {verifyResult.found.join(", ")}
                    </p>
                  )}
                </div>
              </div>
            )}

            {verifyResult?.verified && (
              <div className="flex items-center gap-2 rounded-md border border-green-200 bg-green-50 p-3 text-sm text-green-700">
                <CheckCircle className="h-4 w-4" />
                Domain verified successfully!
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Verified state */}
      {domainVerified && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <CheckCircle className="h-5 w-5 text-green-600" />
              Domain Connected
            </CardTitle>
            <CardDescription>
              Your domain is pointing to MemberWise via CNAME
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border border-[var(--border)] bg-[var(--muted)] overflow-hidden">
              <div className="grid grid-cols-3 px-4 py-2 text-xs font-medium uppercase tracking-wider text-[var(--muted-foreground)]">
                <div>Type</div>
                <div>Name</div>
                <div>Value</div>
              </div>
              <div className="grid grid-cols-3 px-4 py-3 border-t border-[var(--border)]">
                <code className="text-sm font-mono text-[var(--muted-foreground)]">CNAME</code>
                <code className="text-sm font-mono text-[var(--muted-foreground)]">{customDomain}</code>
                <code className="text-sm font-mono text-[var(--muted-foreground)]">{cnameTarget}</code>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Actions */}
      <div className="flex items-center gap-3">
        {!domainVerified && (
          <Button onClick={handleVerify} disabled={verifying}>
            {verifying ? (
              <>
                <Spinner className="h-4 w-4" />
                Checking DNS...
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4" />
                Verify DNS
              </>
            )}
          </Button>
        )}
        <Button variant="outline" onClick={handleRemove} disabled={removing}>
          {removing ? (
            <Spinner className="h-4 w-4" />
          ) : (
            <>
              <Trash2 className="h-4 w-4" />
              Remove Domain
            </>
          )}
        </Button>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          <AlertTriangle className="h-4 w-4 flex-shrink-0" />
          {error}
        </div>
      )}
    </div>
  );
}
