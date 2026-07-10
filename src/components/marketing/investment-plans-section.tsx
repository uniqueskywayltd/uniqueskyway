"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Calendar,
  Check,
  Crown,
  Gem,
  TrendingUp,
  Users,
  Wallet,
} from "lucide-react";
import {
  card,
  marketingOutlineBtn,
  marketingPrimaryBtn,
  section,
} from "@/components/marketing/marketing-ui";
import { cn } from "@/lib/utils";
import { formatMoney } from "@/lib/utils/money";

export type PlanDisplay = {
  name: string;
  dailyRoiPercent: string;
  minDeposit: string;
  maxDeposit: string | null;
  durationDays: number;
  referralCommissionPercent: string;
  slug: string;
  featured?: boolean;
};

const TIER_STYLE: Record<
  string,
  {
    icon: typeof Gem;
    accent: string;
    badge: string;
    roi: string;
    dot: string;
    level: number;
  }
> = {
  silver: {
    icon: Gem,
    accent: "bg-slate-500",
    badge: "bg-slate-100 text-slate-800 border-slate-200",
    roi: "text-slate-900",
    dot: "bg-slate-500",
    level: 1,
  },
  gold: {
    icon: Gem,
    accent: "bg-amber-500",
    badge: "bg-amber-50 text-amber-900 border-amber-200",
    roi: "text-amber-700",
    dot: "bg-amber-500",
    level: 2,
  },
  classic: {
    icon: TrendingUp,
    accent: "bg-sky-500",
    badge: "bg-sky-50 text-sky-900 border-sky-200",
    roi: "text-sky-700",
    dot: "bg-sky-500",
    level: 3,
  },
  master: {
    icon: Crown,
    accent: "bg-violet-500",
    badge: "bg-violet-50 text-violet-900 border-violet-200",
    roi: "text-violet-700",
    dot: "bg-violet-500",
    level: 4,
  },
};

const PERKS = ["Daily ROI crediting", "Full ledger visibility", "Dashboard access"] as const;

function tierKey(slug: string, index: number) {
  if (TIER_STYLE[slug]) return slug;
  const keys = Object.keys(TIER_STYLE);
  return keys[index % keys.length] ?? "silver";
}

function termYield(daily: string, days: number) {
  const rate = parseFloat(daily);
  if (Number.isNaN(rate)) return null;
  return (rate * days).toFixed(1).replace(/\.0$/, "");
}

