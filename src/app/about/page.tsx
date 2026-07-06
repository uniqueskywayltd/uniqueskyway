import Image from "next/image";
import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { MarketingLayout } from "@/components/layout/marketing-layout";
import { PageHero } from "@/components/marketing/page-hero";
import { StatsBar } from "@/components/marketing/trust-section";
import { buttonVariants } from "@/components/ui/button";

const values = [
  "Transparent investment reporting and real-time portfolio visibility",
  "Secure infrastructure with enterprise-grade authentication",
  "Dedicated client support at info@uniqueskyway.com",
  "Global diversification across multiple asset classes",
  "Disciplined risk management and audit-ready operations",
];

export default function AboutPage() {
  return (
    <MarketingLayout>
      <PageHero
        subtitle="About Us"
        title="Building wealth with integrity"
        description="Unique Sky Way is an international investment and financial services company helping clients diversify their portfolios with successful business projects and strategic investments."
        image="/brand/about-1.jpg"
        imageAlt="Unique Sky Way team"
      />

      <section className="py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid items-center gap-16 lg:grid-cols-2">
            <div className="relative">
              <div className="relative aspect-[4/3] overflow-hidden rounded-2xl shadow-xl">
                <Image
                  src="/brand/office.jpg"
                  alt="Our team at work"
                  fill
                  className="object-cover"
                  sizes="(max-width: 1024px) 100vw, 50vw"
                />
              </div>
              <div className="absolute -bottom-6 -right-6 hidden aspect-square w-48 overflow-hidden rounded-2xl border-4 border-background shadow-xl sm:block">
                <Image
                  src="/brand/about-2.jpg"
                  alt="Financial expertise"
                  fill
                  className="object-cover"
                  sizes="200px"
                />
              </div>
            </div>

            <div>
              <p className="text-sm font-medium uppercase tracking-widest text-primary">
                Our Story
              </p>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight">
                A decade of trusted financial services
              </h2>
              <p className="mt-4 text-muted-foreground leading-relaxed">
                Our company brings you an opportunity to diversify your portfolio with
                successful business projects and investments. We forge robust connections
                through our global network, efficient logistics, and unparalleled market
                understanding.
              </p>
              <p className="mt-4 text-muted-foreground leading-relaxed">
                We invest for the benefit of future generations of investors — combining
                institutional discipline with a modern digital experience built for 2026.
              </p>

              <ul className="mt-8 space-y-3">
                {values.map((value) => (
                  <li key={value} className="flex items-start gap-3">
                    <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                    <span className="text-sm text-muted-foreground">{value}</span>
                  </li>
                ))}
              </ul>

              <Link href="/register" className={buttonVariants({ className: "mt-8" })}>
                Start your journey
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-muted/30 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <div>
              <p className="text-sm font-medium uppercase tracking-widest text-primary">
                Credentials
              </p>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight">
                Committed to excellence
              </h2>
              <p className="mt-4 text-muted-foreground">
                We maintain the highest standards of operational integrity, with
                comprehensive audit logging, secure infrastructure, and transparent
                client communication at every step.
              </p>
            </div>
            <div className="relative aspect-[3/2] overflow-hidden rounded-2xl shadow-lg">
              <Image
                src="/brand/cert.jpg"
                alt="Company certification"
                fill
                className="object-contain bg-white p-4"
                sizes="(max-width: 1024px) 100vw, 50vw"
              />
            </div>
          </div>
        </div>
      </section>

      <StatsBar />
    </MarketingLayout>
  );
}
