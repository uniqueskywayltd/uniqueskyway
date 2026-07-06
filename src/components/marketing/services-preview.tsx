import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { PhotoGrid } from "@/components/marketing/content-blocks";
import { marketingOutlineBtn, section } from "@/components/marketing/marketing-ui";

const services = [
  {
    image: "/brand/banking.jpg",
    alt: "Banking and financial services",
    title: "Banking & Finance",
    description:
      "Clear financial reporting and structured investment products for informed decision-making.",
    tag: "Core",
    href: "/services",
  },
  {
    image: "/brand/real-estate.jpg",
    alt: "Real estate investments",
    title: "Real Estate",
    description:
      "Diversified exposure to property and development projects with long-term growth potential.",
    tag: "Assets",
    href: "/services",
  },
  {
    image: "/brand/global-markets.jpg",
    alt: "Global market access",
    title: "Global Markets",
    description:
      "Access to commodities and international opportunities through our global network.",
    tag: "Global",
    href: "/services",
  },
  {
    image: "/brand/advisory.jpg",
    alt: "Financial advisory",
    title: "Advisory Services",
    description:
      "Personalized guidance to align your portfolio with your financial goals and risk tolerance.",
    tag: "Advisory",
    href: "/services",
  },
];

export function ServicesPreview() {
  return (
    <section className={section.padding}>
      <div className={section.container}>
        <div className="flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-end">
          <div className="max-w-2xl">
            <p className={section.eyebrow}>What we do</p>
            <h2 className={section.heading}>Diversified investment services</h2>
            <p className={section.body}>
              We get to know you, build a custom plan, and put your capital to work across
              multiple asset classes — with transparency at every step.
            </p>
          </div>
          <Link href="/services" className={marketingOutlineBtn("shrink-0")}>
            View all services
            <ArrowRight className="ml-2 h-4 w-4" aria-hidden />
          </Link>
        </div>

        <div className="mt-12 lg:mt-14">
          <PhotoGrid items={services} columns={4} />
        </div>
      </div>
    </section>
  );
}
