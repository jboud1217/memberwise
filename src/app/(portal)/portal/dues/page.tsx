"use client";

import { useState, useEffect, useTransition } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { formatCurrency, formatDate } from "@/lib/utils";
import {
  CreditCard,
  CheckCircle2,
  AlertCircle,
  ArrowUpRight,
  Shield,
  Star,
} from "lucide-react";
import {
  getPortalRenewalInfo,
  getPortalMemberProfile,
  initiateRenewalCheckout,
  completeOfflineRenewal,
} from "@/actions/portal";
import { useSearchParams } from "next/navigation";

type RenewalInfo = Awaited<ReturnType<typeof getPortalRenewalInfo>>;
type ProfileInfo = Awaited<ReturnType<typeof getPortalMemberProfile>>;

export default function PortalDuesPage() {
  const searchParams = useSearchParams();
  const [renewalInfo, setRenewalInfo] = useState<RenewalInfo>(null);
  const [profile, setProfile] = useState<ProfileInfo>(null);
  const [loading, setLoading] = useState(true);
  const [isPending, startTransition] = useTransition();
  const [selectedTierId, setSelectedTierId] = useState<string | null>(null);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const isSuccess = searchParams.get("success") === "1";
  const isCancelled = searchParams.get("cancelled") === "1";

  useEffect(() => {
    Promise.all([getPortalRenewalInfo(), getPortalMemberProfile()]).then(
      ([renewal, prof]) => {
        setRenewalInfo(renewal);
        setProfile(prof);
        setSelectedTierId(renewal?.member.tierId || null);
        setLoading(false);
      },
    );
  }, []);

  function handleRenew() {
    if (!selectedTierId) return;
    setMessage(null);

    startTransition(async () => {
      try {
        const selectedTier = renewalInfo?.availableTiers.find(
          (t) => t.id === selectedTierId,
        );
        if (selectedTier && selectedTier.price <= 0) {
          const result = await completeOfflineRenewal({
            tierId: selectedTierId,
          });
          if (result.success) {
            setMessage({
              type: "success",
              text: "Membership renewed successfully!",
            });
            // Refresh data
            const updated = await getPortalRenewalInfo();
            setRenewalInfo(updated);
          }
        } else {
          const result = await initiateRenewalCheckout({
            tierId: selectedTierId,
          });
          if (result.url) {
            window.location.href = result.url;
          }
        }
      } catch (err) {
        setMessage({
          type: "error",
          text:
            err instanceof Error ? err.message : "Something went wrong. Please try again.",
        });
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

  if (!renewalInfo || !profile) {
    return (
      <div className="py-12 text-center">
        <AlertCircle className="mx-auto mb-3 h-8 w-8 text-[var(--muted-foreground)]" />
        <p className="text-[var(--muted-foreground)]">
          Your account is not linked to a member record yet. Please contact your
          organization administrator.
        </p>
      </div>
    );
  }

  const { member, availableTiers, stripeEnabled } = renewalInfo;
  const payments = profile.member.payments || [];
  const isExpired =
    member.expirationDate && new Date(member.expirationDate) < new Date();
  const isProspect = member.status === "PROSPECT";

  return (
    <div>
      <h1 className="mb-2 text-2xl font-bold">Dues & Membership</h1>
      <p className="mb-6 text-sm text-[var(--muted-foreground)]">
        Manage your membership, renew, or upgrade your plan.
      </p>

      {/* Return from Stripe messages */}
      {isSuccess && (
        <div className="mb-4 flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          Payment received! Your membership has been renewed. It may take a
          moment to update.
        </div>
      )}
      {isCancelled && (
        <div className="mb-4 flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
          <AlertCircle className="h-4 w-4 shrink-0" />
          Payment was cancelled. You can try again anytime.
        </div>
      )}

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

      {/* Current Membership Status */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-lg">Current Membership</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-center gap-3">
            <Badge
              variant={
                member.status === "ACTIVE"
                  ? "success"
                  : isExpired
                    ? "destructive"
                    : "secondary"
              }
            >
              {isExpired ? "EXPIRED" : member.status}
            </Badge>
            {member.tierName && (
              <span className="text-sm font-medium">{member.tierName}</span>
            )}
            {member.tierPrice > 0 && (
              <span className="text-sm text-[var(--muted-foreground)]">
                {formatCurrency(member.tierPrice)} /{" "}
                {(member.tierInterval || "ANNUAL").toLowerCase().replace("_", " ")}
              </span>
            )}
          </div>
          <div className="mt-3 flex flex-wrap gap-6 text-sm text-[var(--muted-foreground)]">
            {member.renewalDate && (
              <span>Next renewal: {formatDate(member.renewalDate)}</span>
            )}
            {member.expirationDate && (
              <span>
                {isExpired ? "Expired" : "Expires"}:{" "}
                {formatDate(member.expirationDate)}
              </span>
            )}
          </div>
          {(isExpired || isProspect) && (
            <div className="mt-3 rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-800">
              {isProspect
                ? "You are currently a prospect. Choose a membership tier below to become a full member!"
                : "Your membership has expired. Renew below to restore your benefits."}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tier Selection & Renewal */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            {isProspect ? (
              <>
                <ArrowUpRight className="h-5 w-5" /> Choose a Membership
              </>
            ) : (
              <>
                <Star className="h-5 w-5" /> Renew or Change Plan
              </>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {availableTiers.length === 0 ? (
            <p className="text-sm text-[var(--muted-foreground)]">
              No membership tiers are currently available. Please contact your
              administrator.
            </p>
          ) : (
            <>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {availableTiers.map((tier) => {
                  const isCurrent = tier.id === member.tierId;
                  const isSelected = tier.id === selectedTierId;
                  return (
                    <button
                      key={tier.id}
                      type="button"
                      onClick={() => setSelectedTierId(tier.id)}
                      className={`relative rounded-lg border-2 p-4 text-left transition-all ${
                        isSelected
                          ? "border-[var(--primary)] bg-[var(--primary)]/5 shadow-sm"
                          : "border-[var(--border)] hover:border-[var(--primary)]/50"
                      }`}
                    >
                      {isCurrent && (
                        <Badge
                          variant="outline"
                          className="absolute right-3 top-3 text-[10px]"
                        >
                          Current
                        </Badge>
                      )}
                      <h3 className="font-semibold">{tier.name}</h3>
                      <p className="mt-1 text-2xl font-bold">
                        {tier.price > 0 ? formatCurrency(tier.price) : "Free"}
                        {tier.price > 0 && (
                          <span className="text-sm font-normal text-[var(--muted-foreground)]">
                            {" "}
                            /{" "}
                            {(tier.billingInterval || "ANNUAL")
                              .toLowerCase()
                              .replace("_", " ")}
                          </span>
                        )}
                      </p>
                      {tier.description && (
                        <p className="mt-2 text-xs text-[var(--muted-foreground)]">
                          {tier.description}
                        </p>
                      )}
                      {tier.benefits && tier.benefits.length > 0 && (
                        <ul className="mt-3 space-y-1">
                          {tier.benefits.map((b, i) => (
                            <li
                              key={i}
                              className="flex items-start gap-1.5 text-xs text-[var(--muted-foreground)]"
                            >
                              <CheckCircle2 className="mt-0.5 h-3 w-3 shrink-0 text-green-500" />
                              {b}
                            </li>
                          ))}
                        </ul>
                      )}
                      {isSelected && (
                        <div className="absolute inset-x-0 bottom-0 h-0.5 rounded-b-lg bg-[var(--primary)]" />
                      )}
                    </button>
                  );
                })}
              </div>

              <div className="mt-6 flex items-center gap-3">
                <Button
                  onClick={handleRenew}
                  disabled={
                    isPending ||
                    !selectedTierId ||
                    (!stripeEnabled &&
                      (availableTiers.find((t) => t.id === selectedTierId)
                        ?.price || 0) > 0)
                  }
                >
                  {isPending && <Spinner className="mr-2 h-4 w-4" />}
                  {isProspect
                    ? "Join Now"
                    : selectedTierId !== member.tierId
                      ? "Switch & Pay"
                      : "Renew Membership"}
                </Button>
                {!stripeEnabled && (
                  <p className="text-xs text-[var(--muted-foreground)]">
                    <Shield className="mr-1 inline h-3 w-3" />
                    Online payments are not yet configured. Contact your
                    administrator to pay by check or cash.
                  </p>
                )}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Payment History */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Payment History</CardTitle>
        </CardHeader>
        <CardContent>
          {payments.length === 0 ? (
            <div className="flex flex-col items-center py-6 text-center">
              <CreditCard className="mb-3 h-8 w-8 text-[var(--muted-foreground)]" />
              <p className="text-sm text-[var(--muted-foreground)]">
                No payments found.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Method</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Description</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payments.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell>
                        {p.paidAt ? formatDate(p.paidAt) : "—"}
                      </TableCell>
                      <TableCell>{formatCurrency(p.amount)}</TableCell>
                      <TableCell>{p.method}</TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            p.status === "COMPLETED" ? "success" : "secondary"
                          }
                        >
                          {p.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-[var(--muted-foreground)]">
                        {p.description || "—"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
