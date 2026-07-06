import Link from "next/link";
import { Gift, Share2, TrendingUp, Users } from "lucide-react";
import { MarketingLayout } from "@/components/layout/marketing-layout";
import { CtaBanner, SplitContent } from "@/components/marketing/content-blocks";
import { PageHero } from "@/components/marketing/page-hero";
import { Card, CardContent } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";

const tiers = [
  {
    title: "Standard Referral",
    bonus: "10%",
    description:
      "Earn a 10% referral bonus on deposits made by investors you refer to the platform.",
    icon: Share2,
  },
  {
    title: "Growing Network",
    bonus: "Ongoing",
    description:
      "Build your referral network and track earnings in real time through your investor dashboard.",
    icon: Users,
  },
  {
    title: "Regional Representative",
    bonus: "Premium",
    description:
      "Qualified representatives with 50+ active downlines unlock salary bonuses, loan access, and exclusive rewards.",
    icon: Gift,
  },
];

const steps = [
  "Register and receive your unique referral link",
  "Share your link with friends, family, or colleagues",
  "When they deposit and invest, you earn a referral bonus",
  "Track all referral earnings in your dashboard",
];

export default function ReferralsPage() {
  return (
    <MarketingLayout>
      <PageHero
        subtitle="Referral Program"
        title="Grow together, earn together"
        description="Invite others to Unique Sky Way and earn referral bonuses on their deposits. The more you share, the more you grow."
        image="/brand/meeting.jpg"
        imageAlt="Referral program"
      />

      <section className="py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <p className="text-sm font-medium uppercase tracking-widest text-primary">
              Program Tiers
            </p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight">
              Rewards that scale with your network
            </h2>
          </div>

          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {tiers.map((tier) => (
              <Card key={tier.title} className="border-border/60 text-center">
                <CardContent className="p-8">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                    <tier.icon className="h-6 w-6 text-primary" />
                  </div>
                  <p className="mt-4 text-3xl font-semibold text-primary">{tier.bonus}</p>
                  <h3 className="mt-2 font-semibold">{tier.title}</h3>
                  <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
                    {tier.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-muted/30 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SplitContent
            image="/brand/global-markets.jpg"
            imageAlt="Global referral network"
            title="How referrals work"
            subtitle="Simple & Transparent"
          >
            <ol className="space-y-4">
              {steps.map((step, i) => (
                <li key={step} className="flex items-start gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
                    {i + 1}
                  </span>
                  <span>{step}</span>
                </li>
              ))}
            </ol>
          </SplitContent>
        </div>
      </section>

      <section className="py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="rounded-2xl border border-border/60 bg-card p-8 sm:p-12">
            <div className="flex flex-col items-start gap-6 lg:flex-row lg:items-center lg:justify-between">
              <div className="max-w-xl">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  <p className="text-sm font-medium uppercase tracking-widest text-primary">
                    Regional Representative
                  </p>
                </div>
                <h2 className="mt-3 text-2xl font-semibold">
                  50 Active Downlines — Premium Benefits
                </h2>
                <p className="mt-4 text-muted-foreground leading-relaxed">
                  Regional representatives who build a network of 50 active downlines
                  generating $200,000 in total volume unlock premium benefits including a
                  $2,000 salary, 10% referral bonus, loan availability up to $10,000,
                  and exclusive rewards.
                </p>
              </div>
              <Link href="/register" className={buttonVariants({ size: "lg" })}>
                Join the program
              </Link>
            </div>
          </div>
        </div>
      </section>

      <CtaBanner
        title="Start referring today"
        description="Create your account, get your referral link, and begin earning bonuses on every successful referral."
        primaryLabel="Create account"
        secondaryLabel="Learn more"
        secondaryHref="/how-it-works"
      />
    </MarketingLayout>
  );
}
