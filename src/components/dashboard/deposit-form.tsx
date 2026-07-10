"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { AlertTriangle, Check, Loader2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CopyButton } from "@/components/ui/copy-button";
import { FormStepIndicator } from "@/components/dashboard/form-step-indicator";
import { toast } from "sonner";
import { formatMoney } from "@/lib/utils/money";
import { getWalletQrUrl } from "@/lib/utils/wallet-qr";
import { cn } from "@/lib/utils";
import type { InvestmentPlanView } from "@/lib/services/investment-plan.service";
import type { PlatformWalletView } from "@/lib/services/platform-wallet.service";

type DepositFormProps = {
  plans: InvestmentPlanView[];
  platformWallets: PlatformWalletView[];
  storageAvailable: boolean;
  defaultCurrency?: string;
};

const STEP_LABELS = ["Plan", "Payment", "Details", "Confirm"] as const;

function parseAmount(value: string): number | null {
  const num = parseFloat(value);
  return Number.isFinite(num) && num > 0 ? num : null;
}

function isValidDepositAmount(amount: string, plan: InvestmentPlanView | undefined): boolean {
  const num = parseAmount(amount);
  if (num === null || !plan) return false;

  const min = parseFloat(plan.minDeposit);
  if (num < min) return false;

  if (plan.maxDeposit) {
    const max = parseFloat(plan.maxDeposit);
    if (num > max) return false;
  }

  return true;
}

function DepositAmountField({
  id,
  amount,
  onChange,
  plan,
  defaultCurrency,
  prominent = false,
}: {
  id: string;
  amount: string;
  onChange: (value: string) => void;
  plan: InvestmentPlanView | undefined;
  defaultCurrency: string;
  prominent?: boolean;
}) {
  const amountNum = parseAmount(amount);
  const valid = isValidDepositAmount(amount, plan);

  return (
    <div
      className={cn(
        "space-y-2 rounded-xl border p-4",
        prominent
          ? "border-primary/30 bg-primary/5"
          : "border-border/70 bg-muted/20",
      )}
    >
      <Label htmlFor={id} className={prominent ? "text-base font-semibold" : undefined}>
        How much are you depositing?
      </Label>
      <p className="text-xs text-muted-foreground">
        Enter the exact amount you send. Our team uses this to fund your account — no follow-up needed.
      </p>
      <div className="flex flex-col gap-2 sm:flex-row">
        <Input
          id={id}
          type="number"
          min="0"
          step="0.01"
          inputMode="decimal"
          className={cn("bg-background sm:flex-1", prominent && "text-lg font-medium h-11")}
          value={amount}
          onChange={(e) => onChange(e.target.value)}
          placeholder={plan ? `e.g. ${plan.minDeposit}` : "0.00"}
        />
        {amount ? (
          <CopyButton value={amount} label="Copy amount" variant="outline" />
        ) : null}
      </div>
      {plan ? (
        <p className="text-xs text-muted-foreground">
          Min {formatMoney(plan.minDeposit, defaultCurrency)}
          {plan.maxDeposit
            ? ` · Max ${formatMoney(plan.maxDeposit, defaultCurrency)}`
            : null}
        </p>
      ) : null}
      {amount && !valid ? (
        <p className="text-xs text-destructive">
          Enter a valid amount within the plan limits.
        </p>
      ) : null}
      {valid && amountNum !== null ? (
        <p className="text-sm font-medium text-primary">
          Declared deposit: {formatMoney(amountNum.toFixed(2), defaultCurrency)}
        </p>
      ) : null}
    </div>
  );
}

