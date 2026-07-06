"use client";

import { Award, Globe2, Shield, Users } from "lucide-react";
import Image from "next/image";
import { section } from "@/components/marketing/marketing-ui";

/** Platform capabilities — distinct from hero dashboard preview and about-page company stats */
const platformStats = [
  { label: "Investment tiers", value: "4", suffix: "plans" },
  { label: "Transaction history", value: "Full", suffix: "audit trail" },
  { label: "Referral program", value: "10%", suffix: "commission" },
  { label: "Investor support", value: "Dedicated", suffix: "team" },
];

/** Company track record — used on About, not duplicated on homepage */
export const companyStats = [
  { label: "Assets under management", value: "$12M+", suffix: "" },
  { label: "Years of service", value: "9+", suffix: "years" },
  { label: "Global markets", value: "72+", suffix: "markets" },
  { label: "Client access", value: "24/7", suffix: "portal" },
];

export function StatsBar({ stats = platformStats }: { stats?: typeof platformStats }) {
  return (
    <section className="border-y border-border/50 bg-primary text-primary-foreground" aria-label="Platform highlights">
      <div className="mx-auto grid max-w-7xl grid-cols-2 gap-6 px-4 py-10 sm:gap-8 sm:px-6 sm:py-12 md:grid-cols-4 lg:px-8">
        {stats.map((stat) => (
          <div key={stat.label} className="text-center md:text-left">
            <p className="text-2xl font-semibold tabular-nums tracking-tight sm:text-3xl lg:text-4xl">
              {stat.value}
              {stat.suffix ? (
                <span className="ml-1.5 text-xs font-normal text-primary-foreground/65 sm:text-sm">
                  {stat.suffix}
                </span>
              ) : null}
            </p>
            <p className="mt-1.5 text-xs text-primary-foreground/65 sm:text-sm">{stat.label}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

export function CompanyStatsBar() {
  return <StatsBar stats={companyStats} />;
}

const pillars = [
  {
    icon: Shield,
    title: "Security & compliance",
    text: "Enterprise-grade infrastructure with audit logging, encrypted storage, and role-based access control.",
  },
  {
    icon: Globe2,
    title: "Global perspective",
    text: "Diversified investment opportunities designed for investors who think beyond borders.",
  },
  {
    icon: Users,
    title: "Client-first service",
    text: "Dedicated support and transparent communication at every stage of your investment journey.",
  },
  {
    icon: Award,
    title: "Proven track record",
    text: "A history of helping clients build wealth through disciplined, transparent portfolio management.",
  },
];

export function TrustSection() {
  return (
    <section className={section.padding}>
      <div className={section.container}>
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
          <div className="relative aspect-[4/3] overflow-hidden rounded-xl border border-border/60 shadow-md">
            <Image
              src="/brand/trust.jpg"
              alt="Professional financial team"
              fill
              className="object-cover"
              sizes="(max-width: 1024px) 100vw, 50vw"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 to-transparent" />
            <div className="absolute bottom-5 left-5 right-5 rounded-lg border border-white/15 bg-slate-950/50 px-4 py-3 backdrop-blur-sm">
              <p className="text-sm font-medium leading-snug text-white">
                &ldquo;Transparency isn&apos;t a feature — it&apos;s our foundation.&rdquo;
              </p>
            </div>
          </div>

          <div>
            <p className={section.eyebrow}>Why Unique Sky Way</p>
            <h2 className={section.heading}>Built for investors who demand more</h2>
            <p className={section.body}>
              We combine institutional discipline with a modern digital experience —
              giving you full visibility into your portfolio, transactions, and returns.
            </p>

            <div className="mt-10 grid gap-6 sm:grid-cols-2">
              {pillars.map((item) => (
                <div key={item.title} className="flex gap-3.5">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-border/60 bg-muted/50 text-primary">
                    <item.icon className="h-4 w-4" aria-hidden />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold">{item.title}</h3>
                    <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                      {item.text}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
