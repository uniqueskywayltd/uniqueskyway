import Link from "next/link";
import { ArrowDownLeft, Clock, Wallet } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { DepositUnavailableReason } from "@/lib/services/deposit-availability.service";

type DepositUnavailableStateProps = {
  title: string;
  message: string;
  reason: DepositUnavailableReason;
};

export function DepositUnavailableState({ title, message, reason }: DepositUnavailableStateProps) {
  const Icon = reason === "no_wallets" ? Wallet : reason === "no_plans" ? Clock : ArrowDownLeft;

  return (
    <Card className="border-border/70 bg-card/80">
      <CardContent className="flex flex-col items-center px-6 py-12 text-center sm:py-14">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-primary/15 bg-primary/5 text-primary">
          <Icon className="h-5 w-5" aria-hidden />
        </div>
        <h2 className="mt-5 text-lg font-semibold text-foreground">{title}</h2>
        <p className="mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">{message}</p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link href="/dashboard/wallet" className={cn(buttonVariants({ variant: "outline", size: "sm" }))}>
            View wallet
          </Link>
          <Link href="/dashboard/portfolio" className={cn(buttonVariants({ variant: "outline", size: "sm" }))}>
            View portfolio
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
