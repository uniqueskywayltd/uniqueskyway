"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
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

type ReinvestFormProps = {
  plans: InvestmentPlanView[];
  availableBalance: string;
  parentInvestmentId?: string;
  defaultCurrency?: string;
};

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

  const reinvestPlans = plans.filter((p) => p.reinvestEnabled !== false);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">
          {step === 1 ? "Select plan & amount" : "Review & confirm"}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {step === 1 ? (
          <>
            <div className="rounded-lg bg-muted/50 p-4 text-sm">
              Available balance:{" "}
              <span className="font-semibold">{formatMoney(availableBalance, defaultCurrency)}</span>
            </div>

            <div className="space-y-2">
              <Label htmlFor="plan">Investment plan</Label>
              <Select
                value={form.planId}
                onValueChange={(v) => setForm({ ...form, planId: v ?? "" })}
              >
                <SelectTrigger id="plan">
                  <SelectValue placeholder="Choose a plan" />
                </SelectTrigger>
                <SelectContent>
                  {reinvestPlans.map((plan) => (
                    <SelectItem key={plan.id} value={plan.id}>
                      {plan.name} — {plan.dailyRoiPercent}% daily
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
                  Min {formatMoney(selectedPlan.minDeposit)} — Max{" "}
                  {selectedPlan.maxDeposit ? formatMoney(selectedPlan.maxDeposit) : "Unlimited"}
                </p>
              ) : null}
            </div>

            <Button
              className="w-full"
              disabled={
                !form.planId ||
                amountNum <= 0 ||
                amountNum > balanceNum ||
                (selectedPlan && amountNum < parseFloat(selectedPlan.minDeposit))
              }
              onClick={() => setStep(2)}
            >
              Continue
            </Button>
          </>
        ) : (
          <>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Plan</span>
                <span className="font-medium">{selectedPlan?.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Amount</span>
                <span className="font-medium">{formatMoney(form.amount, defaultCurrency)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Daily ROI</span>
                <span>{selectedPlan?.dailyRoiPercent}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Duration</span>
                <span>{selectedPlan?.durationDays} days</span>
              </div>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setStep(1)}>
                Back
              </Button>
              <Button className="flex-1" disabled={submitting} onClick={handleSubmit}>
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Confirm reinvestment"}
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
