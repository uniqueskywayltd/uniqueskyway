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
import type { InvestmentPlanView } from "@/lib/services/investment-plan.service";

type ReinvestFormProps = {
  plans: InvestmentPlanView[];
  availableBalance: string;
  parentInvestmentId?: string;
  defaultCurrency?: string;
};

const STEP_LABELS = ["Plan & amount", "Confirm"] as const;

export function ReinvestForm({
  plans,
  availableBalance,
  parentInvestmentId,
  defaultCurrency = "USD",
}: ReinvestFormProps) {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ planId: "", amount: "" });

  const selectedPlan = plans.find((p) => p.id === form.planId);
  const amountNum = parseFloat(form.amount) || 0;
  const balanceNum = parseFloat(availableBalance) || 0;
  const reinvestPlans = plans.filter((p) => p.reinvestEnabled !== false);

  async function handleSubmit() {
    if (!selectedPlan) return;

    setSubmitting(true);
    try {
      const res = await fetch("/api/dashboard/reinvest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planId: form.planId,
          amount: form.amount,
          parentInvestmentId,
          idempotencyKey: `reinvest-${crypto.randomUUID()}`,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to reinvest");

      toast.success("Reinvestment completed");
      router.push(`/dashboard/portfolio/${data.investmentId}`);
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Reinvestment failed");
    } finally {
      setSubmitting(false);
    }
  }

  const canContinue =
    Boolean(form.planId) &&
    amountNum > 0 &&
    amountNum <= balanceNum &&
    (!selectedPlan || amountNum >= parseFloat(selectedPlan.minDeposit));

  return (
    <div className="space-y-6">
      <Card className="border-primary/20 bg-gradient-to-br from-primary/5 via-card to-card">
        <CardContent className="py-4">
          <p className="text-sm text-muted-foreground">Available balance</p>
          <p className="text-2xl font-semibold">{formatMoney(availableBalance, defaultCurrency)}</p>
        </CardContent>
      </Card>

      <FormStepIndicator steps={STEP_LABELS} currentStep={step} />

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            {step === 1 ? "Select plan & amount" : "Review & confirm"}
          </CardTitle>
          {step === 1 ? (
            <CardDescription>
              Choose a plan and enter how much of your available balance to reinvest.
            </CardDescription>
          ) : (
            <CardDescription>Review your reinvestment before confirming.</CardDescription>
          )}
        </CardHeader>
        <CardContent className="space-y-6">
          {step === 1 ? (
            <>
              <div className="space-y-3">
                <Label>Investment plan</Label>
                <div className="grid gap-3 sm:grid-cols-2">
                  {reinvestPlans.map((plan) => {
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
                        <p className="pr-8 font-medium">{plan.name}</p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {plan.dailyRoiPercent}% daily · {plan.durationDays} days
                        </p>
                        <p className="mt-2 text-xs text-muted-foreground">
                          Min {formatMoney(plan.minDeposit, defaultCurrency)}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="amount">Amount ({defaultCurrency})</Label>
                <Input
                  id="amount"
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.amount}
                  onChange={(e) => setForm({ ...form, amount: e.target.value })}
                  placeholder={selectedPlan ? `Min ${selectedPlan.minDeposit}` : "Enter amount"}
                />
                {selectedPlan ? (
                  <p className="text-xs text-muted-foreground">
                    Min {formatMoney(selectedPlan.minDeposit, defaultCurrency)} — Max{" "}
                    {selectedPlan.maxDeposit
                      ? formatMoney(selectedPlan.maxDeposit, defaultCurrency)
                      : "Unlimited"}
                  </p>
                ) : null}
              </div>

              <Button className="w-full sm:ml-auto sm:w-auto sm:min-w-32" disabled={!canContinue} onClick={() => setStep(2)}>
                Continue
              </Button>
            </>
          ) : (
            <>
              <div className="grid gap-3 rounded-xl border border-border/70 bg-muted/20 p-4 text-sm sm:grid-cols-2">
                <div>
                  <p className="text-muted-foreground">Plan</p>
                  <p className="font-medium">{selectedPlan?.name}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Amount</p>
                  <p className="font-medium">{formatMoney(form.amount, defaultCurrency)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Daily ROI</p>
                  <p>{selectedPlan?.dailyRoiPercent}%</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Duration</p>
                  <p>{selectedPlan?.durationDays} days</p>
                </div>
              </div>

              <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                <Button variant="outline" className="sm:min-w-28" onClick={() => setStep(1)}>
                  Back
                </Button>
                <Button className="sm:min-w-44" disabled={submitting} onClick={handleSubmit}>
                  {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Confirm reinvestment"}
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
