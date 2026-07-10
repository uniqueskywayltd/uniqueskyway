"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Pencil, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { EmptyState } from "@/components/design-system";
import type { AdminPlanView } from "@/lib/services/investment-plan.service";
import { toast } from "sonner";
import { formatMoney } from "@/lib/utils/money";

type PlanFormState = {
  id?: string;
  slug: string;
  name: string;
  description: string;
  dailyRoiPercent: string;
  maxRoiPercent: string;
  minDeposit: string;
  maxDeposit: string;
  durationDays: string;
  lockPeriodDays: string;
  referralCommissionPercent: string;
  currency: string;
  maxReinvestCycles: string;
  gracePeriodDays: string;
  sortOrder: string;
  compounding: boolean;
  reinvestEnabled: boolean;
  isVisible: boolean;
  isActive: boolean;
};

const emptyForm: PlanFormState = {
  slug: "",
  name: "",
  description: "",
  dailyRoiPercent: "3",
  maxRoiPercent: "",
  minDeposit: "50",
  maxDeposit: "",
  durationDays: "5",
  lockPeriodDays: "5",
  referralCommissionPercent: "10",
  currency: "USD",
  maxReinvestCycles: "2",
  gracePeriodDays: "0",
  sortOrder: "0",
  compounding: false,
  reinvestEnabled: true,
  isVisible: true,
  isActive: true,
};

function slugifyName(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
}

function planToForm(plan: AdminPlanView): PlanFormState {
  return {
    id: plan.id,
    slug: plan.slug,
    name: plan.name,
    description: plan.description ?? "",
    dailyRoiPercent: plan.dailyRoiPercent,
    maxRoiPercent: plan.maxRoiPercent ?? "",
    minDeposit: plan.minDeposit,
    maxDeposit: plan.maxDeposit ?? "",
    durationDays: String(plan.durationDays),
    lockPeriodDays: String(plan.lockPeriodDays),
    referralCommissionPercent: plan.referralCommissionPercent,
    currency: plan.currency,
    maxReinvestCycles: String(plan.maxReinvestCycles),
    gracePeriodDays: String(plan.gracePeriodDays),
    sortOrder: String(plan.sortOrder),
    compounding: Boolean(plan.compounding),
    reinvestEnabled: Boolean(plan.reinvestEnabled),
    isVisible: plan.isVisible,
    isActive: plan.isActive,
  };
}

function formToPayload(form: PlanFormState) {
  return {
    slug: form.slug.trim(),
    name: form.name.trim(),
    description: form.description.trim() || undefined,
    dailyRoiPercent: form.dailyRoiPercent.trim(),
    maxRoiPercent: form.maxRoiPercent.trim() || undefined,
    minDeposit: form.minDeposit.trim(),
    maxDeposit: form.maxDeposit.trim() || undefined,
    durationDays: Number(form.durationDays),
    lockPeriodDays: Number(form.lockPeriodDays || "5"),
    referralCommissionPercent: form.referralCommissionPercent.trim() || "10",
    currency: form.currency.trim() || "USD",
    maxReinvestCycles: Number(form.maxReinvestCycles || "2"),
    gracePeriodDays: Number(form.gracePeriodDays || "0"),
    sortOrder: Number(form.sortOrder || "0"),
    compounding: form.compounding,
    reinvestEnabled: form.reinvestEnabled,
    isVisible: form.isVisible,
    isActive: form.isActive,
  };
}

