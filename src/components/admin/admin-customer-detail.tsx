"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2, UserRound } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { formatMoney } from "@/lib/utils/money";
import type { CustomerDetail } from "@/lib/services/customer-admin.service";
import { toast } from "sonner";

export function AdminCustomerDetail({ customer }: { customer: CustomerDetail }) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);
  const [reason, setReason] = useState("");
  const [note, setNote] = useState("");
  const [resetLink, setResetLink] = useState<string | null>(null);

  async function action(type: string, extra: Record<string, string> = {}) {
    setLoading(type);
    try {
      const res = await fetch(`/api/hard/auth/customers/${customer.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: type, reason, ...extra }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Action failed");
      if (type === "reset_password" && data.resetLink) {
        setResetLink(data.resetLink);
      }
      toast.success("Action completed");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Action failed");
    } finally {
      setLoading(null);
    }
  }

  async function accessAccount() {
    setLoading("impersonate");
    try {
      const res = await fetch("/api/hard/auth/impersonate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profileId: customer.id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Unable to access account");
      router.push(data.redirectTo ?? "/dashboard");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Unable to access account");
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{customer.fullName}</h1>
          <p className="text-slate-400">{customer.email} · @{customer.username}</p>
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
          </Button>
          <Badge variant="outline" className="capitalize">
            {customer.loginDisabled ? "login disabled" : customer.status.replace("_", " ")}
          </Badge>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-slate-800 bg-slate-900 p-4">
          <p className="text-xs text-slate-400">Available</p>
          <p className="text-xl font-semibold">{formatMoney(customer.wallet.availableBalance)}</p>
        </div>
        <div className="rounded-xl border border-slate-800 bg-slate-900 p-4">
          <p className="text-xs text-slate-400">Invested</p>
          <p className="text-xl font-semibold">{formatMoney(customer.wallet.lockedBalance)}</p>
        </div>
        <div className="rounded-xl border border-slate-800 bg-slate-900 p-4">
          <p className="text-xs text-slate-400">Referral earnings</p>
          <p className="text-xl font-semibold">{formatMoney(customer.referralEarnings)}</p>
        </div>
        <div className="rounded-xl border border-slate-800 bg-slate-900 p-4">
          <p className="text-xs text-slate-400">Active investments</p>
          <p className="text-xl font-semibold">{customer.activeInvestments}</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-slate-800 bg-slate-900 p-6 space-y-4">
          <h2 className="font-semibold">Administrative actions</h2>
          <div>
            <Label htmlFor="reason">Reason (required for status changes)</Label>
            <Input id="reason" value={reason} onChange={(e) => setReason(e.target.value)} />
          </div>
          <div className="flex flex-wrap gap-2">
            {[
              ["suspend", "Suspend"],
              ["activate", "Activate"],
              ["disable_login", "Disable login"],
              ["enable_login", "Enable login"],
              ["lock", "Lock account"],
              ["unlock", "Unlock account"],
              ["force_verify", "Force verify email"],
              ["reset_password", "Reset password"],
            ].map(([type, label]) => (
              <Button
                key={type}
                variant="outline"
                size="sm"
                disabled={!!loading}
                onClick={() => action(type)}
              >
                {loading === type ? <Loader2 className="h-4 w-4 animate-spin" /> : label}
              </Button>
            ))}
          </div>
          {resetLink ? (
            <p className="text-xs text-slate-400 break-all">Reset link: {resetLink}</p>
          ) : null}
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900 p-6 space-y-4">
          <h2 className="font-semibold">Add note</h2>
          <Textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="Internal note…" />
          <Button
            size="sm"
            disabled={!!loading || !note.trim()}
            onClick={() => action("add_note", { content: note })}
          >
            Save note
          </Button>
          {customer.notes.length ? (
            <ul className="space-y-2 text-sm max-h-40 overflow-y-auto">
              {customer.notes.map((n) => (
                <li key={n.id} className="border-l-2 border-slate-700 pl-3">
                  <p>{n.content}</p>
                  <p className="text-xs text-slate-500">{new Date(n.createdAt).toLocaleString()}</p>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-slate-800 bg-slate-900 p-6">
          <h2 className="mb-4 font-semibold">Referral tree</h2>
          {customer.referredBy ? (
            <p className="text-sm text-slate-400 mb-2">
              Referred by: {customer.referredBy.fullName} ({customer.referredBy.email})
            </p>
          ) : null}
          <p className="text-xs text-slate-500 mb-2">Code: {customer.referralCode}</p>
          {customer.referrals.length ? (
            <ul className="space-y-1 text-sm">
              {customer.referrals.map((r) => (
                <li key={r.profileId}>
                  <Link href={`/hard/auth/customers/${r.profileId}`} className="text-blue-400 hover:underline">
                    {r.fullName}
                  </Link>
                  <span className="text-slate-500"> · {new Date(r.createdAt).toLocaleDateString()}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-slate-400 text-sm">No direct referrals.</p>
          )}
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900 p-6">
          <h2 className="mb-4 font-semibold">Risk events</h2>
          {customer.riskEvents.length ? (
            <ul className="space-y-2 text-sm">
              {customer.riskEvents.map((r) => (
                <li key={r.id} className="flex justify-between">
                  <span>{r.title}</span>
                  <Badge variant="outline" className="capitalize">{r.severity}</Badge>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-slate-400 text-sm">No risk events.</p>
          )}
        </div>
      </div>

      <div className="rounded-xl border border-slate-800 bg-slate-900 p-6">
        <h2 className="mb-4 font-semibold">Login history</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-slate-400 text-left">
                <th className="pb-2">Time</th>
                <th className="pb-2">IP</th>
                <th className="pb-2">Result</th>
              </tr>
            </thead>
            <tbody>
              {customer.loginHistory.map((l) => (
                <tr key={l.id} className="border-t border-slate-800">
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
