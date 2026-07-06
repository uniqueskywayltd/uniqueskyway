import Link from "next/link";
import { Briefcase, Building2, Landmark, Shield, TrendingUp, Users } from "lucide-react";
import { MarketingLayout } from "@/components/layout/marketing-layout";
import { CtaBanner, PhotoGrid, SplitContent } from "@/components/marketing/content-blocks";
import { PageHero } from "@/components/marketing/page-hero";
import { Card, CardContent } from "@/components/ui/card";

const serviceAreas = [
  {
    image: "/brand/banking.jpg",
    alt: "Banking sector investments",
    title: "Banking & Finance",
    description:
      "Structured financial products with clear reporting so you can make informed portfolio decisions.",
    tag: "Finance",
  },
  {
    image: "/brand/real-estate.jpg",
    alt: "Real estate portfolio",
    title: "Real Estate",
    description:
      "Exposure to property development and real estate ventures built for long-term stability.",
    tag: "Property",
  },
  {
    image: "/brand/global-markets.jpg",
    alt: "Global commodities",
    title: "Global Markets & Commodities",
    description:
      "Diversified access to international markets and commodity opportunities on demand.",
    tag: "Global",
  },
  {
    image: "/brand/corporate.jpg",
    alt: "Corporate management",
    title: "Corporate Management",
    description:
      "Professional oversight of business ventures with disciplined planning and execution.",
    tag: "Management",
  },
  {
    image: "/brand/financial-planning.jpg",
    alt: "Financial planning",
    title: "Financial Planning",
    description:
      "Custom strategies aligned with your goals — we get to know you, then put your money to work.",
    tag: "Planning",
  },
  {
    image: "/brand/energy.jpg",
    alt: "Energy sector",
    title: "Energy & Infrastructure",
    description:
      "Investment exposure to natural energy and infrastructure projects with growth potential.",
    tag: "Energy",
  },
];

const capabilities = [
  {
    icon: Landmark,
    title: "Company Accounting",
    description:
      "Clear, useful financial information on which you can base the right decisions for your portfolio.",
  },
  {
    icon: TrendingUp,
    title: "Portfolio Growth",
    description:
      "Expertly designed investment products focused on superior long-term performance.",
  },
  {
    icon: Shield,
    title: "High Reliability",
    description:
      "Continuous improvements to security systems and risk minimization across all operations.",
  },
  {
    icon: Briefcase,
    title: "Loan Facilities",
    description:
      "Portfolio line of credit options with competitive rates for qualified account holders.",
  },
  {
    icon: Users,
    title: "Client-First Service",
    description:
      "We recognize that our clients are real people with genuine needs and aspirations.",
  },
  {
    icon: Building2,
    title: "Institutional Standards",
    description:
      "Operations backed by comprehensive insurance and audit-ready financial practices.",
  },
];

export default function ServicesPage() {
  return (
    <MarketingLayout>
      <PageHero
        subtitle="Our Services"
        title="What we can do for you"
        description="We get to know the real you, put together a custom plan, and put your money to work across diversified asset classes."
        image="/brand/strategy.jpg"
        imageAlt="Investment strategy"
      />

      <section className="py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SplitContent
            image="/brand/meeting.jpg"
            imageAlt="Banking and financial services"
            title="Areas of practice"
            subtitle="Diversification"
          >
            <p>
              Our esteemed company offers a unique opportunity for portfolio diversification
              through profitable business ventures and successful investment endeavors,
              ensuring long-term financial growth and stability.
            </p>
            <p>
              From banking and real estate to global commodities and energy infrastructure,
              we connect clients to opportunities through our global network, efficient
              logistics, and deep market understanding.
            </p>
          </SplitContent>
        </div>
      </section>

      <section className="bg-muted/30 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <p className="text-sm font-medium uppercase tracking-widest text-primary">
              Investment Sectors
            </p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight">
              Diversified across asset classes
            </h2>
          </div>
          <div className="mt-12">
            <PhotoGrid items={serviceAreas} columns={3} />
          </div>
        </div>
      </section>

      <section className="py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl">
            <p className="text-sm font-medium uppercase tracking-widest text-primary">
              Capabilities
            </p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight">
              Built for serious investors
            </h2>
            <p className="mt-4 text-muted-foreground">
              We strive to provide exceptional service and expertly designed investment
              products with superior long-term performance.
            </p>
          </div>

          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {capabilities.map((item) => (
              <Card key={item.title} className="border-border/60">
                <CardContent className="p-6">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <item.icon className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="mt-4 font-semibold">{item.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                    {item.description}
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
            image="/brand/meeting.jpg"
            imageAlt="Client consultation"
            title="Serving investors is what we do"
            subtitle="Client Support"
            reverse
          >
            <p>
              Our expert team is available to answer your questions and guide you through
              every stage of your investment journey — from plan selection to portfolio
              monitoring and withdrawals.
            </p>
            <p>
              <Link href="/contact" className="font-medium text-primary hover:underline">
                Get in touch
              </Link>{" "}
              and your request will be directed to the right specialist.
            </p>
          </SplitContent>
        </div>
      </section>

      <CtaBanner
        title="Ready to diversify your portfolio?"
        description="Open an account today and explore our investment services with full dashboard visibility."
      />
    </MarketingLayout>
  );
}
