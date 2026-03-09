"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { memberSchema, type MemberInput } from "@/lib/validators/member";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";

interface MemberFormProps {
  defaultValues?: Partial<MemberInput>;
  tiers: { id: string; name: string }[];
  onSubmit: (data: MemberInput) => Promise<{ error?: string }>;
  submitLabel?: string;
}

export function MemberForm({ defaultValues, tiers, onSubmit, submitLabel = "Save" }: MemberFormProps) {
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<MemberInput>({
    resolver: zodResolver(memberSchema),
    defaultValues: {
      status: "PROSPECT",
      ...defaultValues,
    },
  });

  async function handleFormSubmit(data: MemberInput) {
    const result = await onSubmit(data);
    if (result?.error) {
      setError("root", { message: result.error });
    }
  }

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      {errors.root && (
        <div className="rounded-md bg-red-50 p-3 text-sm text-red-600">{errors.root.message}</div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Basic Information</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="displayName">Display Name *</Label>
            <Input id="displayName" {...register("displayName")} placeholder="e.g. The Smith Family" />
            {errors.displayName && <p className="text-sm text-red-500">{errors.displayName.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="organizationName">Organization Name</Label>
            <Input id="organizationName" {...register("organizationName")} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="memberNumber">Member Number</Label>
            <Input id="memberNumber" {...register("memberNumber")} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select id="status" {...register("status")}>
              <option value="PROSPECT">Prospect</option>
              <option value="ACTIVE">Active</option>
              <option value="LAPSED">Lapsed</option>
              <option value="SUSPENDED">Suspended</option>
              <option value="ARCHIVED">Archived</option>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="tierId">Membership Tier</Label>
            <Select id="tierId" {...register("tierId")}>
              <option value="">No tier</option>
              {tiers.map((tier) => (
                <option key={tier.id} value={tier.id}>{tier.name}</option>
              ))}
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Address</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="address1">Address Line 1</Label>
            <Input id="address1" {...register("address1")} />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="address2">Address Line 2</Label>
            <Input id="address2" {...register("address2")} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="city">City</Label>
            <Input id="city" {...register("city")} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="state">State</Label>
            <Input id="state" {...register("state")} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="zip">ZIP</Label>
            <Input id="zip" {...register("zip")} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="country">Country</Label>
            <Input id="country" {...register("country")} placeholder="US" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Membership Dates</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="joinDate">Join Date</Label>
            <Input id="joinDate" type="date" {...register("joinDate")} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="renewalDate">Renewal Date</Label>
            <Input id="renewalDate" type="date" {...register("renewalDate")} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="expirationDate">Expiration Date</Label>
            <Input id="expirationDate" type="date" {...register("expirationDate")} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Notes</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea id="notes" {...register("notes")} rows={4} placeholder="Internal notes about this member..." />
        </CardContent>
      </Card>

      <div className="flex justify-end gap-3">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? <Spinner className="h-4 w-4" /> : submitLabel}
        </Button>
      </div>
    </form>
  );
}
