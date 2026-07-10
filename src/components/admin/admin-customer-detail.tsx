"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ExternalLink, Loader2, UserRound } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatMoney } from "@/lib/utils/money";
import type { CustomerDetail } from "@/lib/services/customer-admin.service";
import { toast } from "sonner";

const REASON_REQUIRED = new Set(["suspend", "disable_login", "lock"]);

type ActionDef = {
  type: string;
  label: string;
  variant?: "outline" | "destructive";
  confirm?: string;
};

const ACTIONS: ActionDef[] = [
  { type: "suspend", label: "Suspend", variant: "destructive", confirm: "Suspend this customer account?" },
  { type: "activate", label: "Activate", confirm: "Activate this customer account?" },
  { type: "disable_login", label: "Disable login", variant: "destructive", confirm: "Disable login for this customer?" },
  { type: "enable_login", label: "Enable login", confirm: "Re-enable login for this customer?" },
  { type: "lock", label: "Lock account", variant: "destructive", confirm: "Lock this account for 30 days?" },
  { type: "unlock", label: "Unlock account", confirm: "Clear account lockouts?" },
  { type: "force_verify", label: "Force verify email", confirm: "Mark email as verified?" },
  { type: "reset_password", label: "Reset password", confirm: "Generate a password reset link?" },
];

