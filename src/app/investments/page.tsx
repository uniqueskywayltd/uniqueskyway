import Image from "next/image";
import Link from "next/link";
import { MarketingLayout } from "@/components/layout/marketing-layout";
import { PageHero } from "@/components/marketing/page-hero";
import { PlansPreview } from "@/components/marketing/plans-preview";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { BarChart3, Clock, Shield, Wallet } from "lucide-react";

const features = [
  {
    icon: BarChart3,
    title: "Real-time tracking",
    text: "Monitor your investments, returns, and portfolio performance from a single dashboard.",
  },
  {
    icon: Shield,
    title: "Secure transactions",
    text: "Every deposit and withdrawal is logged, audited, and protected by enterprise security.",
  },
  {
    icon: Clock,
    title: "Flexible durations",
    text: "Choose from multiple plan durations designed to match your investment timeline.",
  },
  {
    icon: Wallet,
    title: "Easy withdrawals",
    text: "Request withdrawals through your dashboard with full transparency on processing status.",
  },
];

export default function InvestmentsPage() {
  return (
    <MarketingLayout>
      <PageHero
        subtitle="Investments"
        title="Plans built for every portfolio size"
        description="From entry-level Silver to premium Master plans — each designed with clear terms, transparent returns, and professional management."
        image="/brand/investments.jpg"
        imageAlt="Investment opportunities"
        align="center"
      />

      <section className="py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <div className="relative aspect-[4/3] overflow-hidden rounded-2xl shadow-2xl">
              <Image
                src="/brand/portfolio.jpg"
                alt="Investment portfolio management"
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 50vw"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 to-transparent" />
              <div className="absolute bottom-6 left-6 right-6">
                <p className="text-lg font-medium text-white">
                  Professional portfolio management
                </p>
                <p className="mt-1 text-sm text-white/70">
                  Transparent terms. Secure operations. Full visibility.
                </p>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {features.map((feature) => (
                <Card key={feature.title} className="border-border/60 bg-card/50">
                  <CardContent className="pt-6">
                    <feature.icon className="mb-3 h-6 w-6 text-primary" />
                    <h3 className="font-medium">{feature.title}</h3>
                    <p className="mt-2 text-sm text-muted-foreground">{feature.text}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      <PlansPreview />

      <section className="bg-primary py-16 text-center text-primary-foreground">
        <div className="mx-auto max-w-2xl px-4">
          <h2 className="text-2xl font-semibold">Ready to start investing?</h2>
          <p className="mt-3 text-primary-foreground/75">
            Create your free account and access our full range of investment plans.
          </p>
          <Link
            href="/register"
            className={cn(buttonVariants(), "mt-6 bg-white text-primary hover:bg-white/90")}
          >
            Open your account
          </Link>
        </div>
      </section>
    </MarketingLayout>
  );
}
