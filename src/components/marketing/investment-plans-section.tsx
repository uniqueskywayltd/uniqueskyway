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
  marketingDarkOutlineBtn,
  marketingDarkPrimaryBtn,
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
    accent: "bg-slate-400",
    badge: "bg-slate-400/15 text-slate-100 border-slate-400/25",
    roi: "text-slate-50",
    dot: "bg-slate-400",
    level: 1,
  },
  gold: {
    icon: Gem,
    accent: "bg-amber-400",
    badge: "bg-amber-400/10 text-amber-100 border-amber-400/25",
    roi: "text-amber-50",
    dot: "bg-amber-400",
    level: 2,
  },
  classic: {
    icon: TrendingUp,
    accent: "bg-sky-400",
    badge: "bg-sky-400/10 text-sky-100 border-sky-400/20",
    roi: "text-slate-50",
    dot: "bg-sky-400",
    level: 3,
  },
  master: {
    icon: Crown,
    accent: "bg-violet-400",
    badge: "bg-violet-400/10 text-violet-100 border-violet-400/20",
    roi: "text-slate-50",
    dot: "bg-violet-400",
    level: 4,
  },
};

const PERKS = ["Daily ROI crediting", "Full ledger visibility", "Dashboard access"] as const;

function tierKey(slug: string) {
  return TIER_STYLE[slug] ? slug : "silver";
}

function termYield(daily: string, days: number) {
  const rate = parseFloat(daily);
  if (Number.isNaN(rate)) return null;
  return (rate * days).toFixed(1).replace(/\.0$/, "");
}

function PlanCard({ plan, index }: { plan: PlanDisplay; index: number }) {
  const featured = Boolean(plan.featured);
  const style = TIER_STYLE[tierKey(plan.slug)];
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
          card.dark,
          "relative flex flex-1 flex-col transition-shadow duration-300 hover:shadow-md",
          featured && "border-amber-400/30 ring-1 ring-amber-400/15",
        )}
      >
        {featured ? (
          <p className="border-b border-amber-400/20 bg-amber-400/[0.06] px-4 py-2 text-center text-[11px] font-medium uppercase tracking-[0.12em] text-amber-200/90">
            Recommended
          </p>
        ) : null}

        <div className={cn("h-0.5 w-full", style.accent)} />

        <div className={cn(card.padding, "flex flex-1 flex-col", featured && "pt-6")}>
          <div className="flex items-start justify-between gap-3">
            <div>
              <span
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-[10px] font-medium uppercase tracking-[0.12em]",
                  style.badge,
                )}
              >
                <TierIcon className="h-3 w-3" aria-hidden />
                {tierLabel}
              </span>
              <h3 className="mt-3 text-lg font-semibold tracking-tight text-white sm:text-xl">
                {plan.name}
              </h3>
              <div className="mt-2.5 flex gap-1" aria-hidden>
                {[1, 2, 3, 4].map((n) => (
                  <span
                    key={n}
                    className={cn(
                      "h-0.5 flex-1 rounded-full",
                      n <= style.level ? style.dot : "bg-white/10",
                    )}
                  />
                ))}
              </div>
            </div>
            <div
              className={cn(
                "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/[0.04]",
                featured && "border-amber-400/25 bg-amber-400/10",
              )}
            >
              <TierIcon
                className={cn("h-4 w-4", featured ? "text-amber-300" : "text-slate-400")}
                aria-hidden
              />
            </div>
          </div>

          <div className="mt-6 rounded-lg border border-white/[0.06] bg-white/[0.02] p-5">
            <div className="flex items-end gap-0.5">
              <span
                className={cn(
                  "text-4xl font-semibold tabular-nums leading-none tracking-tight sm:text-5xl",
                  style.roi,
                )}
              >
                {plan.dailyRoiPercent}
              </span>
              <span className="mb-1 text-lg font-medium text-slate-400">%</span>
            </div>
            <p className="mt-1 text-[11px] font-medium uppercase tracking-[0.14em] text-slate-400">
              Daily return
            </p>
            {yieldTotal ? (
              <p className="mt-3 text-xs text-slate-400">
                Up to{" "}
                <span className="font-medium tabular-nums text-emerald-400/90">{yieldTotal}%</span>{" "}
                over {plan.durationDays} days
              </p>
            ) : null}
          </div>

          <ul className="mt-5 flex-1 divide-y divide-white/[0.06] rounded-lg border border-white/[0.06] bg-black/15">
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
                <span className="flex items-center gap-2 text-slate-400">
                  <row.icon className="h-3.5 w-3.5 shrink-0 opacity-70" aria-hidden />
                  {row.label}
                </span>
                <span
                  className={cn(
                    "font-medium tabular-nums",
                    row.highlight ? "text-emerald-400" : "text-slate-50",
                  )}
                >
                  {row.value}
                </span>
              </li>
            ))}
          </ul>

          <ul className="mt-4 space-y-2">
            {PERKS.map((perk) => (
              <li key={perk} className="flex items-center gap-2 text-xs text-slate-400">
                <Check className="h-3.5 w-3.5 shrink-0 text-slate-500" aria-hidden />
                {perk}
              </li>
            ))}
          </ul>

          <Link
            href="/register"
            className={cn(
              featured ? marketingDarkPrimaryBtn("mt-6 w-full") : marketingDarkOutlineBtn("mt-6 w-full"),
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
    <section className="relative overflow-hidden bg-slate-950">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <Image
          src="/brand/portfolio.jpg"
          alt=""
          fill
          className="object-cover opacity-[0.05]"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950 via-slate-950/98 to-slate-950" />
      </div>

      <div className={cn(section.container, section.paddingDark)}>
        <div className="mx-auto max-w-3xl text-center">
          <p className={section.eyebrowLight}>Investment plans</p>
          <h2 className={section.headingLight}>Flexible plans for every portfolio</h2>
          <p className={cn(section.bodyLight, "mx-auto text-center")}>
            Choose a tier that matches your goals — transparent terms, daily reporting, and
            full control from one secure investor dashboard.
          </p>
        </div>

        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:mt-14 xl:grid-cols-4 xl:gap-6">
          {plans.map((plan, i) => (
            <PlanCard key={plan.slug} plan={plan} index={i} />
          ))}
        </div>

        <div className="mx-auto mt-12 max-w-4xl rounded-xl border border-white/[0.08] bg-white/[0.02] p-6 sm:mt-14 sm:p-7">
          <div className="flex flex-col items-center justify-between gap-5 sm:flex-row sm:gap-8">
            <div className="text-center sm:text-left">
              <p className="text-sm font-medium text-white">All plans include</p>
              <p className="mt-1 text-sm text-slate-400">
                Referral rewards · Immutable ledger · 24/7 dashboard · Professional support
              </p>
            </div>
            <Link href="/investments" className={marketingDarkOutlineBtn("shrink-0")}>
              Compare full details
              <ArrowRight className="ml-2 h-4 w-4" aria-hidden />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
