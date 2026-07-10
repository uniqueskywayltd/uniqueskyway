"use client";

import { useEffect, useMemo, useState } from "react";
import { Clock, TrendingUp } from "lucide-react";
import {
  calculateLiveAccrualState,
  formatCountdown,
  type LiveAccrualInput,
} from "@/lib/utils/investment-accrual-live";
import { formatMoney } from "@/lib/utils/money";

type InvestmentAccrualLiveProps = LiveAccrualInput & {
  currency?: string;
  planName?: string;
};

export function InvestmentAccrualLive(props: InvestmentAccrualLiveProps) {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(id);
  }, []);

  const state = useMemo(
    () => calculateLiveAccrualState(props, now),
    [props, now],
  );

  const currency = props.currency ?? "USD";

  return (
    <div className="rounded-xl border border-border/60 bg-gradient-to-br from-primary/5 via-card to-card p-6 space-y-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-muted-foreground">Live accrued interest</p>
          <p className="mt-1 text-3xl font-bold tabular-nums tracking-tight text-emerald-600">
            {formatMoney(state.liveTotal, currency)}
          </p>
          {props.planName ? (
            <p className="mt-1 text-xs text-muted-foreground">{props.planName}</p>
          ) : null}
        </div>
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-emerald-500/10">
          <TrendingUp className="h-5 w-5 text-emerald-600" />
        </div>
      </div>

      {state.isAccruing ? (
        <>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">
                Day {state.cycleDay} of {props.durationDays} — today&apos;s accrual
              </span>
              <span className="font-medium tabular-nums">
                {formatMoney(state.todayAccrual, currency)} / {formatMoney(state.dailyEarnings, currency)}
              </span>
            </div>
            <div className="h-2.5 w-full overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-emerald-500 transition-[width] duration-1000 ease-linear"
                style={{ width: `${state.dayProgressPercent}%` }}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Interest grows from {formatMoney(state.creditedTotal, currency)} toward{" "}
              {formatMoney(state.creditedTotal + state.dailyEarnings, currency)} for this cycle day.
            </p>
          </div>

          <div className="flex items-center gap-2 rounded-lg border border-border/60 bg-muted/30 px-3 py-2 text-sm">
            <Clock className="h-4 w-4 shrink-0 text-muted-foreground" />
            <span className="text-muted-foreground">Next payout to history in</span>
            <span className="ml-auto font-mono font-medium tabular-nums">
              {formatCountdown(state.nextAccrualInMs)}
            </span>
          </div>
        </>
      ) : state.lockEndsAt && now < state.lockEndsAt ? (
        <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-800 dark:text-amber-200">
          ROI accrual begins after the lock period in{" "}
          <span className="font-mono font-medium">{formatCountdown(state.nextAccrualInMs)}</span>.
        </div>
      ) : props.status === "matured" ? (
        <p className="text-sm text-muted-foreground">
          This investment has matured. Accrued interest is recorded in your activity history below.
        </p>
      ) : (
        <p className="text-sm text-muted-foreground">
          Accrual is paused or not yet active for this position.
        </p>
      )}

      <div className="grid gap-3 sm:grid-cols-3 text-sm">
        <div className="rounded-lg border border-border/50 bg-background/60 px-3 py-2">
          <p className="text-muted-foreground">Credited to date</p>
          <p className="font-semibold tabular-nums">{formatMoney(state.creditedTotal, currency)}</p>
        </div>
        <div className="rounded-lg border border-border/50 bg-background/60 px-3 py-2">
          <p className="text-muted-foreground">Daily rate</p>
          <p className="font-semibold tabular-nums">{formatMoney(state.dailyEarnings, currency)}</p>
        </div>
        <div className="rounded-lg border border-border/50 bg-background/60 px-3 py-2">
          <p className="text-muted-foreground">Plan day</p>
          <p className="font-semibold tabular-nums">
            {state.cycleDay > 0 ? `${state.cycleDay} / ${props.durationDays}` : "—"}
          </p>
        </div>
      </div>
    </div>
  );
}
