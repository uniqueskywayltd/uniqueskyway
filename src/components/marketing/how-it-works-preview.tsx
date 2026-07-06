import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";
import { card, marketingPrimaryBtn, section } from "@/components/marketing/marketing-ui";
import { cn } from "@/lib/utils";

const steps = [
  {
    step: 1,
    title: "Create your account",
    description: "Register in minutes with secure authentication and profile setup.",
    image: "/brand/contact.jpg",
  },
  {
    step: 2,
    title: "Choose your plan",
    description: "Select an investment tier that matches your goals and deposit amount.",
    image: "/brand/corporate.jpg",
  },
  {
    step: 3,
    title: "Fund & invest",
    description: "Deposit funds and activate your portfolio through our secure dashboard.",
    image: "/brand/banking.jpg",
  },
  {
    step: 4,
    title: "Track & grow",
    description: "Monitor returns, request withdrawals, and refer others to earn bonuses.",
    image: "/brand/real-estate.jpg",
  },
];

export function HowItWorksPreview() {
  return (
    <section className={cn("bg-muted/30", section.padding)}>
      <div className={section.container}>
        <div className="text-center">
          <p className={section.eyebrow}>Simple process</p>
          <h2 className={section.heading}>How it works</h2>
          <p className={section.bodyCenter}>
            From account creation to portfolio growth — a straightforward path designed
            for clarity and confidence.
          </p>
        </div>

        <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:mt-14 lg:grid-cols-4 lg:gap-6">
          {steps.map((step) => (
            <div key={step.step} className="group flex flex-col">
              <div className={cn(card.base, "relative mb-4 aspect-[4/3]")}>
                <Image
                  src={step.image}
                  alt={step.title}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-[1.02]"
                  sizes="(max-width: 768px) 100vw, 25vw"
                />
                <div className="absolute left-4 top-4 flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-sm font-semibold text-primary-foreground shadow-sm">
                  {step.step}
                </div>
              </div>
              <h3 className="text-sm font-semibold sm:text-base">{step.title}</h3>
              <p className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground">
                {step.description}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-12 text-center lg:mt-14">
          <Link href="/how-it-works" className={marketingPrimaryBtn()}>
            See full process
            <ArrowRight className="ml-2 h-4 w-4" aria-hidden />
          </Link>
        </div>
      </div>
    </section>
  );
}
