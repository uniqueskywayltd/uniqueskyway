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
import type { WithdrawalMethodView } from "@/lib/services/withdrawal-method.service";

type WithdrawalFormProps = {
  methods: WithdrawalMethodView[];
  withdrawableBalance: string;
  defaultCurrency?: string;
};

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

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Available to withdraw</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-semibold">{formatMoney(withdrawableBalance, defaultCurrency)}</p>
        </CardContent>
      </Card>

      {step === 1 ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Withdrawal details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Withdrawal method</Label>
              <Select
                value={form.methodSlug}
                onValueChange={(v) => v && setForm((f) => ({ ...f, methodSlug: v }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select method" />
                </SelectTrigger>
                <SelectContent>
                  {methods.map((m) => (
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
              <>
                <div className="space-y-2">
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
                <div className="space-y-2">
                  <Label htmlFor="routingNumber">Routing number</Label>
                  <Input
                    id="routingNumber"
                    value={form.routingNumber}
                    onChange={(e) => setForm((f) => ({ ...f, routingNumber: e.target.value }))}
                  />
                </div>
              </>
            ) : (
              <div className="space-y-2">
                <Label htmlFor="wallet">Wallet address</Label>
                <Input
                  id="wallet"
                  value={form.walletAddress}
                  onChange={(e) => setForm((f) => ({ ...f, walletAddress: e.target.value }))}
                  placeholder="Enter destination address"
                />
              </div>
            )}

            <Button
              className="w-full"
              disabled={
                !form.methodSlug ||
                !form.amount ||
                amountNum <= 0 ||
                (isBank
                  ? !form.accountName || !form.accountNumber
                  : !form.walletAddress)
              }
              onClick={() => setStep(2)}
            >
              Review withdrawal
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Review & submit</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Method</span>
              <span>{selectedMethod?.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Amount</span>
              <span className="font-semibold">{formatMoney(form.amount, defaultCurrency)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Destination</span>
              <span className="max-w-[200px] truncate font-mono text-xs">
                {isBank ? form.accountNumber : form.walletAddress}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Available after</span>
              <span>{formatMoney((parseFloat(withdrawableBalance) - amountNum).toFixed(2), defaultCurrency)}</span>
            </div>

            <div className="flex gap-2 pt-2">
              <Button variant="outline" className="flex-1" onClick={() => setStep(1)}>
                Back
              </Button>
              <Button className="flex-1" disabled={submitting} onClick={handleSubmit}>
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Submit withdrawal"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
