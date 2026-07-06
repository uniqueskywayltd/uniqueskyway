import Image from "next/image";
import { Eye, FileCheck, KeyRound, Lock, Server, ShieldCheck } from "lucide-react";
import { MarketingLayout } from "@/components/layout/marketing-layout";
import { CtaBanner, SplitContent } from "@/components/marketing/content-blocks";
import { PageHero } from "@/components/marketing/page-hero";
import { Card, CardContent } from "@/components/ui/card";

const securityFeatures = [
  {
    icon: Lock,
    title: "Encrypted Connections",
    description:
      "All data transmitted between your browser and our platform is protected with TLS encryption.",
  },
  {
    icon: KeyRound,
    title: "Secure Authentication",
    description:
      "Enterprise-grade authentication with session management, login history, and account protection.",
  },
  {
    icon: Server,
    title: "Immutable Ledger",
    description:
      "Financial balances are derived from an immutable ledger — every credit and debit is permanently recorded.",
  },
  {
    icon: Eye,
    title: "Full Audit Trail",
    description:
      "Comprehensive audit logging tracks all administrative actions and financial operations for accountability.",
  },
  {
    icon: FileCheck,
    title: "Role-Based Access",
    description:
      "Administrative access is controlled through granular permissions — only authorized staff can perform sensitive actions.",
  },
  {
    icon: ShieldCheck,
    title: "Insured Operations",
    description:
      "Our company maintains insurance coverage through world-class providers in the investment sector.",
  },
];

const practices = [
  "Row-level security on all database tables",
  "Feature flags to control platform capabilities at launch",
  "Deposit and withdrawal requests require administrative approval",
  "All financial movements recorded with reference IDs",
  "Login history tracked for account security",
  "Document storage with access-controlled buckets",
];

export default function SecurityPage() {
  return (
    <MarketingLayout>
      <PageHero
        subtitle="Security & Trust"
        title="Your security is our priority"
        description="We are trusted by a large community of investors. We work constantly to improve our security systems and minimize possible risks."
        image="/brand/security.jpg"
        imageAlt="Platform security"
      />

      <section className="py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {securityFeatures.map((feature) => (
              <Card key={feature.title} className="border-border/60">
                <CardContent className="p-6">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <feature.icon className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="mt-4 font-semibold">{feature.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                    {feature.description}
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
            image="/brand/trust.jpg"
            imageAlt="Trust and compliance"
            title="Built for institutional standards"
            subtitle="Infrastructure"
          >
            <p>
              The new Unique Sky Way platform is engineered from the ground up with
              financial-grade security. Unlike legacy systems, balances are never stored
              directly — they are computed from an immutable double-entry ledger.
            </p>
            <p>
              Every deposit, withdrawal, referral bonus, and return is recorded as a
              permanent ledger entry with full traceability.
            </p>
          </SplitContent>
        </div>
      </section>

      <section className="py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <div>
              <p className="text-sm font-medium uppercase tracking-widest text-primary">
                Our Practices
              </p>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight">
                Security by design
              </h2>
              <p className="mt-4 text-muted-foreground">
                Security is not an afterthought — it is embedded in every layer of our
                platform architecture.
              </p>
              <ul className="mt-8 space-y-3">
                {practices.map((practice) => (
                  <li key={practice} className="flex items-start gap-3 text-sm text-muted-foreground">
                    <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    {practice}
                  </li>
                ))}
              </ul>
            </div>
            <div className="relative aspect-[4/3] overflow-hidden rounded-2xl shadow-xl">
              <Image
                src="/brand/cert.jpg"
                alt="Company certification"
                fill
                className="object-contain bg-white p-6"
                sizes="50vw"
              />
            </div>
          </div>
        </div>
      </section>

      <CtaBanner
        title="Invest with confidence"
        description="Join a platform where security, transparency, and auditability are foundational — not optional."
        primaryLabel="Open account"
        secondaryLabel="Contact support"
        secondaryHref="/contact"
      />
    </MarketingLayout>
  );
}
