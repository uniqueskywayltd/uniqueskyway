import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { MarketingLayout } from "@/components/layout/marketing-layout";
import { HeroSection } from "@/components/marketing/hero-section";
import { HowItWorksPreview } from "@/components/marketing/how-it-works-preview";
import { PlansPreview } from "@/components/marketing/plans-preview";
import { ServicesPreview } from "@/components/marketing/services-preview";
import { StatsBar, TrustSection } from "@/components/marketing/trust-section";
import { TestimonialsSection } from "@/components/marketing/testimonials-section";
import {
  marketingOutlineBtn,
  marketingPrimaryBtn,
  section,
} from "@/components/marketing/marketing-ui";
import { cn } from "@/lib/utils";

export default function HomePage() {
  return (
    <MarketingLayout>
      <HeroSection />
      <StatsBar />
      <ServicesPreview />
      <TrustSection />
      <HowItWorksPreview />
      <PlansPreview />
      <TestimonialsSection />
      <section className={cn("relative overflow-hidden", section.padding)} aria-label="Get started">
        <div className="absolute inset-0 -z-10 bg-primary" />
        <div className="absolute inset-0 -z-10 bg-[url('/brand/strategy.jpg')] bg-cover bg-center opacity-[0.08]" />
        <div className={section.container}>
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-3xl font-semibold tracking-tight leading-[1.15] text-primary-foreground sm:text-4xl">
              Your portfolio deserves a platform you can trust
            </h2>
            <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-primary-foreground/75">
              Join Unique Sky Way and access a secure investor dashboard with full
              transaction history, referral tracking, and professional support.
            </p>
            <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link
                href="/register"
                className={cn(
                  marketingPrimaryBtn("w-full sm:w-auto"),
                  "bg-white text-primary hover:bg-white/90 hover:text-primary",
                )}
              >
                Create free account
                <ArrowRight className="ml-2 h-4 w-4" aria-hidden />
              </Link>
              <Link
                href="/about"
                className={cn(
                  marketingOutlineBtn("w-full sm:w-auto"),
                  "border-white/25 text-white hover:bg-white/10 hover:text-white",
                )}
              >
                Learn more about us
              </Link>
            </div>
          </div>
        </div>
      </section>
    </MarketingLayout>
  );
}
