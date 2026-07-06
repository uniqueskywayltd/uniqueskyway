"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { formatMoney } from "@/lib/utils/money";
import type { DepositView } from "@/lib/services/deposit.service";
import { toast } from "sonner";

export function AdminDepositDetail({ deposit }: { deposit: DepositView }) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [infoMessage, setInfoMessage] = useState("");
  const [notes, setNotes] = useState(deposit.internalNotes ?? "");

  async function action(type: "approve" | "reject" | "request_info") {
    setLoading(type);
    try {
      const body: Record<string, string> = { action: type };
      if (type === "reject") body.reason = rejectReason;
      if (type === "request_info") body.message = infoMessage;
      if (notes) body.internalNotes = notes;

      const res = await fetch(`/api/hard/auth/deposits/${deposit.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Action failed");

      toast.success(
        type === "approve"
          ? "Deposit approved and investment created"
          : type === "reject"
            ? "Deposit rejected"
            : "Information requested",
      );
      router.push("/hard/auth/deposits");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Action failed");
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Deposit review</h1>
          <p className="text-slate-400">{deposit.customerEmail}</p>
        </div>
        <Badge className="capitalize">{deposit.status.replace("_", " ")}</Badge>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-slate-800 bg-slate-900 p-6 space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="text-slate-400">Customer</span>
            <span>{deposit.customerName}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Amount</span>
            <span className="font-semibold">{formatMoney(deposit.amount, deposit.currency)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Plan</span>
            <span>{deposit.planName ?? "—"}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Payment method</span>
            <span className="capitalize">{deposit.paymentMethodSlug.replace("_", " ")}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Reference</span>
            <span className="font-mono text-xs">{deposit.externalTransactionRef}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Submitted</span>
            <span>{deposit.submittedAt ? new Date(deposit.submittedAt).toLocaleString() : "—"}</span>
          </div>
          {deposit.proofStoragePath ? (
            <div>
              <span className="text-slate-400">Payment proof</span>
              <p className="mt-1 font-mono text-xs break-all">{deposit.proofStoragePath}</p>
            </div>
          ) : (
            <p className="text-amber-400 text-xs">No payment proof uploaded</p>
          )}
        </div>

        {["submitted", "under_review", "processing"].includes(deposit.status) ? (
          <div className="space-y-6">
            <div className="space-y-2">
              <Label className="text-slate-300">Internal notes</Label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="bg-slate-900 border-slate-700"
              />
            </div>
            <Button
              className="w-full"
              disabled={!!loading}
              onClick={() => action("approve")}
            >
              {loading === "approve" ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Approve & create investment
            </Button>
            <div className="space-y-2">
              <Label className="text-slate-300">Request additional information</Label>
              <Textarea
                value={infoMessage}
                onChange={(e) => setInfoMessage(e.target.value)}
                className="bg-slate-900 border-slate-700"
              />
              <Button
                variant="outline"
                className="w-full"
                disabled={!!loading || !infoMessage}
                onClick={() => action("request_info")}
              >
                Request info
              </Button>
            </div>
            <div className="space-y-2">
              <Label className="text-slate-300">Rejection reason</Label>
              <Textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                className="bg-slate-900 border-slate-700"
              />
              <Button
                variant="destructive"
                className="w-full"
                disabled={!!loading || !rejectReason}
                onClick={() => action("reject")}
              >
                Reject deposit
              </Button>
            </div>
          </div>
        ) : (
          <div className="rounded-xl border border-slate-800 bg-slate-900 p-6 text-sm text-slate-400">
            This deposit has been {deposit.status}.
            {deposit.investmentId ? (
              <p className="mt-2">Investment ID: {deposit.investmentId}</p>
            ) : null}
          </div>
        )}
      </div>

      <Link href="/hard/auth/deposits" className={buttonVariants({ variant: "outline" })}>
        Back to queue
      </Link>
    </div>
  );
}