export function AdminPlansManager({ plans }: { plans: AdminPlanView[] }) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState<PlanFormState>(emptyForm);

  const sorted = useMemo(
    () => [...plans].sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name)),
    [plans],
  );

  function openCreate() {
    setForm({
      ...emptyForm,
      sortOrder: String(plans.length),
    });
    setDialogOpen(true);
  }

  function openEdit(plan: AdminPlanView) {
    setForm(planToForm(plan));
    setDialogOpen(true);
  }

  async function savePlan() {
    if (!form.name.trim()) {
      toast.error("Plan name is required");
      return;
    }
    if (!form.dailyRoiPercent.trim() || !form.minDeposit.trim() || !form.durationDays.trim()) {
      toast.error("Daily ROI, minimum deposit, and duration are required");
      return;
    }

    const isEdit = Boolean(form.id);
    const slug = form.slug.trim() || slugifyName(form.name);
    if (!slug) {
      toast.error("Plan slug is required");
      return;
    }

    setLoading("save");
    try {
      const payload = formToPayload({ ...form, slug });
      const res = await fetch(isEdit ? `/api/hard/auth/plans/${form.id}` : "/api/hard/auth/plans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Failed to save plan");
      toast.success(isEdit ? "Plan updated" : "Plan created");
      setDialogOpen(false);
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save plan");
    } finally {
      setLoading(null);
    }
  }

  async function duplicate(id: string) {
    setLoading(id);
    try {
      const res = await fetch(`/api/hard/auth/plans/${id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "duplicate" }),
      });
      if (!res.ok) throw new Error("Duplicate failed");
      toast.success("Plan duplicated");
      router.refresh();
    } catch {
      toast.error("Failed to duplicate");
    } finally {
      setLoading(null);
    }
  }

  async function archive(id: string) {
    if (!window.confirm("Archive this plan? It will be hidden from customers.")) return;
    setLoading(id);
    try {
      const res = await fetch(`/api/hard/auth/plans/${id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "archive" }),
      });
      if (!res.ok) throw new Error("Archive failed");
      toast.success("Plan archived");
      router.refresh();
    } catch {
      toast.error("Failed to archive");
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          {sorted.length} plan{sorted.length === 1 ? "" : "s"} · Active plans appear on the homepage and deposit flow.
        </p>
        <Button onClick={openCreate} size="sm">
          <Plus className="mr-2 h-4 w-4" />
          Add new plan
        </Button>
      </div>

      {sorted.length === 0 ? (
        <EmptyState
          title="No investment plans"
          description="Create your first plan to show on the homepage and accept deposits."
        />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border">
          <Table>
            <TableHeader>
              <TableRow className="border-border hover:bg-transparent">
                <TableHead className="text-muted-foreground">Plan</TableHead>
                <TableHead className="text-muted-foreground">Daily ROI</TableHead>
                <TableHead className="text-muted-foreground">Min / Max</TableHead>
                <TableHead className="text-muted-foreground">Duration</TableHead>
                <TableHead className="text-muted-foreground">Status</TableHead>
                <TableHead className="text-right text-muted-foreground">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sorted.map((p) => (
                <TableRow key={p.id} className="border-border">
                  <TableCell>
                    <p className="font-medium">{p.name}</p>
                    <p className="text-xs text-muted-foreground">{p.slug}</p>
                  </TableCell>
                  <TableCell>{p.dailyRoiPercent}%</TableCell>
                  <TableCell className="text-sm">
                    {formatMoney(p.minDeposit)} / {p.maxDeposit ? formatMoney(p.maxDeposit) : "∞"}
                  </TableCell>
                  <TableCell>{p.durationDays}d</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      <Badge variant={p.isActive ? "default" : "outline"}>
                        {p.isActive ? "Active" : "Inactive"}
                      </Badge>
                      {p.isVisible ? <Badge variant="outline">Homepage</Badge> : null}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="sm" onClick={() => openEdit(p)}>
                        <Pencil className="mr-1 h-3.5 w-3.5" />
                        Edit
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={loading === p.id}
                        onClick={() => duplicate(p.id)}
                      >
                        Duplicate
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={loading === p.id}
                        onClick={() => archive(p.id)}
                      >
                        Archive
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{form.id ? "Edit investment plan" : "Add investment plan"}</DialogTitle>
          </DialogHeader>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="plan-name">Plan name</Label>
              <Input
                id="plan-name"
                value={form.name}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    name: e.target.value,
                    slug: f.id ? f.slug : slugifyName(e.target.value),
                  }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="plan-slug">Slug</Label>
              <Input
                id="plan-slug"
                value={form.slug}
                disabled={Boolean(form.id)}
                onChange={(e) => setForm((f) => ({ ...f, slug: slugifyName(e.target.value) }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="plan-sort">Sort order</Label>
              <Input
                id="plan-sort"
                type="number"
                value={form.sortOrder}
                onChange={(e) => setForm((f) => ({ ...f, sortOrder: e.target.value }))}
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="plan-desc">Description</Label>
              <Textarea
                id="plan-desc"
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                rows={2}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="plan-roi">Daily ROI %</Label>
              <Input
                id="plan-roi"
                value={form.dailyRoiPercent}
                onChange={(e) => setForm((f) => ({ ...f, dailyRoiPercent: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="plan-max-roi">Max ROI % (optional)</Label>
              <Input
                id="plan-max-roi"
                value={form.maxRoiPercent}
                onChange={(e) => setForm((f) => ({ ...f, maxRoiPercent: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="plan-min">Minimum deposit</Label>
              <Input
                id="plan-min"
                value={form.minDeposit}
                onChange={(e) => setForm((f) => ({ ...f, minDeposit: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="plan-max">Maximum deposit (blank = unlimited)</Label>
              <Input
                id="plan-max"
                value={form.maxDeposit}
                onChange={(e) => setForm((f) => ({ ...f, maxDeposit: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="plan-duration">Duration (days)</Label>
              <Input
                id="plan-duration"
                type="number"
                value={form.durationDays}
                onChange={(e) => setForm((f) => ({ ...f, durationDays: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="plan-lock">Lock period (days)</Label>
              <Input
                id="plan-lock"
                type="number"
                value={form.lockPeriodDays}
                onChange={(e) => setForm((f) => ({ ...f, lockPeriodDays: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="plan-referral">Referral commission %</Label>
              <Input
                id="plan-referral"
                value={form.referralCommissionPercent}
                onChange={(e) => setForm((f) => ({ ...f, referralCommissionPercent: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="plan-currency">Currency</Label>
              <Input
                id="plan-currency"
                value={form.currency}
                onChange={(e) => setForm((f) => ({ ...f, currency: e.target.value.toUpperCase() }))}
              />
            </div>
            <div className="flex flex-wrap gap-4 sm:col-span-2">
              <label className="flex items-center gap-2 text-sm">
                <Checkbox
                  checked={form.isActive}
                  onCheckedChange={(v) => setForm((f) => ({ ...f, isActive: Boolean(v) }))}
                />
                Active (available for deposits)
              </label>
              <label className="flex items-center gap-2 text-sm">
                <Checkbox
                  checked={form.isVisible}
                  onCheckedChange={(v) => setForm((f) => ({ ...f, isVisible: Boolean(v) }))}
                />
                Show on homepage
              </label>
              <label className="flex items-center gap-2 text-sm">
                <Checkbox
                  checked={form.reinvestEnabled}
                  onCheckedChange={(v) => setForm((f) => ({ ...f, reinvestEnabled: Boolean(v) }))}
                />
                Reinvest enabled
              </label>
              <label className="flex items-center gap-2 text-sm">
                <Checkbox
                  checked={form.compounding}
                  onCheckedChange={(v) => setForm((f) => ({ ...f, compounding: Boolean(v) }))}
                />
                Compounding
              </label>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={savePlan} disabled={loading === "save"}>
              {loading === "save" ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {form.id ? "Save changes" : "Create plan"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
