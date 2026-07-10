"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Pin, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { ActivityFeedConfig, ActivityFeedItem } from "@/lib/constants/trust-components";
import { toast } from "sonner";

type Props = {
  items: ActivityFeedItem[];
  config: ActivityFeedConfig;
  realActivityCount: number;
};

export function AdminActivityFeedManager({ items, config, realActivityCount }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);
  const [cfg, setCfg] = useState(config);
  const [form, setForm] = useState({
    type: "announcement",
    title: "",
    customerNameMasked: "",
    country: "",
    amount: "",
    investmentPlan: "",
    priority: "100",
  });

  async function saveConfig() {
    setLoading("config");
    try {
      const res = await fetch("/api/hard/auth/activity-feed", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "update_config", config: cfg }),
      });
      if (!res.ok) throw new Error();
      toast.success("Activity feed settings saved");
      router.refresh();
    } catch {
      toast.error("Failed to save settings");
    } finally {
      setLoading(null);
    }
  }

  async function createItem() {
    setLoading("create");
    try {
      const res = await fetch("/api/hard/auth/activity-feed", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: form.type,
          title: form.title || null,
          customerNameMasked: form.customerNameMasked || null,
          country: form.country || null,
          amount: form.amount || null,
          investmentPlan: form.investmentPlan || null,
          priority: Number(form.priority) || 0,
          isVisible: true,
        }),
      });
      if (!res.ok) throw new Error();
      toast.success("Activity item created");
      router.refresh();
    } catch {
      toast.error("Failed to create item");
    } finally {
      setLoading(null);
    }
  }

  async function patchItem(id: string, patch: Record<string, unknown>) {
    setLoading(id);
    try {
      const res = await fetch(`/api/hard/auth/activity-feed/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      if (!res.ok) throw new Error();
      toast.success("Updated");
      router.refresh();
    } catch {
      toast.error("Update failed");
    } finally {
      setLoading(null);
    }
  }

  async function deleteItem(id: string) {
    setLoading(id);
    try {
      const res = await fetch(`/api/hard/auth/activity-feed/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      toast.success("Deleted");
      router.refresh();
    } catch {
      toast.error("Delete failed");
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="space-y-8">
      <div className="rounded-xl border border-border bg-card p-5">
        <h2 className="font-semibold">Display settings</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Real activities detected: <span className="text-foreground">{realActivityCount}</span>
        </p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <Label htmlFor="displayMs">Display duration (ms)</Label>
            <Input
              id="displayMs"
              type="number"
              value={cfg.displayDurationMs}
              onChange={(e) =>
                setCfg({ ...cfg, displayDurationMs: Number(e.target.value) || 120_000 })
              }
              className="mt-1.5 border-input bg-background"
            />
            <p className="mt-1 text-xs text-muted-foreground">Default 120000 (2 minutes)</p>
          </div>
          <div>
            <Label htmlFor="initialDelayMs">Initial delay (ms)</Label>
            <Input
              id="initialDelayMs"
              type="number"
              value={cfg.initialDelayMs ?? 120_000}
              onChange={(e) =>
                setCfg({ ...cfg, initialDelayMs: Number(e.target.value) || 120_000 })
              }
              className="mt-1.5 border-input bg-background"
            />
            <p className="mt-1 text-xs text-muted-foreground">Wait before first pop-up (2 min)</p>
          </div>
          <div>
            <Label htmlFor="nameCooldownMs">Name cooldown (ms)</Label>
            <Input
              id="nameCooldownMs"
              type="number"
              value={cfg.nameCooldownMs ?? 3_600_000}
              onChange={(e) =>
                setCfg({ ...cfg, nameCooldownMs: Number(e.target.value) || 3_600_000 })
              }
              className="mt-1.5 border-input bg-background"
            />
            <p className="mt-1 text-xs text-muted-foreground">Same person reappears after 1 hour</p>
          </div>
          <div>
            <Label htmlFor="animMs">Animation speed (ms)</Label>
            <Input
              id="animMs"
              type="number"
              value={cfg.animationSpeedMs}
              onChange={(e) =>
                setCfg({ ...cfg, animationSpeedMs: Number(e.target.value) || 400 })
              }
              className="mt-1.5 border-input bg-background"
            />
          </div>
          <div>
            <Label htmlFor="maxHistory">Maximum visible history</Label>
            <Input
              id="maxHistory"
              type="number"
              value={cfg.maxVisibleHistory}
              onChange={(e) =>
                setCfg({ ...cfg, maxVisibleHistory: Number(e.target.value) || 50 })
              }
              className="mt-1.5 border-input bg-background"
            />
          </div>
          <div>
            <Label htmlFor="minReal">Min real activity before hiding seed</Label>
            <Input
              id="minReal"
              type="number"
              value={cfg.minimumRealActivityBeforeDisablingSeedData}
              onChange={(e) =>
                setCfg({
                  ...cfg,
                  minimumRealActivityBeforeDisablingSeedData: Number(e.target.value) || 25,
                })
              }
              className="mt-1.5 border-input bg-background"
            />
          </div>
          <div className="flex items-end">
            <label className="flex items-center gap-2 text-sm text-foreground/80">
              <input
                type="checkbox"
                checked={cfg.seedEnabled}
                onChange={(e) => setCfg({ ...cfg, seedEnabled: e.target.checked })}
              />
              Seeded data enabled (config)
            </label>
          </div>
        </div>
        <Button className="mt-4" onClick={saveConfig} disabled={loading === "config"}>
          {loading === "config" ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          Save settings
        </Button>
      </div>

      <div className="rounded-xl border border-border bg-card p-5">
        <h2 className="font-semibold">Add manual / pinned item</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <Label>Type</Label>
            <select
              className="mt-1.5 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value })}
            >
              <option value="announcement">Announcement</option>
              <option value="registration">Registration</option>
              <option value="deposit">Deposit</option>
              <option value="withdrawal">Withdrawal</option>
              <option value="investment">Investment</option>
            </select>
          </div>
          <div>
            <Label>Title / headline</Label>
            <Input
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="mt-1.5 border-input bg-background"
            />
          </div>
          <div>
            <Label>Masked name</Label>
            <Input
              value={form.customerNameMasked}
              onChange={(e) => setForm({ ...form, customerNameMasked: e.target.value })}
              placeholder="John A."
              className="mt-1.5 border-input bg-background"
            />
          </div>
          <div>
            <Label>Location</Label>
            <Input
              value={form.country}
              onChange={(e) => setForm({ ...form, country: e.target.value })}
              placeholder="Texas, USA"
              className="mt-1.5 border-input bg-background"
            />
          </div>
          <div>
            <Label>Amount</Label>
            <Input
              value={form.amount}
              onChange={(e) => setForm({ ...form, amount: e.target.value })}
              className="mt-1.5 border-input bg-background"
            />
          </div>
          <div>
            <Label>Priority (100+ pins)</Label>
            <Input
              value={form.priority}
              onChange={(e) => setForm({ ...form, priority: e.target.value })}
              className="mt-1.5 border-input bg-background"
            />
          </div>
        </div>
        <Button className="mt-4" onClick={createItem} disabled={loading === "create"}>
          {loading === "create" ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          Add item
        </Button>
      </div>

      <div className="rounded-xl border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow className="border-border hover:bg-transparent">
              <TableHead>Type</TableHead>
              <TableHead>Summary</TableHead>
              <TableHead>Source</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item) => (
              <TableRow key={item.id} className="border-border">
                <TableCell className="font-mono text-xs">{item.type}</TableCell>
                <TableCell className="text-sm">
                  {item.customerNameMasked ?? item.title ?? "—"}
                  {item.amount ? ` · $${item.amount}` : ""}
                </TableCell>
                <TableCell>
                  <Badge variant={item.isSeed ? "outline" : "default"}>
                    {item.isSeed ? "Seed" : "Manual"}
                  </Badge>
                </TableCell>
                <TableCell>
                  {item.isPinned ? (
                    <Badge className="gap-1">
                      <Pin className="h-3 w-3" /> Pinned
                    </Badge>
                  ) : (
                    <span className="text-muted-foreground">Normal</span>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={loading === item.id}
                      onClick={() => patchItem(item.id, { priority: item.isPinned ? 0 : 100 })}
                    >
                      {item.isPinned ? "Unpin" : "Pin"}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={loading === item.id}
                      onClick={() => patchItem(item.id, { isVisible: false })}
                    >
                      Hide
                    </Button>
                    {!item.id.startsWith("real-") ? (
                      <Button
                        size="sm"
                        variant="destructive"
                        disabled={loading === item.id}
                        onClick={() => deleteItem(item.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    ) : null}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