function PlanCard({ plan, index }: { plan: PlanDisplay; index: number }) {
  const featured = Boolean(plan.featured);
  const style = TIER_STYLE[tierKey(plan.slug, index)];
  const TierIcon = style.icon;
  const tierLabel = plan.name.replace(/ Plan$/i, "");
  const yieldTotal = termYield(plan.dailyRoiPercent, plan.durationDays);

  return (
    <motion.article
      initial={{ opacity: 1, y: 0 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.35, delay: index * 0.05, ease: "easeOut" }}
      className="flex flex-col"
    >
      <div
        className={cn(
          card.sun,
          "relative flex flex-1 flex-col transition-shadow duration-300 hover:shadow-lg",
          featured && "border-amber-300 ring-2 ring-amber-400/35",
        )}
      >
        {featured ? (
          <p className="border-b border-amber-200 bg-amber-50 px-4 py-2 text-center text-[11px] font-semibold uppercase tracking-[0.12em] text-amber-900">
            Recommended
          </p>
        ) : null}

        <div className={cn("h-1 w-full", style.accent)} />

        <div className={cn(card.padding, "flex flex-1 flex-col", featured && "pt-6")}>
          <div className="flex items-start justify-between gap-3">
            <div>
              <span
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em]",
                  style.badge,
                )}
              >
                <TierIcon className="h-3 w-3" aria-hidden />
                {tierLabel}
              </span>
              <h3 className="mt-3 text-lg font-semibold tracking-tight text-slate-900 sm:text-xl">
                {plan.name}
              </h3>
              <div className="mt-2.5 flex gap-1" aria-hidden>
                {[1, 2, 3, 4].map((n) => (
                  <span
                    key={n}
                    className={cn(
                      "h-1 flex-1 rounded-full",
                      n <= style.level ? style.dot : "bg-slate-200",
                    )}
                  />
                ))}
              </div>
            </div>
            <div
              className={cn(
                "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-slate-50",
                featured && "border-amber-200 bg-amber-50",
              )}
            >
              <TierIcon
                className={cn("h-4 w-4", featured ? "text-amber-600" : "text-slate-600")}
                aria-hidden
              />
            </div>
          </div>

          <div className="mt-6 rounded-lg border border-slate-200 bg-slate-50 p-5">
            <div className="flex items-end gap-0.5">
              <span
                className={cn(
                  "text-4xl font-semibold tabular-nums leading-none tracking-tight sm:text-5xl",
                  style.roi,
                )}
              >
                {plan.dailyRoiPercent}
              </span>
              <span className="mb-1 text-lg font-medium text-slate-600">%</span>
            </div>
            <p className="mt-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-600">
              Daily return
            </p>
            {yieldTotal ? (
              <p className="mt-3 text-xs text-slate-600">
                Up to{" "}
                <span className="font-semibold tabular-nums text-emerald-700">{yieldTotal}%</span>{" "}
                over {plan.durationDays} days
              </p>
            ) : null}
          </div>

          <ul className="mt-5 flex-1 divide-y divide-slate-200 rounded-lg border border-slate-200 bg-white">
            {[
              { icon: Wallet, label: "Minimum", value: formatMoney(plan.minDeposit) },
              {
                icon: TrendingUp,
                label: "Maximum",
                value: plan.maxDeposit ? formatMoney(plan.maxDeposit) : "Unlimited",
              },
              { icon: Calendar, label: "Duration", value: `${plan.durationDays} days` },
              {
                icon: Users,
                label: "Referral bonus",
                value: `${plan.referralCommissionPercent}%`,
                highlight: true,
              },
            ].map((row) => (
              <li
                key={row.label}
                className="flex items-center justify-between gap-3 px-4 py-3 text-sm"
              >
                <span className="flex items-center gap-2 text-slate-600">
                  <row.icon className="h-3.5 w-3.5 shrink-0 text-slate-500" aria-hidden />
                  {row.label}
                </span>
                <span
                  className={cn(
                    "font-semibold tabular-nums",
                    row.highlight ? "text-emerald-700" : "text-slate-900",
                  )}
                >
                  {row.value}
                </span>
              </li>
            ))}
          </ul>

          <ul className="mt-4 space-y-2">
            {PERKS.map((perk) => (
              <li key={perk} className="flex items-center gap-2 text-xs text-slate-600">
                <Check className="h-3.5 w-3.5 shrink-0 text-emerald-600" aria-hidden />
                {perk}
              </li>
            ))}
          </ul>

          <Link
            href="/register"
            className={cn(
              featured ? marketingPrimaryBtn("mt-6 w-full") : marketingOutlineBtn("mt-6 w-full"),
            )}
          >
            Start with {tierLabel}
            <ArrowRight className="ml-2 h-4 w-4" aria-hidden />
          </Link>
        </div>
      </div>
    </motion.article>
  );
}

type InvestmentPlansSectionProps = {
  plans: PlanDisplay[];
};

export function InvestmentPlansSection({ plans }: InvestmentPlansSectionProps) {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-slate-50 via-white to-slate-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <Image
          src="/brand/portfolio.jpg"
          alt=""
          fill
          className="object-cover opacity-[0.08]"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-slate-50/95 via-white/90 to-slate-50/95" />
      </div>

      <div className={cn(section.container, section.paddingDark)}>
        <div className="mx-auto max-w-3xl text-center">
          <p className={section.eyebrowSun}>Investment plans</p>
          <h2 className={section.headingSun}>Flexible plans for every portfolio</h2>
          <p className={cn(section.bodySun, "mx-auto text-center")}>
            Choose a tier that matches your goals — transparent terms, daily reporting, and
            full control from one secure investor dashboard.
          </p>
        </div>

        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:mt-14 xl:grid-cols-4 xl:gap-6">
          {plans.map((plan, i) => (
            <PlanCard key={plan.slug} plan={plan} index={i} />
          ))}
        </div>

        <div className="mx-auto mt-12 max-w-4xl rounded-xl border border-slate-200 bg-white p-6 shadow-md shadow-slate-900/5 sm:mt-14 sm:p-7">
          <div className="flex flex-col items-center justify-between gap-5 sm:flex-row sm:gap-8">
            <div className="text-center sm:text-left">
              <p className="text-sm font-semibold text-slate-900">All plans include</p>
              <p className="mt-1 text-sm text-slate-600">
                Referral rewards · Immutable ledger · 24/7 dashboard · Professional support
              </p>
            </div>
            <Link href="/investments" className={marketingOutlineBtn("shrink-0")}>
              Compare full details
              <ArrowRight className="ml-2 h-4 w-4" aria-hidden />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
