import Image from "next/image";
import Link from "next/link";
import { MarketingLayout } from "@/components/layout/marketing-layout";
import { FaqAccordion } from "@/components/marketing/faq-accordion";
import { PageHero } from "@/components/marketing/page-hero";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const faqItems = [
  {
    question: "How do I create an account?",
    answer:
      "Click 'Open account' and complete the registration form with your name, email, username, and a profile photo. You'll receive a confirmation email at the address you provide. Once verified, you can log in to your investor dashboard.",
  },
  {
    question: "How do I make a deposit?",
    answer:
      "After logging in, navigate to the Deposit section of your dashboard. Select your investment plan, enter the amount and transaction reference, then submit. Your deposit will be reviewed and activated once confirmed by our team.",
  },
  {
    question: "How do withdrawals work?",
    answer:
      "From your dashboard, go to Withdrawals, enter the amount, select your payment method (BTC or USDT), and provide your wallet address and network. Withdrawal requests are processed after admin verification, typically within 24 hours.",
  },
  {
    question: "What investment plans are available?",
    answer:
      "We offer Silver, Gold, Classic, and Master plans — each with different minimum deposits, durations, and return structures. Visit our Investments page for full details on each plan.",
  },
  {
    question: "How does the referral program work?",
    answer:
      "Each account has a unique referral link. When someone registers and makes a deposit using your link, you earn a referral commission credited to your account automatically upon deposit approval.",
  },
  {
    question: "Is my investment secure?",
    answer:
      "Yes. We use enterprise-grade security including encrypted authentication, audit logging, role-based access control, and immutable financial ledger records. Every transaction is tracked and auditable.",
  },
  {
    question: "How can I contact support?",
    answer:
      "Reach us anytime at info@uniqueskyway.com. Our team is available to assist with account issues, deposits, withdrawals, and general investment inquiries.",
  },
];

export default function FaqPage() {
  return (
    <MarketingLayout>
      <PageHero
        subtitle="Help Center"
        title="Frequently asked questions"
        description="Everything you need to know about investing with Unique Sky Way."
        image="/brand/trust.jpg"
        imageAlt="Support and guidance"
        align="center"
      />

      <section className="py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-12 lg:grid-cols-5">
            <div className="lg:col-span-2">
              <div className="sticky top-24">
                <div className="relative aspect-[3/4] overflow-hidden rounded-2xl shadow-xl">
                  <Image
                    src="/brand/about-2.jpg"
                    alt="Customer support"
                    fill
                    className="object-cover"
                    sizes="(max-width: 1024px) 100vw, 40vw"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 to-transparent" />
                  <div className="absolute bottom-6 left-6 right-6">
                    <p className="text-lg font-medium text-white">Still have questions?</p>
                    <p className="mt-2 text-sm text-white/70">
                      Our team is here to help you every step of the way.
                    </p>
                    <Link
                      href="mailto:info@uniqueskyway.com"
                      className={cn(
                        buttonVariants(),
                        "mt-4 w-full bg-white text-primary hover:bg-white/90",
                      )}
                    >
                      Contact support
                    </Link>
                  </div>
                </div>
              </div>
            </div>

            <div className="lg:col-span-3">
              <FaqAccordion items={faqItems} />
            </div>
          </div>
        </div>
      </section>
    </MarketingLayout>
  );
}
