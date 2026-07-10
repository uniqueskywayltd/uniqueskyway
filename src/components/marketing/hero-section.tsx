"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight, BarChart3, LogIn } from "lucide-react";
import { marketingGhostLink, marketingOutlineBtn, marketingPrimaryBtn } from "@/components/marketing/marketing-ui";
import { cn } from "@/lib/utils";

/** Live portfolio snapshot inside the dashboard mockup — product preview only */
const portfolioSnapshot = [
  { value: "$24,850", label: "Portfolio", positive: false },
  { value: "+$127", label: "Today", positive: true },
  { value: "$3,420", label: "Available", positive: false },
] as const;

export function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-sky-50 via-white to-slate-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <Image
          src="/brand/global-markets.jpg"
          alt=""
          fill
          priority
          className="object-cover opacity-[0.12] dark:opacity-[0.08]"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-white/92 via-white/88 to-slate-50/95 dark:from-slate-950/92 dark:via-slate-900/88 dark:to-slate-950/95" />
      </div>

      <div className="mx-auto w-full max-w-7xl px-4 pb-20 pt-12 sm:px-6 sm:pb-24 sm:pt-14 lg:px-8 lg:pb-28 lg:pt-16">
        <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16 xl:gap-20">
          <div className="flex flex-col items-center text-center lg:items-start lg:text-left">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">
              Established 2017 · Fayetteville, Arkansas
            </p>

            <h1 className="mt-6 max-w-[18ch] text-4xl font-semibold leading-[1.12] tracking-tight text-slate-900 dark:text-slate-50 sm:text-5xl lg:max-w-[14ch] lg:text-[3.25rem]">
              Where vision meets measurable growth.
            </h1>

            <p className="mt-8 max-w-md text-base leading-relaxed text-slate-700 dark:text-slate-300 sm:text-lg">
              Institutional-grade portfolio management with transparent reporting,
              secure operations, and full investor control.
            </p>

            <div className="mt-10 flex w-full max-w-md flex-col gap-3 sm:max-w-none sm:flex-row sm:justify-center lg:justify-start">
              <Link href="/register" className={cn(marketingPrimaryBtn(), "w-full sm:w-auto")}>
                Start investing
                <ArrowRight className="ml-2 h-4 w-4" aria-hidden />
              </Link>
              <Link href="/login" className={cn(marketingOutlineBtn(), "w-full sm:w-auto")}>
                <LogIn className="mr-2 h-4 w-4" aria-hidden />
                Sign in
              </Link>
            </div>

            <Link href="/investments" className={cn(marketingGhostLink(), "mt-5")}>
              View investment plans
              <ArrowRight className="h-3.5 w-3.5" aria-hidden />
            </Link>
          </div>

          <div className="relative mx-auto w-full max-w-md lg:max-w-none">
            <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl shadow-slate-900/10 ring-1 ring-slate-900/5 dark:border-border dark:bg-card dark:shadow-lg dark:ring-border/50">
              <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-4 py-3 sm:px-5">
                <div className="flex items-center gap-2.5">
                  <Image src="/brand/icon.webp" alt="" width={22} height={22} className="rounded" />
                  <div>
                    <p className="text-xs font-medium text-slate-900">Investor dashboard</p>
                    <p className="text-[10px] text-slate-500">Portfolio overview</p>
                  </div>
                </div>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-[10px] font-medium text-emerald-700">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" aria-hidden />
                  Active
                </span>
              </div>

              <div className="relative aspect-[16/11] sm:aspect-[16/10]">
                <Image
                  src="/brand/financial-planning.jpg"
                  alt="Financial planning and portfolio strategy"
                  fill
                  className="object-cover"
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  priority
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/55 via-transparent to-transparent" />

                <div className="absolute right-3 top-3 rounded-lg border border-white/30 bg-white/95 px-3 py-2.5 shadow-md backdrop-blur-sm sm:right-4 sm:top-4">
                  <div className="flex items-center gap-2">
                    <BarChart3 className="h-4 w-4 text-emerald-600" aria-hidden />
                    <div>
                      <p className="text-[10px] font-medium uppercase tracking-wider text-slate-500">
                        YTD return
                      </p>
                      <p className="text-base font-semibold tabular-nums text-slate-900">+24.8%</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 divide-x divide-slate-200 border-t border-slate-200 bg-white">
                {portfolioSnapshot.map((item) => (
                  <div key={item.label} className="px-2 py-3.5 text-center sm:px-4 sm:py-4">
                    <p
                      className={cn(
                        "text-sm font-semibold tabular-nums sm:text-base",
                        item.positive ? "text-emerald-600" : "text-slate-900",
                      )}
                    >
                      {item.value}
                    </p>
                    <p className="mt-0.5 text-[10px] font-medium uppercase tracking-wider text-slate-500">
                      {item.label}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