export function AdminCustomerDetail({ customer }: { customer: CustomerDetail }) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);
  const [reason, setReason] = useState("");
  const [note, setNote] = useState("");
  const [resetLink, setResetLink] = useState<string | null>(null);
  const [ledgerAmount, setLedgerAmount] = useState("");
  const [ledgerReason, setLedgerReason] = useState("");
  const [ledgerAccount, setLedgerAccount] = useState("available");

  async function runAction(type: string, extra: Record<string, string> = {}) {
    const actionReason = extra.reason ?? reason.trim();
    if (REASON_REQUIRED.has(type) && !actionReason) {
      toast.error("Enter a reason before performing this action");
      return;
    }

    setLoading(type);
    try {
      const res = await fetch(`/api/hard/auth/customers/${customer.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ action: type, reason: actionReason, ...extra }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(typeof data.error === "string" ? data.error : "Action failed");
      }

      if (type === "reset_password" && data.resetLink) {
        setResetLink(data.resetLink);
        toast.success("Password reset link generated");
      } else if (type === "add_note") {
        setNote("");
        toast.success("Note saved");
      } else if (type === "fund" || type === "debit") {
        setLedgerAmount("");
        setLedgerReason("");
        toast.success(type === "fund" ? "Funds credited" : "Funds debited");
      } else {
        toast.success("Action completed");
      }

      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Action failed");
    } finally {
      setLoading(null);
    }
  }

  function handleLedgerAction(action: "fund" | "debit") {
    if (!ledgerAmount.trim() || Number(ledgerAmount) <= 0) {
      toast.error("Enter a valid amount");
      return;
    }
    if (!ledgerReason.trim()) {
      toast.error("Enter a reason for the ledger adjustment");
      return;
    }
    const label = action === "fund" ? "Credit" : "Debit";
    if (!window.confirm(`${label} ${ledgerAmount} to ${ledgerAccount} balance?`)) return;
    void runAction(action, {
      amount: ledgerAmount.trim(),
      reason: ledgerReason.trim(),
      accountType: ledgerAccount,
    });
  }

  function handleAction(def: ActionDef) {
    if (def.confirm && !window.confirm(def.confirm)) return;
    void runAction(def.type);
  }

  function accessAccount() {
    const url = `/hard/auth/impersonate/${customer.id}`;
    const tab = window.open(url, "_blank");
    if (!tab) {
      toast.error("Allow pop-ups to open the customer dashboard in a new tab");
      return;
    }
    toast.success("Opening customer dashboard in a new tab");
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{customer.fullName}</h1>
          <p className="text-muted-foreground">{customer.email} · @{customer.username}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            size="sm"
            className="bg-amber-500 text-slate-950 hover:bg-amber-400"
            disabled={!!loading || customer.loginDisabled}
            onClick={accessAccount}
          >
            {loading === "impersonate" ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <UserRound className="mr-2 h-4 w-4" />
            )}
            Access account
            <ExternalLink className="ml-2 h-3.5 w-3.5 opacity-70" aria-hidden />
          </Button>
          <Badge variant="outline" className="capitalize">
            {customer.loginDisabled ? "login disabled" : customer.status.replace("_", " ")}
          </Badge>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground">Available</p>
          <p className="text-xl font-semibold">{formatMoney(customer.wallet.availableBalance)}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground">Invested</p>
          <p className="text-xl font-semibold">{formatMoney(customer.wallet.lockedBalance)}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground">Referral earnings</p>
          <p className="text-xl font-semibold">{formatMoney(customer.referralEarnings)}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground">Active investments</p>
          <p className="text-xl font-semibold">{customer.activeInvestments}</p>
        </div>
      </div>

      <div className="rounded-xl border border-amber-500/30 bg-card p-6 space-y-4">
        <h2 className="font-semibold text-amber-400">Fund or debit balance</h2>
        <p className="text-sm text-muted-foreground">
          Posts a ledger correction with audit trail. Reason is required.
        </p>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <Label htmlFor="ledger-amount">Amount</Label>
            <Input
              id="ledger-amount"
              type="number"
              min="0"
              step="0.01"
              value={ledgerAmount}
              onChange={(e) => setLedgerAmount(e.target.value)}
              placeholder="0.00"
            />
          </div>
          <div>
            <Label>Account</Label>
            <Select
              value={ledgerAccount}
              onValueChange={(v) => setLedgerAccount(v ?? "available")}
            >
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="available">Available</SelectItem>
                <SelectItem value="invested">Invested</SelectItem>
                <SelectItem value="referral">Referral</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="sm:col-span-2">
            <Label htmlFor="ledger-reason">Reason</Label>
            <Input
              id="ledger-reason"
              value={ledgerReason}
              onChange={(e) => setLedgerReason(e.target.value)}
              placeholder="Reason for adjustment…"
            />
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            size="sm"
            className="bg-emerald-600 text-white hover:bg-emerald-500"
            disabled={!!loading}
            onClick={() => handleLedgerAction("fund")}
          >
            {loading === "fund" ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Fund
          </Button>
          <Button
            size="sm"
            variant="destructive"
            disabled={!!loading}
            onClick={() => handleLedgerAction("debit")}
          >
            {loading === "debit" ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Debit
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-4 rounded-xl border border-border bg-card p-6">
          <h2 className="font-semibold">Administrative actions</h2>
          <div>
            <Label htmlFor="reason">Reason (required for suspend, disable login, lock)</Label>
            <Input
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Brief reason for audit log…"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {ACTIONS.map((def) => (
              <Button
                key={def.type}
                variant={def.variant ?? "outline"}
                size="sm"
                disabled={!!loading}
                onClick={() => handleAction(def)}
              >
                {loading === def.type ? <Loader2 className="h-4 w-4 animate-spin" /> : def.label}
              </Button>
            ))}
          </div>
          {resetLink ? (
            <div className="rounded-lg border border-border bg-muted/30 p-3 text-xs">
              <p className="font-medium text-foreground">Password reset link</p>
              <p className="mt-1 break-all text-muted-foreground">{resetLink}</p>
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="mt-2"
                onClick={() => {
                  void navigator.clipboard.writeText(resetLink);
                  toast.success("Reset link copied");
                }}
              >
                Copy link
              </Button>
            </div>
          ) : null}
        </div>

        <div className="space-y-4 rounded-xl border border-border bg-card p-6">
          <h2 className="font-semibold">Add note</h2>
          <Textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="Internal note…" />
          <Button
            size="sm"
            disabled={!!loading || !note.trim()}
            onClick={() => runAction("add_note", { content: note })}
          >
            {loading === "add_note" ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Save note
          </Button>
          {customer.notes.length ? (
            <ul className="max-h-40 space-y-2 overflow-y-auto text-sm">
              {customer.notes.map((n) => (
                <li key={n.id} className="border-l-2 border-input pl-3">
                  <p>{n.content}</p>
                  <p className="text-xs text-muted-foreground">{new Date(n.createdAt).toLocaleString()}</p>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-border bg-card p-6">
          <h2 className="mb-4 font-semibold">Referral tree</h2>
          {customer.referredBy ? (
            <p className="mb-2 text-sm text-muted-foreground">
              Referred by: {customer.referredBy.fullName} ({customer.referredBy.email})
            </p>
          ) : null}
          <p className="mb-2 text-xs text-muted-foreground">Code: {customer.referralCode}</p>
          {customer.referrals.length ? (
            <ul className="space-y-1 text-sm">
              {customer.referrals.map((r) => (
                <li key={r.profileId}>
                  <Link href={`/hard/auth/customers/${r.profileId}`} className="text-primary hover:underline">
                    {r.fullName}
                  </Link>
                  <span className="text-muted-foreground"> · {new Date(r.createdAt).toLocaleDateString()}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">No direct referrals.</p>
          )}
        </div>

        <div className="rounded-xl border border-border bg-card p-6">
          <h2 className="mb-4 font-semibold">Risk events</h2>
          {customer.riskEvents.length ? (
            <ul className="space-y-2 text-sm">
              {customer.riskEvents.map((r) => (
                <li key={r.id} className="flex justify-between">
                  <span>{r.title}</span>
                  <Badge variant="outline" className="capitalize">
                    {r.severity}
                  </Badge>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">No risk events.</p>
          )}
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card p-6">
        <h2 className="mb-4 font-semibold">Login history</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-muted-foreground">
                <th className="pb-2">Time</th>
                <th className="pb-2">IP</th>
                <th className="pb-2">Result</th>
              </tr>
            </thead>
            <tbody>
              {customer.loginHistory.map((l) => (
                <tr key={l.id} className="border-t border-border">
                  <td className="py-2">{new Date(l.createdAt).toLocaleString()}</td>
                  <td className="py-2 font-mono text-xs">{l.ipAddress ?? "—"}</td>
                  <td className="py-2">{l.success ? "Success" : "Failed"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Link href="/hard/auth/customers" className={buttonVariants({ variant: "outline" })}>
        Back to customers
      </Link>
    </div>
  );
}
