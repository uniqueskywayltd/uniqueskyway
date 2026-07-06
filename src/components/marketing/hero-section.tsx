"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight, BarChart3, LogIn, ShieldCheck, TrendingUp, Wallet } from "lucide-react";
import { marketingGhostLink, marketingOutlineBtn, marketingPrimaryBtn } from "@/components/marketing/marketing-ui";
import { cn } from "@/lib/utils";

const trustItems = [
  { icon: ShieldCheck, title: "Bank-grade security", text: "Encrypted sessions & audit logs" },
  { icon: TrendingUp, title: "Transparent returns", text: "Daily ROI in your dashboard" },
  { icon: Wallet, title: "Portfolio control", text: "Deposits, withdrawals & ledger" },
] as const;

/** Dashboard preview cells — sample product UI, not company marketing stats */
const dashboardPreview = [
  { value: "Live", label: "Ledger sync" },
  { value: "4", label: "Plan tiers" },
  { value: "2FA", label: "Account security" },
] as const;

export function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-slate-950">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <Image
          src="/brand/global-markets.jpg"
          alt=""
          fill
          priority
          className="object-cover opacity-[0.14]"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950/40 via-slate-950/85 to-slate-950" />
      </div>

      <div className="mx-auto w-full max-w-7xl px-4 pb-20 pt-12 sm:px-6 sm:pb-24 sm:pt-14 lg:px-8 lg:pb-28 lg:pt-16">
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16 xl:gap-20">
          <div className="flex flex-col items-center text-center lg:items-start lg:text-left">
            <p className="text-xs font-medium uppercase tracking-[0.14em] text-slate-400">
              Established 2017 · Fayetteville, Arkansas
            </p>

            <h1 className="mt-6 max-w-[18ch] text-4xl font-semibold leading-[1.12] tracking-tight text-white sm:text-5xl lg:max-w-[14ch] lg:text-[3.25rem]">
              Where vision meets measurable growth.
            </h1>

            <p className="mt-8 max-w-md text-base leading-relaxed text-slate-400 sm:text-lg">
              Institutional-grade portfolio management with transparent reporting,
              secure operations, and full investor control.
            </p>

            <div className="mt-10 flex w-full max-w-md flex-col gap-3 sm:max-w-none sm:flex-row sm:justify-center lg:justify-start">
              <Link href="/register" className={cn(marketingPrimaryBtn(), "w-full sm:w-auto")}>
                Start investing
                <ArrowRight className="ml-2 h-4 w-4" aria-hidden />
              </Link>
              <Link
                href="/login"
                className={cn(
                  marketingOutlineBtn(),
                  "w-full border-white/20 bg-white/5 text-white hover:bg-white/10 hover:text-white sm:w-auto",
                )}
              >
                <LogIn className="mr-2 h-4 w-4" aria-hidden />
                Sign in
              </Link>
            </div>

            <Link href="/investments" className={cn(marketingGhostLink(), "mt-5 text-slate-400 hover:text-white")}>
              View investment plans
              <ArrowRight className="h-3.5 w-3.5" aria-hidden />
            </Link>

            <div className="mt-10 grid w-full max-w-xl grid-cols-1 gap-3 sm:grid-cols-3">
              {trustItems.map((item) => (
                <div
                  key={item.title}
                  className="rounded-xl border border-white/[0.08] bg-white/[0.03] p-4 text-left"
                >
                  <item.icon className="h-4 w-4 text-amber-400/90" aria-hidden />
                  <p className="mt-2.5 text-sm font-medium text-white">{item.title}</p>
                  <p className="mt-1 text-xs leading-relaxed text-slate-500">{item.text}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-md lg:max-w-none">
            <div className="overflow-hidden rounded-xl border border-white/10 bg-slate-900/80 shadow-xl">
              <div className="flex items-center justify-between border-b border-white/10 px-4 py-3 sm:px-5">
                <div className="flex items-center gap-2.5">
                  <Image src="/brand/icon.webp" alt="" width={22} height={22} className="rounded" />
                  <div>
                    <p className="text-xs font-medium text-white">Investor dashboard</p>
                    <p className="text-[10px] text-slate-500">Portfolio overview</p>
                  </div>
                </div>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-medium text-emerald-400">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" aria-hidden />
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
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/20 to-transparent" />

                <div className="absolute right-3 top-3 rounded-lg border border-white/10 bg-slate-950/90 px-3 py-2.5 sm:right-4 sm:top-4">
                  <div className="flex items-center gap-2">
                    <BarChart3 className="h-4 w-4 text-emerald-400" aria-hidden />
                    <div>
                      <p className="text-[10px] uppercase tracking-wider text-slate-500">YTD return</p>
                      <p className="text-base font-semibold tabular-nums text-white">+24.8%</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 divide-x divide-white/10 border-t border-white/10">
                {dashboardPreview.map((m) => (
                  <div key={m.label} className="px-2 py-4 text-center sm:px-3 sm:py-5">
                    <p className="text-sm font-semibold tabular-nums text-white sm:text-base">
                      {m.value}
                    </p>
                    <p className="mt-0.5 text-[10px] font-medium uppercase tracking-wider text-slate-500">
                      {m.label}
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
