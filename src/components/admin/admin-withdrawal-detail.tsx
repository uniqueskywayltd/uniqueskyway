"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { formatMoney } from "@/lib/utils/money";
import type { WithdrawalReviewContext } from "@/lib/services/withdrawal.service";
import { toast } from "sonner";

export function AdminWithdrawalDetail({ withdrawal }: { withdrawal: WithdrawalReviewContext }) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [infoMessage, setInfoMessage] = useState("");
  const [payoutReference, setPayoutReference] = useState("");
  const [notes, setNotes] = useState(withdrawal.internalNotes ?? "");

  async function action(
    type: "approve" | "reject" | "request_info" | "mark_processing" | "mark_completed",
  ) {
    setLoading(type);
    try {
      const body: Record<string, string> = { action: type };
      if (type === "reject") body.reason = rejectReason;
      if (type === "request_info") body.message = infoMessage;
      if (type === "mark_completed") body.payoutReference = payoutReference;
      if (notes) body.internalNotes = notes;

      const res = await fetch(`/api/hard/auth/withdrawals/${withdrawal.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Action failed");

      toast.success(
        type === "approve"
          ? "Withdrawal approved — funds reserved"
          : type === "reject"
            ? "Withdrawal rejected"
            : type === "mark_completed"
              ? "Withdrawal marked completed"
              : type === "mark_processing"
                ? "Marked as processing"
                : "Information requested",
      );
      router.push("/hard/auth/withdrawals");
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
          <h1 className="text-2xl font-semibold">Withdrawal review</h1>
          <p className="text-muted-foreground">{withdrawal.customerEmail}</p>
        </div>
        <Badge className="capitalize">{withdrawal.status.replace("_", " ")}</Badge>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-6">
          <div className="rounded-xl border border-border bg-card p-6 space-y-3 text-sm">
            <h2 className="font-semibold">Request details</h2>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Customer</span>
              <span>{withdrawal.customerName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Amount</span>
              <span className="font-semibold">{formatMoney(withdrawal.amount, withdrawal.currency)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Method</span>
              <span className="capitalize">{withdrawal.methodSlug.replace(/_/g, " ")}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Destination</span>
              <span className="max-w-[200px] truncate font-mono text-xs">{withdrawal.walletAddress}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Network</span>
              <span>{withdrawal.network}</span>
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card p-6 space-y-3 text-sm">
            <h2 className="font-semibold">Balance impact</h2>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Available</span>
              <span>{formatMoney(withdrawal.availableBalance, withdrawal.currency)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Reserved</span>
              <span>{formatMoney(withdrawal.reservedBalance, withdrawal.currency)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Withdrawable</span>
              <span>{formatMoney(withdrawal.withdrawableBalance, withdrawal.currency)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Locked investments</span>
              <span>{formatMoney(withdrawal.lockedInvestments, withdrawal.currency)}</span>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-xl border border-border bg-card p-6 space-y-3 text-sm">
            <h2 className="font-semibold">Investment summary</h2>
            <p>{withdrawal.investmentSummary.activeCount} active investments</p>
            <p>Total principal: {formatMoney(withdrawal.investmentSummary.totalPrincipal, withdrawal.currency)}</p>
          </div>

          {withdrawal.riskEvents.length > 0 ? (
            <div className="rounded-xl border border-amber-900/50 bg-amber-950/20 p-6 space-y-2 text-sm">
              <h2 className="font-semibold text-amber-200">Risk indicators</h2>
              {withdrawal.riskEvents.map((e) => (
                <div key={e.id} className="border-t border-amber-900/30 pt-2">
                  <p className="font-medium capitalize">{e.title}</p>
                  <p className="text-xs text-amber-200/70">{e.description}</p>
                  <Badge variant="outline" className="mt-1 capitalize">
                    {e.severity}
                  </Badge>
                </div>
              ))}
            </div>
          ) : null}

          <div className="rounded-xl border border-border bg-card p-6 space-y-4">
            <div className="space-y-2">
              <Label className="text-foreground/80">Internal notes</Label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="bg-background border-input"
              />
            </div>

            {["submitted", "under_review"].includes(withdrawal.status) ? (
              <>
                <div className="space-y-2">
                  <Label className="text-foreground/80">Request info message</Label>
                  <Textarea
                    value={infoMessage}
                    onChange={(e) => setInfoMessage(e.target.value)}
                    className="bg-background border-input"
                  />
                </div>
                <Button
                  variant="outline"
                  disabled={!!loading}
                  onClick={() => action("request_info")}
                >
                  {loading === "request_info" ? <Loader2 className="h-4 w-4 animate-spin" /> : "Request information"}
                </Button>
                <Button disabled={!!loading} onClick={() => action("approve")}>
                  {loading === "approve" ? <Loader2 className="h-4 w-4 animate-spin" /> : "Approve & reserve funds"}
                </Button>
                <div className="space-y-2">
                  <Label className="text-foreground/80">Rejection reason</Label>
                  <Textarea
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    className="bg-background border-input"
                  />
                </div>
                <Button
                  variant="destructive"
                  disabled={!!loading || !rejectReason}
                  onClick={() => action("reject")}
                >
                  {loading === "reject" ? <Loader2 className="h-4 w-4 animate-spin" /> : "Reject"}
                </Button>
              </>
            ) : null}

            {withdrawal.status === "approved" ? (
              <Button disabled={!!loading} onClick={() => action("mark_processing")}>
                {loading === "mark_processing" ? <Loader2 className="h-4 w-4 animate-spin" /> : "Mark processing"}
              </Button>
            ) : null}

            {["approved", "processing"].includes(withdrawal.status) ? (
              <>
                <div className="space-y-2">
                  <Label className="text-foreground/80">Payout reference (tx hash / wire ref)</Label>
                  <Input
                    value={payoutReference}
                    onChange={(e) => setPayoutReference(e.target.value)}
                    className="bg-background border-input"
                  />
                </div>
                <Button disabled={!!loading} onClick={() => action("mark_completed")}>
                  {loading === "mark_completed" ? <Loader2 className="h-4 w-4 animate-spin" /> : "Mark completed"}
                </Button>
              </>
            ) : null}
          </div>
        </div>
      </div>

      <Link href="/hard/auth/withdrawals" className={buttonVariants({ variant: "outline" })}>
        Back to queue
      </Link>
    </div>
  );
}
