"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FormStepIndicator } from "@/components/dashboard/form-step-indicator";
import { toast } from "sonner";
import { formatMoney } from "@/lib/utils/money";
import { cn } from "@/lib/utils";
import type { WithdrawalMethodView } from "@/lib/services/withdrawal-method.service";

type WithdrawalFormProps = {
  methods: WithdrawalMethodView[];
  withdrawableBalance: string;
  defaultCurrency?: string;
};

const STEP_LABELS = ["Details", "Review"] as const;

export function WithdrawalForm({
  methods,
  withdrawableBalance,
  defaultCurrency = "USD",
}: WithdrawalFormProps) {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    methodSlug: "",
    amount: "",
    walletAddress: "",
    accountName: "",
    accountNumber: "",
    routingNumber: "",
    bankName: "",
  });

  const selectedMethod = methods.find((m) => m.slug === form.methodSlug);
  const isBank = selectedMethod?.methodType === "bank_transfer";
  const amountNum = parseFloat(form.amount) || 0;

  async function handleSubmit() {
    if (!selectedMethod) return;

    setSubmitting(true);
    try {
      const destination: Record<string, string> = isBank
        ? {
            account_name: form.accountName,
            account_number: form.accountNumber,
            routing_number: form.routingNumber,
            bank_name: form.bankName,
          }
        : {
            walletAddress: form.walletAddress,
            network: (selectedMethod.config.network as string) ?? selectedMethod.slug,
          };

      const res = await fetch("/api/dashboard/withdrawals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          methodSlug: form.methodSlug,
          amount: form.amount,
          destination,
          currency: defaultCurrency,
          idempotencyKey: `withdrawal-${crypto.randomUUID()}`,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to submit withdrawal");

      toast.success("Withdrawal submitted successfully");
      router.push(`/dashboard/withdrawals?submitted=${data.id}`);
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Submission failed");
    } finally {
      setSubmitting(false);
    }
  }

  if (!methods.length) {
    return (
      <Card>
        <CardContent className="py-10 text-center text-muted-foreground">
          No withdrawal methods are currently available. Please contact support.
        </CardContent>
      </Card>
    );
  }

  const canContinue =
    Boolean(form.methodSlug) &&
    amountNum > 0 &&
    (isBank ? Boolean(form.accountName && form.accountNumber) : Boolean(form.walletAddress));

  return (
    <div className="space-y-6">
      <Card className="border-primary/20 bg-gradient-to-br from-primary/5 via-card to-card">
        <CardHeader className="pb-2">
          <CardTitle className="text-base text-muted-foreground">Available to withdraw</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-semibold tracking-tight">
            {formatMoney(withdrawableBalance, defaultCurrency)}
          </p>
        </CardContent>
      </Card>

      <FormStepIndicator steps={STEP_LABELS} currentStep={step} />

      {step === 1 ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Withdrawal details</CardTitle>
            <CardDescription>
              Choose how you want to receive funds and enter the destination details.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-3">
              <Label>Withdrawal method</Label>
              <div className="grid gap-3 sm:grid-cols-2">
                {methods.map((method) => {
                  const selected = form.methodSlug === method.slug;
                  return (
                    <button
                      key={method.id}
                      type="button"
                      onClick={() => setForm((f) => ({ ...f, methodSlug: method.slug }))}
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
                      <p className="pr-8 font-medium">{method.name}</p>
                      <p className="mt-1 text-xs capitalize text-muted-foreground">
                        {method.methodType.replace("_", " ")}
                      </p>
                    </button>
                  );
                })}
              </div>
              {selectedMethod?.instructions ? (
                <p className="text-sm text-muted-foreground">{selectedMethod.instructions}</p>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor="amount">Amount ({defaultCurrency})</Label>
              <Input
                id="amount"
                type="number"
                min="0"
                step="0.01"
                value={form.amount}
                onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
                placeholder="0.00"
              />
            </div>

            {isBank ? (
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="accountName">Account holder name</Label>
                  <Input
                    id="accountName"
                    value={form.accountName}
                    onChange={(e) => setForm((f) => ({ ...f, accountName: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bankName">Bank name</Label>
                  <Input
                    id="bankName"
                    value={form.bankName}
                    onChange={(e) => setForm((f) => ({ ...f, bankName: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="accountNumber">Account number</Label>
                  <Input
                    id="accountNumber"
                    value={form.accountNumber}
                    onChange={(e) => setForm((f) => ({ ...f, accountNumber: e.target.value }))}
                  />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="routingNumber">Routing number</Label>
                  <Input
                    id="routingNumber"
                    value={form.routingNumber}
                    onChange={(e) => setForm((f) => ({ ...f, routingNumber: e.target.value }))}
                  />
                </div>
              </div>
            ) : selectedMethod ? (
              <div className="space-y-2">
                <Label htmlFor="wallet">Wallet address</Label>
                <Input
                  id="wallet"
                  value={form.walletAddress}
                  onChange={(e) => setForm((f) => ({ ...f, walletAddress: e.target.value }))}
                  placeholder="Enter destination address"
                />
              </div>
            ) : null}

            <Button className="w-full sm:ml-auto sm:w-auto sm:min-w-40" disabled={!canContinue} onClick={() => setStep(2)}>
              Review withdrawal
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Review & submit</CardTitle>
            <CardDescription>Confirm the details below before submitting your withdrawal request.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 rounded-xl border border-border/70 bg-muted/20 p-4 text-sm sm:grid-cols-2">
              <div>
                <p className="text-muted-foreground">Method</p>
                <p className="font-medium">{selectedMethod?.name}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Amount</p>
                <p className="font-semibold">{formatMoney(form.amount, defaultCurrency)}</p>
              </div>
              <div className="sm:col-span-2">
                <p className="text-muted-foreground">Destination</p>
                <p className="break-all font-mono text-xs">
                  {isBank ? form.accountNumber : form.walletAddress}
                </p>
              </div>
              <div className="sm:col-span-2">
                <p className="text-muted-foreground">Available after withdrawal</p>
                <p>{formatMoney((parseFloat(withdrawableBalance) - amountNum).toFixed(2), defaultCurrency)}</p>
              </div>
            </div>

            <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
              <Button variant="outline" className="sm:min-w-28" onClick={() => setStep(1)}>
                Back
              </Button>
              <Button className="sm:min-w-40" disabled={submitting} onClick={handleSubmit}>
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Submit withdrawal"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
