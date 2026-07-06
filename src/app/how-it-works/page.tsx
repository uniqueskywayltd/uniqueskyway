import Link from "next/link";
import Image from "next/image";
import { CheckCircle2 } from "lucide-react";
import { MarketingLayout } from "@/components/layout/marketing-layout";
import { CtaBanner, ProcessSteps, SplitContent } from "@/components/marketing/content-blocks";
import { PageHero } from "@/components/marketing/page-hero";
import { buttonVariants } from "@/components/ui/button";

const steps = [
  {
    step: 1,
    title: "Register your account",
    description:
      "Create a secure investor profile with email verification. Your account is protected with enterprise-grade authentication.",
    image: "/brand/office.jpg",
  },
  {
    step: 2,
    title: "Complete your profile",
    description:
      "Add your details and review our investment tiers. Our team can help you choose the plan that fits your goals.",
    image: "/brand/meeting.jpg",
  },
  {
    step: 3,
    title: "Make your deposit",
    description:
      "Fund your account through our secure deposit process. All transactions are logged and visible in your dashboard.",
    image: "/brand/investments.jpg",
  },
  {
    step: 4,
    title: "Activate your investment",
    description:
      "Select a plan and activate your portfolio. Returns are credited according to your chosen tier's schedule.",
    image: "/brand/strategy.jpg",
  },
];

const highlights = [
  "Full transaction history visible in your investor dashboard",
  "Referral bonuses when you invite others to the platform",
  "Withdrawal requests processed promptly once approved",
  "Dedicated support at info@uniqueskyway.com",
  "Transparent reporting with no hidden fees",
];

export default function HowItWorksPage() {
  return (
    <MarketingLayout>
      <PageHero
        subtitle="How It Works"
        title="Your path from signup to portfolio growth"
        description="A clear, four-step process designed for transparency. No complexity — just a straightforward way to invest with confidence."
        image="/brand/global-markets.jpg"
        imageAlt="Investment portfolio"
        align="center"
      />

      <section className="py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <ProcessSteps steps={steps} />
        </div>
      </section>

      <section className="bg-muted/30 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SplitContent
            image="/brand/financial-planning.jpg"
            imageAlt="Financial planning session"
            title="We put together a custom plan"
            subtitle="Personalized Approach"
          >
            <p>
              Every investor is different. We take time to understand your financial goals,
              risk tolerance, and timeline before recommending an investment tier.
            </p>
            <p>
              Once your plan is active, you can monitor performance, track referrals, and
              manage withdrawals — all from a single, secure dashboard.
            </p>
          </SplitContent>
        </div>
      </section>

      <section className="py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <div>
              <p className="text-sm font-medium uppercase tracking-widest text-primary">
                What You Get
              </p>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight">
                Everything in one place
              </h2>
              <p className="mt-4 text-muted-foreground">
                Your investor dashboard gives you complete visibility and control over
                your account.
              </p>
              <ul className="mt-8 space-y-3">
                {highlights.map((item) => (
                  <li key={item} className="flex items-start gap-3">
                    <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                    <span className="text-sm text-muted-foreground">{item}</span>
                  </li>
                ))}
              </ul>
              <Link href="/register" className={buttonVariants({ className: "mt-8" })}>
                Get started
              </Link>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-4">
                <div className="relative aspect-square overflow-hidden rounded-2xl shadow-lg">
                  <Image
                    src="/brand/global-markets.jpg"
                    alt="Global markets"
                    fill
                    className="object-cover"
                    sizes="300px"
                  />
                </div>
                <div className="relative aspect-[4/3] overflow-hidden rounded-2xl shadow-lg">
                  <Image
                    src="/brand/corporate.jpg"
                    alt="Corporate management"
                    fill
                    className="object-cover"
                    sizes="300px"
                  />
                </div>
              </div>
              <div className="space-y-4 pt-8">
                <div className="relative aspect-[4/3] overflow-hidden rounded-2xl shadow-lg">
                  <Image
                    src="/brand/energy.jpg"
                    alt="Energy investments"
                    fill
                    className="object-cover"
                    sizes="300px"
                  />
                </div>
                <div className="relative aspect-square overflow-hidden rounded-2xl shadow-lg">
                  <Image
                    src="/brand/advisory.jpg"
                    alt="Advisory services"
                    fill
                    className="object-cover"
                    sizes="300px"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <CtaBanner
        title="Start your investment journey today"
        description="Create your free account and take the first step toward portfolio diversification."
      />
    </MarketingLayout>
  );
}
