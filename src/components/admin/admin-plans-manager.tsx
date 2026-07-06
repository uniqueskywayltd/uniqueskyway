"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { AdminPlanView } from "@/lib/services/investment-plan.service";
import { toast } from "sonner";
import { formatMoney } from "@/lib/utils/money";

export function AdminPlansManager({ plans }: { plans: AdminPlanView[] }) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);

  async function toggle(id: string, field: "isActive" | "isVisible", value: boolean) {
    setLoading(id);
    try {
      const res = await fetch(`/api/admin/plans/${id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [field]: value }),
      });
      if (!res.ok) throw new Error("Update failed");
      toast.success("Plan updated");
      router.refresh();
    } catch {
      toast.error("Failed to update plan");
    } finally {
      setLoading(null);
    }
  }

  async function duplicate(id: string) {
    setLoading(id);
    try {
      const res = await fetch(`/api/admin/plans/${id}`, {
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

  return (
    <div className="overflow-x-auto rounded-xl border border-slate-800">
      <Table>
        <TableHeader>
          <TableRow className="border-slate-800 hover:bg-transparent">
            <TableHead className="text-slate-400">Plan</TableHead>
            <TableHead className="text-slate-400">Daily ROI</TableHead>
            <TableHead className="text-slate-400">Min / Max</TableHead>
            <TableHead className="text-slate-400">Duration</TableHead>
            <TableHead className="text-slate-400">Status</TableHead>
            <TableHead />
          </TableRow>
        </TableHeader>
        <TableBody>
          {plans.map((p) => (
            <TableRow key={p.id} className="border-slate-800">
              <TableCell>
                <p className="font-medium">{p.name}</p>
                <p className="text-xs text-slate-400">{p.slug}</p>
              </TableCell>
              <TableCell>{p.dailyRoiPercent}%</TableCell>
              <TableCell className="text-sm">
                {formatMoney(p.minDeposit)} / {p.maxDeposit ? formatMoney(p.maxDeposit) : "∞"}
              </TableCell>
              <TableCell>{p.durationDays}d</TableCell>
              <TableCell>
                <div className="flex gap-1">
                  <Badge variant={p.isActive ? "default" : "outline"}>
                    {p.isActive ? "Active" : "Inactive"}
                  </Badge>
                  {p.isVisible ? <Badge variant="outline">Visible</Badge> : null}
                </div>
              </TableCell>
              <TableCell>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={loading === p.id}
                    onClick={() => toggle(p.id, "isActive", !p.isActive)}
                  >
                    {loading === p.id ? <Loader2 className="h-3 w-3 animate-spin" /> : p.isActive ? "Deactivate" : "Activate"}
                  </Button>
                  <Button variant="ghost" size="sm" disabled={loading === p.id} onClick={() => duplicate(p.id)}>
                    Duplicate
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
