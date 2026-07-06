"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatMoney } from "@/lib/utils/money";
import type { AdminInvestmentDetail } from "@/lib/services/investment-admin.service";
import { toast } from "sonner";

export function AdminInvestmentDetail({ investment }: { investment: AdminInvestmentDetail }) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);
  const [adjustAmount, setAdjustAmount] = useState("");
  const [adjustDirection, setAdjustDirection] = useState<"credit" | "debit">("credit");
  const [adjustReason, setAdjustReason] = useState("");

  async function action(type: "pause" | "resume" | "force_maturity" | "manual_adjustment") {
    setLoading(type);
    try {
      const body: Record<string, string> = { action: type };
      if (type === "manual_adjustment") {
        body.amount = adjustAmount;
        body.direction = adjustDirection;
        body.reason = adjustReason;
      }

      const res = await fetch(`/api/admin/investments/${investment.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Action failed");

      toast.success(
        type === "pause"
          ? "Investment paused"
          : type === "resume"
            ? "Investment resumed"
            : type === "force_maturity"
              ? "Investment force-matured"
              : "Manual adjustment applied",
      );
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Action failed");
    } finally {
      setLoading(null);
    }
  }

  const preview = investment.roiPreview;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{investment.planName}</h1>
          <p className="text-slate-400">{investment.customerEmail}</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="capitalize">
            {investment.status}
          </Badge>
          {investment.isPaused ? <Badge variant="destructive">Paused</Badge> : null}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-slate-800 bg-slate-900 p-4">
          <p className="text-xs text-slate-400">Principal</p>
          <p className="text-xl font-semibold">{formatMoney(investment.principalAmount)}</p>
        </div>
        <div className="rounded-xl border border-slate-800 bg-slate-900 p-4">
          <p className="text-xs text-slate-400">ROI credited</p>
          <p className="text-xl font-semibold">{formatMoney(investment.totalRoiCredited)}</p>
        </div>
        <div className="rounded-xl border border-slate-800 bg-slate-900 p-4">
          <p className="text-xs text-slate-400">Daily earnings</p>
          <p className="text-xl font-semibold">{formatMoney(preview.dailyEarnings)}</p>
        </div>
        <div className="rounded-xl border border-slate-800 bg-slate-900 p-4">
          <p className="text-xs text-slate-400">Progress</p>
          <p className="text-xl font-semibold">{preview.progressPercent}%</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-slate-800 bg-slate-900 p-6 space-y-3 text-sm">
          <h2 className="font-semibold">Position details</h2>
          <div className="flex justify-between">
            <span className="text-slate-400">Customer</span>
            <span>{investment.customerName}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Started</span>
            <span>
              {investment.startedAt ? new Date(investment.startedAt).toLocaleDateString() : "—"}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Matures</span>
            <span>
              {investment.maturesAt ? new Date(investment.maturesAt).toLocaleDateString() : "—"}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Next accrual</span>
            <span>{preview.nextAccrualDate ?? "—"}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Est. maturity value</span>
            <span>{formatMoney(preview.estimatedMaturityValue)}</span>
          </div>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900 p-6 space-y-4">
          <h2 className="font-semibold">Admin actions</h2>
          <div className="flex flex-wrap gap-2">
            {investment.status === "active" && !investment.isPaused ? (
              <Button
                variant="outline"
                size="sm"
                disabled={!!loading}
                onClick={() => action("pause")}
              >
                {loading === "pause" ? <Loader2 className="h-4 w-4 animate-spin" /> : "Pause"}
              </Button>
            ) : null}
            {investment.isPaused ? (
              <Button
                variant="outline"
                size="sm"
                disabled={!!loading}
                onClick={() => action("resume")}
              >
                {loading === "resume" ? <Loader2 className="h-4 w-4 animate-spin" /> : "Resume"}
              </Button>
            ) : null}
            {investment.status === "active" ? (
              <Button
                variant="destructive"
                size="sm"
                disabled={!!loading}
                onClick={() => action("force_maturity")}
              >
                {loading === "force_maturity" ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Force maturity"
                )}
              </Button>
            ) : null}
          </div>

          <div className="space-y-3 border-t border-slate-800 pt-4">
            <p className="text-xs text-slate-400">Manual adjustment (audit required)</p>
            <div className="grid gap-2 sm:grid-cols-2">
              <div>
                <Label htmlFor="amount">Amount</Label>
                <Input
                  id="amount"
                  value={adjustAmount}
                  onChange={(e) => setAdjustAmount(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="direction">Direction</Label>
                <Select
                  value={adjustDirection}
                  onValueChange={(v) => setAdjustDirection(v as "credit" | "debit")}
                >
                  <SelectTrigger id="direction">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="credit">Credit</SelectItem>
                    <SelectItem value="debit">Debit</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label htmlFor="reason">Reason</Label>
              <Textarea
                id="reason"
                value={adjustReason}
                onChange={(e) => setAdjustReason(e.target.value)}
                placeholder="Required for audit trail"
              />
            </div>
            <Button
              size="sm"
              disabled={!!loading || !adjustAmount || !adjustReason.trim()}
              onClick={() => action("manual_adjustment")}
            >
              {loading === "manual_adjustment" ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Apply adjustment"
              )}
            </Button>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-slate-800 bg-slate-900 p-6">
          <h2 className="mb-4 font-semibold">Activity timeline</h2>
          {investment.timeline.length ? (
            <ul className="space-y-3">
              {investment.timeline.map((event) => (
                <li key={event.id} className="border-l-2 border-slate-700 pl-4 text-sm">
                  <p className="font-medium">{event.title}</p>
                  <p className="text-slate-400">{event.description}</p>
                  <p className="text-xs text-slate-500">
                    {new Date(event.createdAt).toLocaleString()}
                  </p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-slate-400 text-sm">No events recorded yet.</p>
          )}
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900 p-6">
          <h2 className="mb-4 font-semibold">ROI history</h2>
          {investment.roiHistory.length ? (
            <ul className="space-y-2 text-sm max-h-80 overflow-y-auto">
              {investment.roiHistory.map((entry) => (
                <li key={entry.id} className="flex justify-between border-b border-slate-800 pb-2">
                  <span className="text-slate-400">
                    {new Date(entry.createdAt).toLocaleDateString()}
                  </span>
                  <span className="font-medium text-emerald-400">
                    +{formatMoney(entry.amount)}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-slate-400 text-sm">No ROI accruals yet.</p>
          )}
        </div>
      </div>

      <Link href="/admin/investments" className={buttonVariants({ variant: "outline" })}>
        Back to investments
      </Link>
    </div>
  );
}
