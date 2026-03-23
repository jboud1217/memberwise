"use client";

import { useEffect, useState } from "react";
import { getTiers, createTier, deleteTier } from "@/actions/tiers";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Dialog, DialogHeader, DialogTitle, DialogContent, DialogFooter } from "@/components/ui/dialog";
import { Plus, Trash2, Users } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

type Tier = {
  id: string;
  name: string;
  description: string | null;
  price: number;
  billingInterval: string;
  isActive: boolean;
  _count: { members: number };
};

export default function TiersPage() {
  const [tiers, setTiers] = useState<Tier[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadTiers();
  }, []);

  async function loadTiers() {
    const data = await getTiers();
    setTiers(data as unknown as Tier[]);
    setLoading(false);
  }

  async function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    const form = new FormData(e.currentTarget);
    await createTier({
      name: form.get("name") as string,
      description: (form.get("description") as string) || undefined,
      price: parseFloat(form.get("price") as string) || 0,
      billingInterval: ((form.get("billingInterval") as string) || "ANNUAL") as "ANNUAL",
      benefits: [],
      isActive: true,
      sortOrder: tiers.length,
    });
    setSaving(false);
    setShowCreate(false);
    loadTiers();
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this tier? Members with this tier will be unlinked.")) return;
    await deleteTier(id);
    loadTiers();
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Membership Tiers</h1>
          <p className="text-sm text-[var(--muted-foreground)]">Configure your membership levels and pricing</p>
        </div>
        <Button onClick={() => setShowCreate(true)}>
          <Plus className="h-4 w-4" />
          Add Tier
        </Button>
      </div>

      {loading ? (
        <div className="py-12 text-center text-[var(--muted-foreground)]">Loading...</div>
      ) : tiers.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-sm text-[var(--muted-foreground)]">
            No tiers yet. Create your first membership tier to get started.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 stagger-children">
          {tiers.map((tier) => (
            <Card key={tier.id} className="transition-all hover:shadow-[var(--shadow-sm)] hover:border-[var(--ring)]/20">
              <CardHeader className="flex flex-row items-start justify-between space-y-0">
                <div>
                  <CardTitle className="text-lg">{tier.name}</CardTitle>
                  {tier.description && (
                    <p className="mt-1 text-sm text-[var(--muted-foreground)]">{tier.description}</p>
                  )}
                </div>
                <Badge variant={tier.isActive ? "success" : "secondary"}>
                  {tier.isActive ? "Active" : "Inactive"}
                </Badge>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="text-2xl font-bold">{formatCurrency(tier.price)}</div>
                <div className="text-sm text-[var(--muted-foreground)]">
                  per {tier.billingInterval.toLowerCase().replace("_", " ")}
                </div>
                <div className="flex items-center gap-1 text-sm text-[var(--muted-foreground)]">
                  <Users className="h-4 w-4" />
                  {tier._count.members} members
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-[var(--destructive)]"
                  onClick={() => handleDelete(tier.id)}
                >
                  <Trash2 className="h-4 w-4" />
                  Delete
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={showCreate} onClose={() => setShowCreate(false)}>
        <form onSubmit={handleCreate}>
          <DialogHeader>
            <DialogTitle>Create Membership Tier</DialogTitle>
          </DialogHeader>
          <DialogContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="tierName">Name</Label>
              <Input id="tierName" name="name" required placeholder="e.g. Single Family" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tierDesc">Description</Label>
              <Input id="tierDesc" name="description" placeholder="Optional description" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="tierPrice">Price ($)</Label>
                <Input id="tierPrice" name="price" type="number" step="0.01" required defaultValue="0" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tierInterval">Billing Interval</Label>
                <Select id="tierInterval" name="billingInterval" defaultValue="ANNUAL">
                  <option value="MONTHLY">Monthly</option>
                  <option value="QUARTERLY">Quarterly</option>
                  <option value="SEMI_ANNUAL">Semi-Annual</option>
                  <option value="ANNUAL">Annual</option>
                  <option value="TWO_YEAR">Two Year</option>
                  <option value="LIFETIME">Lifetime</option>
                  <option value="ONE_TIME">One Time</option>
                </Select>
              </div>
            </div>
          </DialogContent>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setShowCreate(false)} disabled={saving}>Cancel</Button>
            <Button type="submit" disabled={saving}>{saving ? "Creating..." : "Create Tier"}</Button>
          </DialogFooter>
        </form>
      </Dialog>
    </div>
  );
}
