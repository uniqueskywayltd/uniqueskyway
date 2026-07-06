"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatMoney } from "@/lib/utils/money";
import type { LedgerEntryView } from "@/lib/services/ledger-admin.service";
import { toast } from "sonner";

export function AdminLedgerExplorer({
  initialEntries,
}: {
  initialEntries: LedgerEntryView[];
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [correction, setCorrection] = useState({
    profileId: "",
    accountType: "available",
    direction: "credit",
    amount: "",
    reason: "",
  });

  async function submitCorrection() {
    setLoading(true);
    try {
      const res = await fetch("/api/hard/auth/ledger", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(correction),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Correction failed");
      toast.success("Ledger correction posted");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Correction failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-8">
      <div className="rounded-xl border border-slate-800 bg-slate-900 p-6 space-y-4">
        <h2 className="font-semibold text-amber-400">Manual ledger correction (restricted)</h2>
        <p className="text-sm text-slate-400">
          Requires reason and creates immutable audit trail. Use only for verified corrections.
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <Label>Profile ID</Label>
            <Input
              value={correction.profileId}
              onChange={(e) => setCorrection({ ...correction, profileId: e.target.value })}
            />
          </div>
          <div>
            <Label>Amount</Label>
            <Input
              value={correction.amount}
              onChange={(e) => setCorrection({ ...correction, amount: e.target.value })}
            />
          </div>
          <div>
            <Label>Account</Label>
            <Select
              value={correction.accountType}
              onValueChange={(v) => setCorrection({ ...correction, accountType: v ?? "available" })}
            >
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="available">Available</SelectItem>
                <SelectItem value="invested">Invested</SelectItem>
                <SelectItem value="referral">Referral</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Direction</Label>
            <Select
              value={correction.direction}
              onValueChange={(v) => setCorrection({ ...correction, direction: v ?? "credit" })}
            >
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="credit">Credit</SelectItem>
                <SelectItem value="debit">Debit</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div>
          <Label>Reason (required)</Label>
          <Textarea
            value={correction.reason}
            onChange={(e) => setCorrection({ ...correction, reason: e.target.value })}
          />
        </div>
        <Button
          variant="destructive"
          size="sm"
          disabled={loading || !correction.reason.trim() || !correction.profileId}
          onClick={submitCorrection}
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Post correction"}
        </Button>
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-800">
        <Table>
          <TableHeader>
            <TableRow className="border-slate-800 hover:bg-transparent">
              <TableHead className="text-slate-400">Date</TableHead>
              <TableHead className="text-slate-400">Customer</TableHead>
              <TableHead className="text-slate-400">Type</TableHead>
              <TableHead className="text-slate-400">Amount</TableHead>
              <TableHead className="text-slate-400">Description</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {initialEntries.map((e) => (
              <TableRow key={e.id} className="border-slate-800">
                <TableCell className="text-sm">{new Date(e.createdAt).toLocaleString()}</TableCell>
                <TableCell>{e.customerName}</TableCell>
                <TableCell className="capitalize text-xs">{e.entryType.replace(/_/g, " ")}</TableCell>
                <TableCell className={e.direction === "credit" ? "text-emerald-400" : "text-red-400"}>
                  {e.direction === "credit" ? "+" : "-"}{formatMoney(e.amount)}
                </TableCell>
                <TableCell className="text-slate-400 text-sm max-w-[200px] truncate">
                  {e.description ?? e.idempotencyKey}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
