"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  ArrowDownLeft,
  ArrowUpRight,
  Megaphone,
  TrendingUp,
  UserPlus,
  Users,
} from "lucide-react";
import type { ActivityFeedItem } from "@/lib/constants/trust-components";
import {
  activitySubjectKey,
  pickNextActivityIndex,
  relativeTimeLabel,
} from "@/lib/utils/activity-feed";
import { formatMoney } from "@/lib/utils/money";
import { cn } from "@/lib/utils";

const TYPE_META: Record<
  ActivityFeedItem["type"],
  { label: string; icon: typeof UserPlus; accent: string }
> = {
  registration: { label: "New Member", icon: UserPlus, accent: "text-sky-400" },
  deposit: { label: "Deposit", icon: ArrowDownLeft, accent: "text-emerald-400" },
  withdrawal: { label: "Withdrawal", icon: ArrowUpRight, accent: "text-amber-400" },
  investment: { label: "Investment", icon: TrendingUp, accent: "text-violet-400" },
  referral: { label: "Referral", icon: Users, accent: "text-sky-400" },
  roi_earned: { label: "ROI Earned", icon: TrendingUp, accent: "text-emerald-400" },
  investment_matured: { label: "Matured", icon: TrendingUp, accent: "text-violet-400" },
  announcement: { label: "Announcement", icon: Megaphone, accent: "text-amber-300" },
};

function ActivityCard({ item }: { item: ActivityFeedItem }) {
  const meta = TYPE_META[item.type];
  const Icon = meta.icon;
  const time = relativeTimeLabel(new Date(item.occurredAt));

  return (
    <div className="pointer-events-auto w-[min(100vw-2rem,22.5rem)] rounded-xl border border-white/10 bg-slate-950/95 p-4 shadow-2xl shadow-black/40 backdrop-blur-md sm:w-[22.5rem]">
      <div className="flex items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/5">
          <Icon className={cn("h-4 w-4", meta.accent)} aria-hidden />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-slate-400">
            {item.title ?? meta.label}
          </p>
          {item.type === "registration" ? (
            <p className="mt-1.5 text-sm leading-snug text-white">
              <span className="font-medium">{item.customerNameMasked}</span>
              <span className="text-slate-400"> registered from </span>
              <span className="text-slate-200">{item.country ?? "USA"}</span>
            </p>
          ) : item.type === "withdrawal" ? (
            <p className="mt-1.5 text-sm leading-snug text-white">
              <span className="font-medium">{item.customerNameMasked}</span>
              <span className="text-slate-400"> withdrew </span>
              {item.amount ? (
                <span className="font-medium tabular-nums text-emerald-400">
                  {formatMoney(item.amount)}
                </span>
              ) : null}
              {item.country ? (
                <>
                  <span className="text-slate-400"> to </span>
                  <span className="text-slate-200">{item.country}</span>
                </>
              ) : null}
            </p>
          ) : item.type === "investment" ? (
            <p className="mt-1.5 text-sm leading-snug text-white">
              <span className="font-medium">{item.customerNameMasked}</span>
              <span className="text-slate-400"> started an investment in </span>
              <span className="text-slate-200">{item.investmentPlan}</span>
              {item.amount ? (
                <>
                  <br />
                  <span className="font-medium tabular-nums text-emerald-400">
                    {formatMoney(item.amount)}
                  </span>
                </>
              ) : null}
            </p>
          ) : item.type === "announcement" ? (
            <p className="mt-1.5 text-sm leading-snug text-white">{item.title}</p>
          ) : (
            <p className="mt-1.5 text-sm leading-snug text-white">
              <span className="font-medium">{item.customerNameMasked}</span>
              <span className="text-slate-400"> deposited </span>
              {item.amount ? (
                <span className="font-medium tabular-nums text-emerald-400">
                  {formatMoney(item.amount)}
                </span>
              ) : null}
            </p>
          )}
          <p className="mt-2 text-xs text-slate-500">{time}</p>
        </div>
      </div>
    </div>
  );
}

export function ActivityFeedTicker() {
  const [items, setItems] = useState<ActivityFeedItem[]>([]);
  const [index, setIndex] = useState(0);
  const [visible, setVisible] = useState(true);
  const [enabled, setEnabled] = useState(false);
  const [displayMs, setDisplayMs] = useState(120_000);
  const [initialDelayMs, setInitialDelayMs] = useState(120_000);
  const [nameCooldownMs, setNameCooldownMs] = useState(60 * 60 * 1000);
  const [animMs, setAnimMs] = useState(400);
  const [paused, setPaused] = useState(false);
  const [ready, setReady] = useState(false);
  const shownAtRef = useRef<Map<string, number>>(new Map());
  const [reduceMotion, setReduceMotion] = useState(
    () =>
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  );

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const handler = () => setReduceMotion(mq.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const res = await fetch("/api/activity-feed");
        if (!res.ok) return;
        const data = await res.json();
        if (!active) return;
        setEnabled(Boolean(data.enabled));
        setItems(data.items ?? []);
        setDisplayMs(data.config?.displayDurationMs ?? 120_000);
        setInitialDelayMs(data.config?.initialDelayMs ?? 120_000);
        setNameCooldownMs(data.config?.nameCooldownMs ?? 60 * 60 * 1000);
        setAnimMs(data.config?.animationSpeedMs ?? 400);
        if (data.items?.length) {
          const first = data.items[0] as ActivityFeedItem;
          shownAtRef.current.set(activitySubjectKey(first), Date.now());
        }
      } catch {
        /* graceful degradation */
      }
    }
    load();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!enabled || items.length === 0) return;
    const delay = reduceMotion ? 0 : initialDelayMs;
    const timer = window.setTimeout(() => setReady(true), delay);
    return () => window.clearTimeout(timer);
  }, [enabled, initialDelayMs, items.length, reduceMotion]);

  const advance = useCallback(() => {
    if (items.length <= 1) return;
    setVisible(false);
    window.setTimeout(() => {
      setIndex((prev) =>
        pickNextActivityIndex(items, prev, shownAtRef.current, nameCooldownMs),
      );
      setVisible(true);
    }, reduceMotion ? 0 : animMs);
  }, [animMs, items, nameCooldownMs, reduceMotion]);

  useEffect(() => {
    if (!enabled || !ready || items.length === 0 || paused) return;
    const timer = window.setInterval(advance, displayMs);
    return () => window.clearInterval(timer);
  }, [advance, displayMs, enabled, items.length, paused, ready]);

  if (!enabled || items.length === 0 || !ready) return null;

  const current = items[index]!;

  return (
    <div
      className="pointer-events-none fixed z-50 bottom-[max(1rem,env(safe-area-inset-bottom))] left-1/2 w-full max-w-[calc(100vw-1rem)] -translate-x-1/2 px-2 sm:bottom-6 sm:left-6 sm:max-w-none sm:translate-x-0 sm:px-0"
      role="status"
      aria-live="polite"
      aria-atomic="true"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      <div
        className={cn(
          "transition-all duration-300 ease-out",
          visible || reduceMotion ? "translate-y-0 opacity-100" : "translate-y-3 opacity-0",
        )}
        style={{ transitionDuration: reduceMotion ? "0ms" : `${animMs}ms` }}
      >
        <ActivityCard item={current} />
      </div>
    </div>
  );
}
