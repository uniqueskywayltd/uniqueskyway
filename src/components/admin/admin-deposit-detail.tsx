"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { CopyButton } from "@/components/ui/copy-button";
import { formatMoney } from "@/lib/utils/money";
import { getWalletQrUrl } from "@/lib/utils/wallet-qr";
import type { DepositView } from "@/lib/services/deposit.service";
import { toast } from "sonner";

function depositStatusLabel(status: string): string {
  if (status === "submitted") return "Awaiting Verification";
  return status.replace(/_/g, " ");
}

export function AdminDepositDetail({ deposit }: { deposit: DepositView }) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [infoMessage, setInfoMessage] = useState("");
  const [notes, setNotes] = useState(deposit.internalNotes ?? "");

  const walletLabel =
    deposit.assetNameSnapshot && deposit.networkSnapshot
      ? `${deposit.assetNameSnapshot} (${deposit.networkSnapshot})`
      : deposit.paymentMethodSlug.replace(/^platform:/, "").replace(/:/g, " / ");

  const qrUrl = getWalletQrUrl(deposit.qrCodePathSnapshot);

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
          ? "Deposit approved"
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
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Deposit review</h1>
          <p className="text-muted-foreground">{deposit.customerEmail}</p>
        </div>
        <div className="flex flex-col items-start gap-2 sm:items-end">
          <Badge className="capitalize">{depositStatusLabel(deposit.status)}</Badge>
          <div className="rounded-lg border border-primary/30 bg-primary/5 px-4 py-2 text-right">
            <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
              Customer declared amount
            </p>
            <p className="text-2xl font-semibold text-primary">
              {formatMoney(deposit.amount, deposit.currency)}
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-border bg-card p-6 space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Customer</span>
            <span>{deposit.customerName}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Investment plan</span>
            <span>{deposit.planName ?? "—"}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Amount</span>
            <span className="font-semibold">{formatMoney(deposit.amount, deposit.currency)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Asset / network</span>
            <span>{walletLabel}</span>
          </div>
          {deposit.walletAddressSnapshot ? (
            <div className="space-y-1">
              <span className="text-muted-foreground">Wallet used</span>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <code className="flex-1 break-all font-mono text-xs">{deposit.walletAddressSnapshot}</code>
                <CopyButton
                  value={deposit.walletAddressSnapshot}
                  label="Copy"
                  variant="ghost"
                  size="sm"
                />
              </div>
            </div>
          ) : null}
          {qrUrl ? (
            <div className="space-y-2">
              <span className="text-muted-foreground">QR at submission</span>
              <Image
                src={qrUrl}
                alt="Deposit QR snapshot"
                width={160}
                height={160}
                className="rounded border border-input"
                unoptimized
              />
            </div>
          ) : null}
          {deposit.walletInstructionsSnapshot ? (
            <div>
              <span className="text-muted-foreground">Instructions shown</span>
              <p className="mt-1 text-foreground">{deposit.walletInstructionsSnapshot}</p>
            </div>
          ) : null}
          <div className="flex justify-between">
            <span className="text-muted-foreground">TXID</span>
            <span className="font-mono text-xs">{deposit.externalTransactionRef}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Submitted</span>
            <span>{deposit.submittedAt ? new Date(deposit.submittedAt).toLocaleString() : "—"}</span>
          </div>
          {deposit.proofStoragePath ? (
            <div>
              <span className="text-muted-foreground">Screenshot</span>
              <p className="mt-1 font-mono text-xs break-all">{deposit.proofStoragePath}</p>
            </div>
          ) : (
            <p className="text-amber-400 text-xs">No screenshot uploaded</p>
          )}
        </div>

        {["submitted", "under_review", "processing"].includes(deposit.status) ? (
          <div className="space-y-6">
            <div className="space-y-2">
              <Label className="text-foreground/80">Internal notes</Label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="bg-card border-input"
              />
            </div>
            <Button
              className="w-full"
              disabled={!!loading}
              onClick={() => action("approve")}
            >
              {loading === "approve" ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Approve Deposit
            </Button>
            <div className="space-y-2">
              <Label className="text-foreground/80">Request additional information</Label>
              <Textarea
                value={infoMessage}
                onChange={(e) => setInfoMessage(e.target.value)}
                className="bg-card border-input"
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
              <Label className="text-foreground/80">Rejection reason (required)</Label>
              <Textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                className="bg-card border-input"
              />
              <Button
                variant="destructive"
                className="w-full"
                disabled={!!loading || !rejectReason}
                onClick={() => action("reject")}
              >
                Reject Deposit
              </Button>
            </div>
          </div>
        ) : (
          <div className="rounded-xl border border-border bg-card p-6 text-sm text-muted-foreground">
            This deposit has been {depositStatusLabel(deposit.status).toLowerCase()}.
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
