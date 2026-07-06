import { MarketingLayout } from "@/components/layout/marketing-layout";
import { PageHero } from "@/components/marketing/page-hero";

const sections = [
  {
    title: "Information We Collect",
    content: `We collect information you provide directly when creating an account, making deposits or withdrawals, contacting support, or participating in our referral program. This may include your name, email address, phone number, and financial transaction details.`,
  },
  {
    title: "How We Use Your Information",
    content: `We use your information to operate and improve our platform, process transactions, communicate with you about your account, provide customer support, comply with legal obligations, and prevent fraud or unauthorized access.`,
  },
  {
    title: "Data Security",
    content: `We implement industry-standard security measures including encrypted connections, secure authentication, row-level database security, and comprehensive audit logging. Financial balances are maintained through an immutable ledger system.`,
  },
  {
    title: "Data Sharing",
    content: `We do not sell your personal information. We may share data with service providers who assist in operating our platform (such as hosting, email delivery, and payment processing), subject to confidentiality agreements.`,
  },
  {
    title: "Your Rights",
    content: `You may request access to, correction of, or deletion of your personal data by contacting us at info@uniqueskyway.com. We will respond to legitimate requests within a reasonable timeframe.`,
  },
  {
    title: "Cookies & Analytics",
    content: `We use essential cookies to maintain your session and platform functionality. We may use analytics tools to understand how our platform is used and to improve the user experience.`,
  },
  {
    title: "Changes to This Policy",
    content: `We may update this privacy policy from time to time. Material changes will be communicated through the platform or via email. Continued use of our services after changes constitutes acceptance of the updated policy.`,
  },
  {
    title: "Contact",
    content: `For privacy-related inquiries, contact us at info@uniqueskyway.com or write to Unique Sky Way, Fayetteville, Arkansas, United States.`,
  },
];

export default function PrivacyPage() {
  return (
    <MarketingLayout>
      <PageHero
        subtitle="Legal"
        title="Privacy Policy"
        description="How Unique Sky Way collects, uses, and protects your personal information."
        image="/brand/security.jpg"
        imageAlt="Privacy and security"
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
