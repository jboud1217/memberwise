"use client";

import { useState, useEffect, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { CheckCircle2, AlertCircle } from "lucide-react";
import { updatePortalProfile, getPortalMemberProfile } from "@/actions/portal";

export default function PortalProfilePage() {
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [profile, setProfile] = useState<{
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    address1: string;
    address2: string;
    city: string;
    state: string;
    zip: string;
    doNotEmail: boolean;
    doNotMail: boolean;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  // Load profile data on mount
  useEffect(() => {
    getPortalMemberProfile().then((data) => {
      if (data) {
        const { contact, member } = data;
        setProfile({
          firstName: contact.firstName || "",
          lastName: contact.lastName || "",
          email: contact.email || "",
          phone: contact.phone || "",
          address1: member.address1 || "",
          address2: member.address2 || "",
          city: member.city || "",
          state: member.state || "",
          zip: member.zip || "",
          doNotEmail: member.doNotEmail || false,
          doNotMail: member.doNotMail || false,
        });
      }
      setLoading(false);
    });
  }, []);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!profile) return;

    setMessage(null);
    startTransition(async () => {
      try {
        const result = await updatePortalProfile({
          firstName: profile.firstName,
          lastName: profile.lastName,
          phone: profile.phone,
          address1: profile.address1,
          address2: profile.address2,
          city: profile.city,
          state: profile.state,
          zip: profile.zip,
        });
        if (result.success) {
          setMessage({ type: "success", text: "Profile updated successfully." });
          setTimeout(() => setMessage(null), 4000);
        }
      } catch {
        setMessage({ type: "error", text: "Failed to update profile. Please try again." });
      }
    });
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="py-12 text-center">
        <AlertCircle className="mx-auto mb-3 h-8 w-8 text-[var(--muted-foreground)]" />
        <p className="text-[var(--muted-foreground)]">
          Your account is not linked to a member record yet. Please contact your organization administrator.
        </p>
      </div>
    );
  }

  return (
    <div>
      <h1 className="mb-2 text-2xl font-bold">My Profile</h1>
      <p className="mb-6 text-sm text-[var(--muted-foreground)]">
        Update your contact information and preferences.
      </p>

      {message && (
        <div
          className={`mb-4 flex items-center gap-2 rounded-lg border px-4 py-3 text-sm ${
            message.type === "success"
              ? "border-green-200 bg-green-50 text-green-700"
              : "border-red-200 bg-red-50 text-red-700"
          }`}
        >
          {message.type === "success" ? (
            <CheckCircle2 className="h-4 w-4 shrink-0" />
          ) : (
            <AlertCircle className="h-4 w-4 shrink-0" />
          )}
          {message.text}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Contact Information</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="firstName">First Name</Label>
              <Input
                id="firstName"
                value={profile.firstName}
                onChange={(e) => setProfile({ ...profile, firstName: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Last Name</Label>
              <Input
                id="lastName"
                value={profile.lastName}
                onChange={(e) => setProfile({ ...profile, lastName: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={profile.email}
                disabled
                className="opacity-60"
              />
              <p className="text-[11px] text-[var(--muted-foreground)]">
                Contact your administrator to change your email address.
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                type="tel"
                value={profile.phone}
                onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Address</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="address1">Street Address</Label>
              <Input
                id="address1"
                value={profile.address1}
                onChange={(e) => setProfile({ ...profile, address1: e.target.value })}
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="address2">Address Line 2</Label>
              <Input
                id="address2"
                value={profile.address2}
                placeholder="Apt, suite, unit, etc."
                onChange={(e) => setProfile({ ...profile, address2: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="city">City</Label>
              <Input
                id="city"
                value={profile.city}
                onChange={(e) => setProfile({ ...profile, city: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="state">State</Label>
                <Input
                  id="state"
                  value={profile.state}
                  onChange={(e) => setProfile({ ...profile, state: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="zip">ZIP</Label>
                <Input
                  id="zip"
                  value={profile.zip}
                  onChange={(e) => setProfile({ ...profile, zip: e.target.value })}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Communication Preferences</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <label className="flex items-center gap-3 text-sm">
              <input
                type="checkbox"
                checked={!profile.doNotEmail}
                onChange={(e) => setProfile({ ...profile, doNotEmail: !e.target.checked })}
                className="cursor-pointer"
              />
              Receive email newsletters and updates
            </label>
            <label className="flex items-center gap-3 text-sm">
              <input
                type="checkbox"
                checked={!profile.doNotMail}
                onChange={(e) => setProfile({ ...profile, doNotMail: !e.target.checked })}
                className="cursor-pointer"
              />
              Receive printed mailings
            </label>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button type="submit" disabled={isPending}>
            {isPending && <Spinner className="mr-2 h-4 w-4" />}
            Save Changes
          </Button>
        </div>
      </form>
    </div>
  );
}