function DepositProgressSummary({
  plan,
  wallet,
  amount,
  defaultCurrency,
}: {
  plan: InvestmentPlanView | undefined;
  wallet: PlatformWalletView | undefined;
  amount: string;
  defaultCurrency: string;
}) {
  const amountNum = parseAmount(amount);

  return (
    <div className="grid gap-3 rounded-xl border border-border/70 bg-card p-4 text-sm sm:grid-cols-3">
      <div>
        <p className="text-xs uppercase tracking-wide text-muted-foreground">Plan</p>
        <p className="font-medium">{plan?.name ?? "—"}</p>
      </div>
      <div>
        <p className="text-xs uppercase tracking-wide text-muted-foreground">Payment</p>
        <p className="font-medium">
          {wallet ? `${wallet.assetName} · ${wallet.network}` : "—"}
        </p>
      </div>
      <div>
        <p className="text-xs uppercase tracking-wide text-muted-foreground">Your deposit</p>
        <p className={cn("font-semibold", amountNum ? "text-primary text-lg" : "text-muted-foreground")}>
          {amountNum ? formatMoney(amountNum.toFixed(2), defaultCurrency) : "Enter amount below"}
        </p>
      </div>
    </div>
  );
}

function FormActions({
  onBack,
  onContinue,
  continueLabel = "Continue",
  continueDisabled = false,
  showBack = true,
}: {
  onBack?: () => void;
  onContinue?: () => void;
  continueLabel?: string;
  continueDisabled?: boolean;
  showBack?: boolean;
}) {
  return (
    <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
      {showBack && onBack ? (
        <Button type="button" variant="outline" className="sm:min-w-28" onClick={onBack}>
          Back
        </Button>
      ) : null}
      {onContinue ? (
        <Button type="button" className="sm:min-w-36" disabled={continueDisabled} onClick={onContinue}>
          {continueLabel}
        </Button>
      ) : null}
    </div>
  );
}

