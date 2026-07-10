"use client";

import { Award, Globe2, Shield, Users } from "lucide-react";
import Image from "next/image";
import { section } from "@/components/marketing/marketing-ui";

/** Homepage credibility metrics — investor community & track record */
export const homepageStats = [
  { label: "Assets under management", value: "$250M+", suffix: "" },
  { label: "Active investors worldwide", value: "8,930+", suffix: "" },
  { label: "Years serving clients", value: "9+", suffix: "since 2017" },
  { label: "Investor portal access", value: "24/7", suffix: "" },
] as const;

/** Company track record — About page & shared marketing */
export const companyStats = [
  { label: "Assets under management", value: "$250M+", suffix: "" },
  { label: "Active investors worldwide", value: "8,930+", suffix: "" },
  { label: "Years of service", value: "9+", suffix: "since 2017" },
  { label: "Global markets covered", value: "72+", suffix: "markets" },
] as const;

type StatItem = { label: string; value: string; suffix: string };

export function StatsBar({ stats = homepageStats }: { stats?: readonly StatItem[] }) {
  return (
    <section
      className="border-y border-border/50 bg-primary text-primary-foreground"
      aria-label="Platform highlights"
    >
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
        <div className="grid grid-cols-2 gap-x-6 gap-y-8 sm:gap-x-8 md:grid-cols-4 md:gap-y-0">
          {stats.map((stat, index) => (
            <div
              key={stat.label}
              className={`text-center md:text-left ${
                index < stats.length - 1
                  ? "md:border-r md:border-primary-foreground/15 md:pr-6 lg:pr-8"
                  : ""
              }`}
            >
              <p className="text-xl font-semibold tabular-nums tracking-tight sm:text-2xl lg:text-3xl">
                {stat.value}
              </p>
              {stat.suffix ? (
                <p className="mt-0.5 text-[10px] font-medium uppercase tracking-wider text-primary-foreground/55 sm:text-xs">
                  {stat.suffix}
                </p>
              ) : null}
              <p className="mt-1.5 text-[11px] leading-snug text-primary-foreground/70 sm:text-sm">
                {stat.label}
              </p>
            </div>
          ))}
        </div>
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
