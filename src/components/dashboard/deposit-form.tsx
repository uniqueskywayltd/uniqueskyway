"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { formatMoney } from "@/lib/utils/money";
import type { InvestmentPlanView } from "@/lib/services/investment-plan.service";
import type { PaymentMethodView } from "@/lib/services/payment-method.service";

type DepositFormProps = {
  plans: InvestmentPlanView[];
  paymentMethods: PaymentMethodView[];
  storageAvailable: boolean;
  defaultCurrency?: string;
};

export function DepositForm({
  plans,
  paymentMethods,
  storageAvailable,
  defaultCurrency = "USD",
}: DepositFormProps) {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [proofFile, setProofFile] = useState<File | null>(null);

  const [form, setForm] = useState({
    planId: "",
    paymentMethodSlug: "",
    amount: "",
    externalTransactionRef: "",
  });

  const selectedPlan = plans.find((p) => p.id === form.planId);
  const selectedMethod = paymentMethods.find((m) => m.slug === form.paymentMethodSlug);

  async function handleSubmit() {
    if (!selectedPlan || !selectedMethod) return;

    setSubmitting(true);
    try {
      const idempotencyKey = `deposit-${crypto.randomUUID()}`;
      let proofStoragePath: string | undefined;

      const createRes = await fetch("/api/dashboard/deposits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          currency: defaultCurrency,
          idempotencyKey,
        }),
      });

      const createData = await createRes.json();
      if (!createRes.ok) {
        throw new Error(createData.error ?? "Failed to submit deposit");
      }

      const depositId = createData.id as string;

      if (proofFile && storageAvailable && selectedMethod.requiresProof) {
        const fd = new FormData();
        fd.append("proof", proofFile);
        const proofRes = await fetch(`/api/dashboard/deposits/${depositId}`, {
          method: "POST",
          body: fd,
        });
        if (!proofRes.ok) {
          const err = await proofRes.json();
          throw new Error(err.error ?? "Failed to upload proof");
        }
        proofStoragePath = (await proofRes.json()).path;
      }

      if (selectedMethod.requiresProof && !proofStoragePath && storageAvailable) {
        toast.warning("Deposit submitted without proof. Upload may be required for approval.");
      }

      toast.success("Deposit submitted successfully");
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

  return (
    <div className="space-y-6">
      <div className="flex gap-2 text-sm">
        {[1, 2, 3].map((s) => (
          <span
            key={s}
            className={`rounded-full px-3 py-1 ${step === s ? "bg-primary text-primary-foreground" : "bg-muted"}`}
          >
            Step {s}
          </span>
        ))}
      </div>

      {step === 1 ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Select plan & amount</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Investment plan</Label>
              <Select value={form.planId} onValueChange={(v) => v && setForm({ ...form, planId: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a plan" />
                </SelectTrigger>
                <SelectContent>
                  {plans.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name} — min {formatMoney(p.minDeposit, defaultCurrency)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="amount">Investment amount</Label>
              <Input
                id="amount"
                type="number"
                min="0"
                step="0.01"
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
              />
              {selectedPlan ? (
                <p className="text-xs text-muted-foreground">
                  Min {formatMoney(selectedPlan.minDeposit, defaultCurrency)}
                  {selectedPlan.maxDeposit
                    ? ` · Max ${formatMoney(selectedPlan.maxDeposit, defaultCurrency)}`
                    : null}
                  {" · "}
                  {selectedPlan.durationDays} days · {selectedPlan.dailyRoiPercent}% daily ROI
                </p>
              ) : null}
            </div>
            <Button
              type="button"
              disabled={!form.planId || !form.amount}
              onClick={() => setStep(2)}
            >
              Continue
            </Button>
          </CardContent>
        </Card>
      ) : null}

      {step === 2 ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Payment method & reference</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Payment method</Label>
              <Select
                value={form.paymentMethodSlug}
                onValueChange={(v) => v && setForm({ ...form, paymentMethodSlug: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choose payment method" />
                </SelectTrigger>
                <SelectContent>
                  {paymentMethods.map((m) => (
                    <SelectItem key={m.id} value={m.slug}>
                      {m.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedMethod?.instructions ? (
                <p className="text-xs text-muted-foreground">{selectedMethod.instructions}</p>
              ) : null}
            </div>
            <div className="space-y-2">
              <Label htmlFor="ref">Transaction / reference ID</Label>
              <Input
                id="ref"
                value={form.externalTransactionRef}
                onChange={(e) => setForm({ ...form, externalTransactionRef: e.target.value })}
                placeholder="Blockchain tx hash, wire reference, etc."
              />
            </div>
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={() => setStep(1)}>
                Back
              </Button>
              <Button
                type="button"
                disabled={!form.paymentMethodSlug || !form.externalTransactionRef}
                onClick={() => setStep(3)}
              >
                Continue
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : null}

      {step === 3 ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Review & submit</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Plan</dt>
                <dd className="font-medium">{selectedPlan?.name}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Amount</dt>
                <dd className="font-medium">{formatMoney(form.amount, defaultCurrency)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Payment method</dt>
                <dd className="font-medium">{selectedMethod?.name}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Reference</dt>
                <dd className="font-mono text-xs">{form.externalTransactionRef}</dd>
              </div>
            </dl>

            {selectedMethod?.requiresProof ? (
              <div className="space-y-2">
                <Label htmlFor="proof">Payment proof</Label>
                <Input
                  id="proof"
                  type="file"
                  accept="image/jpeg,image/png,image/webp,application/pdf"
                  disabled={!storageAvailable}
                  onChange={(e) => setProofFile(e.target.files?.[0] ?? null)}
                />
                {!storageAvailable ? (
                  <p className="text-xs text-amber-600">
                    Storage not configured — proof upload disabled. Contact support.
                  </p>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    JPEG, PNG, WebP, or PDF. Max 10MB.
                  </p>
                )}
              </div>
            ) : null}

            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={() => setStep(2)}>
                Back
              </Button>
              <Button type="button" disabled={submitting} onClick={handleSubmit}>
                {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
                Submit deposit
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