export function DepositForm({
  plans,
  platformWallets,
  storageAvailable,
  defaultCurrency = "USD",
}: DepositFormProps) {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [paymentConfirmed, setPaymentConfirmed] = useState(false);

  const [form, setForm] = useState({
    planId: "",
    platformWalletId: "",
    amount: "",
    externalTransactionRef: "",
  });

  const selectedPlan = plans.find((p) => p.id === form.planId);
  const selectedWallet = platformWallets.find((w) => w.id === form.platformWalletId);
  const qrUrl = getWalletQrUrl(selectedWallet?.qrCodePath);

  async function handleSubmit() {
    if (!selectedPlan || !selectedWallet || !paymentConfirmed) return;

    setSubmitting(true);
    try {
      const idempotencyKey = `deposit-${crypto.randomUUID()}`;

      const createRes = await fetch("/api/dashboard/deposits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planId: form.planId,
          platformWalletId: form.platformWalletId,
          amount: form.amount,
          externalTransactionRef: form.externalTransactionRef,
          currency: defaultCurrency,
          idempotencyKey,
        }),
      });

      const createData = await createRes.json();
      if (!createRes.ok) {
        throw new Error(createData.error ?? "Failed to submit deposit");
      }

      const depositId = createData.id as string;

      if (proofFile && storageAvailable) {
        const fd = new FormData();
        fd.append("proof", proofFile);
        const proofRes = await fetch(`/api/dashboard/deposits/${depositId}`, {
          method: "POST",
          body: fd,
        });
        if (!proofRes.ok) {
          const err = await proofRes.json();
          throw new Error(err.error ?? "Failed to upload screenshot");
        }
      }

      toast.success("Deposit submitted — awaiting verification");
      router.push(`/dashboard/deposits?submitted=${depositId}`);
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Submission failed");
    } finally {
      setSubmitting(false);
    }
  }

  if (!plans.length) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-muted-foreground">
          No investment plans are available yet. Please check back later.
        </CardContent>
      </Card>
    );
  }

  if (!platformWallets.length) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-muted-foreground">
          No payment methods currently available. Please contact support.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <FormStepIndicator steps={STEP_LABELS} currentStep={step} />

      {step >= 3 && selectedPlan ? (
        <DepositProgressSummary
          plan={selectedPlan}
          wallet={selectedWallet}
          amount={form.amount}
          defaultCurrency={defaultCurrency}
        />
      ) : null}

      {step === 1 ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Choose investment plan</CardTitle>
            <CardDescription>
              Select the plan you want to fund. Minimum deposit and ROI terms are shown for each option.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-3 sm:grid-cols-2">
              {plans.map((plan) => {
                const selected = form.planId === plan.id;
                return (
                  <button
                    key={plan.id}
                    type="button"
                    onClick={() => setForm({ ...form, planId: plan.id })}
                    className={cn(
                      "relative rounded-xl border p-4 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
                      selected
                        ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                        : "border-border hover:border-primary/40 hover:bg-muted/20",
                    )}
                  >
                    {selected ? (
                      <span className="absolute right-3 top-3 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground">
                        <Check className="h-3 w-3" aria-hidden />
                      </span>
                    ) : null}
                    <p className="pr-8 text-base font-semibold text-foreground">{plan.name}</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Min {formatMoney(plan.minDeposit, defaultCurrency)}
                      {plan.maxDeposit
                        ? ` · Max ${formatMoney(plan.maxDeposit, defaultCurrency)}`
                        : null}
                    </p>
                    <p className="mt-2 text-xs text-muted-foreground">
                      {plan.durationDays} days · {plan.dailyRoiPercent}% daily ROI
                    </p>
                  </button>
                );
              })}
            </div>
            <FormActions
              showBack={false}
              continueDisabled={!form.planId}
              onContinue={() => setStep(2)}
            />
          </CardContent>
        </Card>
      ) : null}

      {step === 2 ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Choose payment method</CardTitle>
            <CardDescription>
              Pick the wallet network you will send from. Use the recommended option when available.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-3 sm:grid-cols-2">
              {platformWallets.map((wallet) => {
                const selected = form.platformWalletId === wallet.id;
                return (
                  <button
                    key={wallet.id}
                    type="button"
                    onClick={() => setForm({ ...form, platformWalletId: wallet.id })}
                    className={cn(
                      "rounded-xl border p-4 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
                      selected
                        ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                        : "border-border hover:border-primary/40 hover:bg-muted/20",
                    )}
                    style={
                      wallet.color && selected
                        ? { borderColor: wallet.color }
                        : undefined
                    }
                  >
                    <div className="flex items-center gap-3">
                      {wallet.icon ? (
                        <span className="text-2xl" aria-hidden>
                          {wallet.icon}
                        </span>
                      ) : (
                        <span
                          className="flex h-10 w-10 items-center justify-center rounded-full bg-muted text-sm font-semibold"
                          style={
                            wallet.color
                              ? { backgroundColor: `${wallet.color}22`, color: wallet.color }
                              : undefined
                          }
                        >
                          {wallet.assetSymbol.slice(0, 2)}
                        </span>
                      )}
                      <div className="min-w-0">
                        <p className="font-medium">{wallet.assetName}</p>
                        <p className="text-xs text-muted-foreground">{wallet.network}</p>
                      </div>
                    </div>
                    {wallet.isPrimary ? (
                      <span className="mt-2 inline-block text-xs font-medium text-primary">
                        Recommended
                      </span>
                    ) : null}
                  </button>
                );
              })}
            </div>
            <FormActions
              onBack={() => setStep(1)}
              continueDisabled={!form.platformWalletId}
              onContinue={() => setStep(3)}
            />
          </CardContent>
        </Card>
      ) : null}

      {step === 3 && selectedWallet ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Deposit details</CardTitle>
            <CardDescription>
              Send {selectedWallet.assetName} on {selectedWallet.network}, then continue to confirm your deposit.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <DepositAmountField
              id="deposit-amount-step3"
              amount={form.amount}
              onChange={(value) => setForm({ ...form, amount: value })}
              plan={selectedPlan}
              defaultCurrency={defaultCurrency}
              prominent
            />

            <div className="rounded-xl border border-border/70 bg-muted/20 p-4 text-center">
              <p className="text-lg font-semibold">
                {selectedWallet.assetName} · {selectedWallet.network}
              </p>
              {selectedPlan ? (
                <p className="mt-1 text-sm text-muted-foreground">
                  Funding {selectedPlan.name}
                </p>
              ) : null}
            </div>

            {qrUrl ? (
              <div className="mx-auto flex max-w-xs justify-center">
                <Image
                  src={qrUrl}
                  alt={`QR code for ${selectedWallet.assetName} ${selectedWallet.network} deposit`}
                  width={240}
                  height={240}
                  className="rounded-lg border bg-white p-2"
                  unoptimized
                />
              </div>
            ) : (
              <p className="text-center text-sm text-muted-foreground">QR code not available</p>
            )}

            <div className="space-y-2">
              <Label>Wallet address</Label>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start">
                <code className="flex-1 break-all rounded-lg bg-muted px-3 py-2.5 text-sm">
                  {selectedWallet.walletAddress}
                </code>
                <CopyButton value={selectedWallet.walletAddress} label="Copy address" />
              </div>
            </div>

            {selectedWallet.instructions ? (
              <p className="text-sm text-muted-foreground">{selectedWallet.instructions}</p>
            ) : null}

            <div
              className="flex gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-200"
              role="alert"
            >
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
              <p>
                Only send {selectedWallet.network} {selectedWallet.assetSymbol} to this address.
                Sending another asset or network may result in permanent loss of funds.
              </p>
            </div>

            <FormActions
              onBack={() => setStep(2)}
              continueLabel="I have the address — continue"
              continueDisabled={!isValidDepositAmount(form.amount, selectedPlan)}
              onContinue={() => setStep(4)}
            />
          </CardContent>
        </Card>
      ) : null}

      {step === 4 && selectedPlan && selectedWallet ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Confirm your deposit</CardTitle>
            <CardDescription>
              Enter the amount you sent and your transaction hash so our team can verify the payment.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="rounded-xl border border-primary/30 bg-primary/5 p-4 text-center">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Amount to fund</p>
              <p className="mt-1 text-3xl font-semibold text-primary">
                {form.amount ? formatMoney(form.amount, defaultCurrency) : "—"}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                This is what admin will use to credit your account
              </p>
            </div>

            <div className="grid gap-3 rounded-xl border border-border/70 bg-muted/20 p-4 text-sm sm:grid-cols-2">
              <div>
                <p className="text-muted-foreground">Plan</p>
                <p className="font-medium">{selectedPlan.name}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Payment method</p>
                <p className="font-medium">
                  {selectedWallet.assetName} · {selectedWallet.network}
                </p>
              </div>
            </div>

            <DepositAmountField
              id="deposit-amount-step4"
              amount={form.amount}
              onChange={(value) => setForm({ ...form, amount: value })}
              plan={selectedPlan}
              defaultCurrency={defaultCurrency}
            />

            <div className="space-y-2">
              <Label htmlFor="ref">Transaction hash (TXID)</Label>
              <Input
                id="ref"
                value={form.externalTransactionRef}
                onChange={(e) => setForm({ ...form, externalTransactionRef: e.target.value })}
                placeholder="Paste your blockchain transaction ID"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="proof">Screenshot (optional)</Label>
              <Input
                id="proof"
                type="file"
                accept="image/jpeg,image/png,image/webp,application/pdf"
                disabled={!storageAvailable}
                onChange={(e) => setProofFile(e.target.files?.[0] ?? null)}
              />
              {!storageAvailable ? (
                <p className="text-xs text-amber-600">
                  Storage not configured — screenshot upload disabled.
                </p>
              ) : null}
            </div>

            <div className="flex items-start gap-2 rounded-lg border border-border/70 p-3">
              <Checkbox
                id="payment-confirmed"
                checked={paymentConfirmed}
                onCheckedChange={(v) => setPaymentConfirmed(v === true)}
              />
              <Label htmlFor="payment-confirmed" className="font-normal leading-snug">
                I have completed this payment and sent funds to the wallet address shown.
              </Label>
            </div>

            <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
              <Button type="button" variant="outline" className="sm:min-w-28" onClick={() => setStep(3)}>
                Back
              </Button>
              <Button
                type="button"
                className="sm:min-w-40"
                disabled={
                  submitting ||
                  !isValidDepositAmount(form.amount, selectedPlan) ||
                  !form.externalTransactionRef ||
                  !paymentConfirmed
                }
                onClick={handleSubmit}
              >
                {submitting ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Upload className="mr-2 h-4 w-4" />
                )}
                Submit deposit
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
