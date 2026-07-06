import { MarketingLayout } from "@/components/layout/marketing-layout";
import { PageHero } from "@/components/marketing/page-hero";

const sections = [
  {
    title: "Acceptance of Terms",
    content: `By accessing or using the Unique Sky Way platform at uniqueskyway.com, you agree to be bound by these Terms of Service. If you do not agree, please do not use our services.`,
  },
  {
    title: "Eligibility",
    content: `You must be at least 18 years of age and legally capable of entering into binding agreements to use our platform. You are responsible for ensuring that your use of our services complies with applicable laws in your jurisdiction.`,
  },
  {
    title: "Account Registration",
    content: `You agree to provide accurate and complete information when creating an account. You are responsible for maintaining the confidentiality of your login credentials and for all activities under your account.`,
  },
  {
    title: "Investment Services",
    content: `Unique Sky Way provides investment and financial services including portfolio management, deposit processing, return distribution, and referral programs. Investment returns are subject to the terms of your selected plan. Past performance does not guarantee future results.`,
  },
  {
    title: "Deposits & Withdrawals",
    content: `Deposits and withdrawal requests are subject to platform review and approval. Minimum withdrawal amounts and processing times may apply. All financial transactions are recorded in our immutable ledger system.`,
  },
  {
    title: "Referral Program",
    content: `Referral bonuses are earned when referred users make qualifying deposits. Abuse of the referral program, including self-referrals or fraudulent activity, may result in account suspension and forfeiture of bonuses.`,
  },
  {
    title: "Prohibited Activities",
    content: `You may not use our platform for money laundering, fraud, unauthorized access, or any activity that violates applicable law. We reserve the right to suspend or terminate accounts involved in prohibited activities.`,
  },
  {
    title: "Limitation of Liability",
    content: `To the maximum extent permitted by law, Unique Sky Way shall not be liable for indirect, incidental, or consequential damages arising from your use of the platform. Our total liability is limited to the amount of fees paid by you in the preceding twelve months.`,
  },
  {
    title: "Modifications",
    content: `We may modify these terms at any time. Continued use of the platform after changes constitutes acceptance. Material changes will be communicated via email or platform notification.`,
  },
  {
    title: "Contact",
    content: `Questions about these terms? Contact us at info@uniqueskyway.com.`,
  },
];

export default function TermsPage() {
  return (
    <MarketingLayout>
      <PageHero
        subtitle="Legal"
        title="Terms of Service"
        description="The terms governing your use of the Unique Sky Way investment platform."
        image="/brand/corporate.jpg"
        imageAlt="Terms of service"
        align="center"
      />

      <section className="py-20">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <p className="text-sm text-muted-foreground">
            Last updated: July 2026
          </p>

          <div className="mt-12 space-y-10">
            {sections.map((section) => (
              <div key={section.title}>
                <h2 className="text-xl font-semibold">{section.title}</h2>
                <p className="mt-3 text-muted-foreground leading-relaxed">
                  {section.content}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </MarketingLayout>
  );
}
