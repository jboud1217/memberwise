"use client";

import { useState, useEffect, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import {
  ArrowLeft,
  Mail,
  CheckCircle,
  AlertCircle,
  ExternalLink,
  Send,
  Trash2,
  Shield,
} from "lucide-react";
import Link from "next/link";
import { EMAIL_PROVIDERS, type EmailProvider } from "@/lib/email-service";
import {
  getEmailSettings,
  saveEmailSettings,
  testEmailSettings,
  disconnectEmail,
} from "@/actions/email-settings";

export default function EmailSettingsPage() {
  const [provider, setProvider] = useState<EmailProvider | null>(null);
  const [apiKey, setApiKey] = useState("");
  const [senderEmail, setSenderEmail] = useState("");
  const [senderName, setSenderName] = useState("");
  const [domain, setDomain] = useState("");
  const [region, setRegion] = useState("");
  const [apiKeySet, setApiKeySet] = useState(false);
  const [apiKeyPreview, setApiKeyPreview] = useState("");

  const [saving, startSave] = useTransition();
  const [testing, startTest] = useTransition();
  const [disconnecting, startDisconnect] = useTransition();
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [loaded, setLoaded] = useState(false);

  // Load current settings
  useEffect(() => {
    getEmailSettings().then((settings) => {
      if (settings) {
        setProvider(settings.provider);
        setSenderEmail(settings.senderEmail);
        setSenderName(settings.senderName);
        setDomain(settings.domain);
        setRegion(settings.region);
        setApiKeySet(settings.apiKeySet);
        setApiKeyPreview(settings.apiKeyPreview);
      }
      setLoaded(true);
    });
  }, []);

  const selectedProviderInfo = provider
    ? EMAIL_PROVIDERS.find((p) => p.id === provider)
    : null;

  function handleSave() {
    if (!provider) return;
    setMessage(null);

    startSave(async () => {
      const result = await saveEmailSettings({
        provider,
        apiKey: apiKey || undefined,
        senderEmail,
        senderName,
        domain,
        region,
      });

      if ("error" in result) {
        setMessage({ type: "error", text: result.error });
      } else {
        setMessage({ type: "success", text: "Settings saved successfully" });
        setApiKey("");
        setApiKeySet(true);
        // Reload to get updated preview
        const settings = await getEmailSettings();
        if (settings) setApiKeyPreview(settings.apiKeyPreview);
      }
    });
  }

  function handleTest() {
    setMessage(null);
    startTest(async () => {
      const result = await testEmailSettings();
      if ("error" in result) {
        setMessage({ type: "error", text: result.error });
      } else {
        setMessage({ type: "success", text: result.message });
      }
    });
  }

  function handleDisconnect() {
    setMessage(null);
    startDisconnect(async () => {
      await disconnectEmail();
      setProvider(null);
      setApiKey("");
      setSenderEmail("");
      setSenderName("");
      setDomain("");
      setRegion("");
      setApiKeySet(false);
      setApiKeyPreview("");
      setMessage({ type: "success", text: "Email provider disconnected" });
    });
  }

  if (!loaded) {
    return (
      <div className="flex items-center justify-center py-20">
        <Spinner className="h-6 w-6" />
      </div>
    );
  }

  return (
    <div>
      <Link
        href="/settings"
        className="mb-4 inline-flex items-center gap-1.5 text-sm text-[var(--muted-foreground)] transition-colors hover:text-[var(--foreground)]"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Back to Settings
      </Link>

      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Email Settings</h1>
        <p className="mt-0.5 text-sm text-[var(--muted-foreground)]">
          Connect an email service to send campaigns to your members
        </p>
      </div>

      {message && (
        <div
          className={`mb-4 flex items-center gap-2 rounded-lg border px-4 py-3 text-sm ${
            message.type === "success"
              ? "border-green-200 bg-green-50 text-green-700"
              : "border-red-200 bg-red-50 text-red-600"
          }`}
        >
          {message.type === "success" ? (
            <CheckCircle className="h-4 w-4 shrink-0" />
          ) : (
            <AlertCircle className="h-4 w-4 shrink-0" />
          )}
          {message.text}
        </div>
      )}

      {/* Provider Selection */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Mail className="h-4 w-4 text-[var(--muted-foreground)]" />
            Email Provider
          </CardTitle>
          <CardDescription>
            Choose which service to use for sending emails
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {EMAIL_PROVIDERS.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => {
                  setProvider(p.id);
                  setMessage(null);
                }}
                className={`rounded-lg border-2 p-4 text-left transition-all ${
                  provider === p.id
                    ? "border-[var(--primary)] bg-[var(--primary)]/5 ring-1 ring-[var(--primary)]"
                    : "border-[var(--border)] hover:border-[var(--muted-foreground)] hover:shadow-sm"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold">{p.name}</span>
                  {provider === p.id && apiKeySet && (
                    <Badge variant="success" className="text-[10px]">Connected</Badge>
                  )}
                </div>
                <p className="mt-1 text-xs leading-relaxed text-[var(--muted-foreground)]">
                  {p.description}
                </p>
                <a
                  href={p.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 inline-flex items-center gap-1 text-[10px] text-[var(--primary)] hover:underline"
                  onClick={(e) => e.stopPropagation()}
                >
                  Visit site <ExternalLink className="h-2.5 w-2.5" />
                </a>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Configuration */}
      {provider && selectedProviderInfo && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Shield className="h-4 w-4 text-[var(--muted-foreground)]" />
              {selectedProviderInfo.name} Configuration
            </CardTitle>
            <CardDescription>
              API keys are encrypted and stored securely
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* API Key */}
            <div className="space-y-2">
              <Label htmlFor="apiKey">{selectedProviderInfo.keyLabel}</Label>
              {apiKeySet && !apiKey ? (
                <div className="flex items-center gap-2">
                  <div className="flex-1 rounded-lg border border-[var(--border)] bg-[var(--muted)] px-3 py-2 font-mono text-xs text-[var(--muted-foreground)]">
                    {apiKeyPreview}
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setApiKeySet(false)}
                  >
                    Change
                  </Button>
                </div>
              ) : (
                <Input
                  id="apiKey"
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder={selectedProviderInfo.keyPlaceholder}
                  className="font-mono text-sm"
                />
              )}
            </div>

            {/* Sender Email */}
            <div className="space-y-2">
              <Label htmlFor="senderEmail">Sender Email</Label>
              <Input
                id="senderEmail"
                type="email"
                value={senderEmail}
                onChange={(e) => setSenderEmail(e.target.value)}
                placeholder="hello@yourorg.com"
              />
              <p className="text-[10px] text-[var(--muted-foreground)]">
                Must be verified with your email provider
              </p>
            </div>

            {/* Sender Name */}
            <div className="space-y-2">
              <Label htmlFor="senderName">Sender Name (optional)</Label>
              <Input
                id="senderName"
                value={senderName}
                onChange={(e) => setSenderName(e.target.value)}
                placeholder="Your Organization"
              />
            </div>

            {/* Provider-specific extra fields */}
            {selectedProviderInfo.extraFields?.map((field) => (
              <div key={field.key} className="space-y-2">
                <Label htmlFor={field.key}>{field.label}</Label>
                <Input
                  id={field.key}
                  value={field.key === "domain" ? domain : field.key === "region" ? region : ""}
                  onChange={(e) => {
                    if (field.key === "domain") setDomain(e.target.value);
                    if (field.key === "region") setRegion(e.target.value);
                  }}
                  placeholder={field.placeholder}
                />
              </div>
            ))}

            {/* Actions */}
            <div className="flex flex-wrap gap-2 pt-2">
              <Button onClick={handleSave} disabled={saving}>
                {saving ? <Spinner className="h-4 w-4" /> : <CheckCircle className="h-4 w-4" />}
                Save Settings
              </Button>
              {apiKeySet && (
                <Button variant="outline" onClick={handleTest} disabled={testing}>
                  {testing ? <Spinner className="h-4 w-4" /> : <Send className="h-4 w-4" />}
                  Send Test Email
                </Button>
              )}
              {apiKeySet && (
                <Button
                  variant="outline"
                  className="text-red-600 hover:bg-red-50 hover:text-red-700"
                  onClick={handleDisconnect}
                  disabled={disconnecting}
                >
                  {disconnecting ? <Spinner className="h-4 w-4" /> : <Trash2 className="h-4 w-4" />}
                  Disconnect
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Help text */}
      <Card>
        <CardContent className="py-6">
          <h3 className="text-sm font-semibold">Getting Started</h3>
          <ol className="mt-2 space-y-1.5 text-sm text-[var(--muted-foreground)]">
            <li>1. Sign up for an email provider above (Resend is recommended for getting started)</li>
            <li>2. Create an API key in your provider&apos;s dashboard</li>
            <li>3. Verify your sending domain or email address</li>
            <li>4. Paste your API key and sender email above</li>
            <li>5. Click &quot;Send Test Email&quot; to verify the connection</li>
          </ol>
        </CardContent>
      </Card>
    </div>
  );
}
