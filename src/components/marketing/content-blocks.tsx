import Image from "next/image";
import Link from "next/link";
import { card, marketingOutlineBtn, marketingPrimaryBtn } from "@/components/marketing/marketing-ui";
import { cn } from "@/lib/utils";

type ImageCardProps = {
  image: string;
  alt: string;
  title: string;
  description?: string;
  href?: string;
  tag?: string;
  className?: string;
};

export function ImageCard({
  image,
  alt,
  title,
  description,
  href,
  tag,
  className,
}: ImageCardProps) {
  const content = (
    <div className={cn(card.base, "group", className)}>
      <div className="relative aspect-[4/3] overflow-hidden">
        <Image
          src={image}
          alt={alt}
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-[1.02]"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/75 via-slate-950/15 to-transparent" />
        {tag ? (
          <span className="absolute left-4 top-4 rounded-md border border-white/15 bg-slate-950/40 px-2.5 py-0.5 text-[11px] font-medium uppercase tracking-wide text-white/90 backdrop-blur-sm">
            {tag}
          </span>
        ) : null}
        <div className="absolute bottom-0 left-0 right-0 p-5">
          <h3 className="text-base font-semibold text-white sm:text-lg">{title}</h3>
          {description ? (
            <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-white/70">
              {description}
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-xl">
        {content}
      </Link>
    );
  }
  return content;
}

type PhotoGridProps = {
  items: Array<{
    image: string;
    alt: string;
    title: string;
    description?: string;
    href?: string;
    tag?: string;
  }>;
  columns?: 2 | 3 | 4;
};

export function PhotoGrid({ items, columns = 3 }: PhotoGridProps) {
  const gridClass = {
    2: "md:grid-cols-2",
    3: "md:grid-cols-2 lg:grid-cols-3",
    4: "md:grid-cols-2 lg:grid-cols-4",
  }[columns];

  return (
    <div className={cn("grid gap-5 sm:gap-6", gridClass)}>
      {items.map((item) => (
        <ImageCard key={item.title} {...item} />
      ))}
    </div>
  );
}

type SplitContentProps = {
  image: string;
  imageAlt: string;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  reverse?: boolean;
};

export function SplitContent({
  image,
  imageAlt,
  title,
  subtitle,
  children,
  reverse,
}: SplitContentProps) {
  return (
    <div
      className={cn(
        "grid items-center gap-12 lg:grid-cols-2 lg:gap-16",
        reverse && "lg:[&>*:first-child]:order-2",
      )}
    >
      <div className={cn(card.media, "shadow-md")}>
        <Image src={image} alt={imageAlt} fill className="object-cover" sizes="50vw" />
      </div>
      <div>
        {subtitle ? <p className="text-xs font-medium uppercase tracking-[0.14em] text-primary">{subtitle}</p> : null}
        <h2 className="mt-3 text-3xl font-semibold tracking-tight leading-[1.15]">{title}</h2>
        <div className="mt-6 max-w-xl space-y-4 text-base leading-relaxed text-muted-foreground">
          {children}
        </div>
      </div>
    </div>
  );
}

type ProcessStep = {
  step: number;
  title: string;
  description: string;
  image?: string;
};

export function ProcessSteps({ steps }: { steps: ProcessStep[] }) {
  return (
    <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
      {steps.map((step) => (
        <div key={step.step} className="relative">
          <div className="mb-4 flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-sm font-semibold text-primary-foreground">
            {step.step}
          </div>
          {step.image ? (
            <div className={cn(card.media, "mb-4 aspect-video")}>
              <Image src={step.image} alt={step.title} fill className="object-cover" sizes="300px" />
            </div>
          ) : null}
          <h3 className="text-sm font-semibold">{step.title}</h3>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{step.description}</p>
        </div>
      ))}
    </div>
  );
}

type CtaBannerProps = {
  title: string;
  description: string;
  primaryHref?: string;
  primaryLabel?: string;
  secondaryHref?: string;
  secondaryLabel?: string;
};

export function CtaBanner({
  title,
  description,
  primaryHref = "/register",
  primaryLabel = "Open account",
  secondaryHref = "/contact",
  secondaryLabel = "Contact us",
}: CtaBannerProps) {
  return (
    <section className="relative overflow-hidden bg-primary py-20 text-primary-foreground sm:py-24">
      <div className="absolute inset-0 bg-[url('/brand/banking.jpg')] bg-cover bg-center opacity-[0.08]" />
      <div className="relative mx-auto max-w-3xl px-4 text-center sm:px-6">
        <h2 className="text-3xl font-semibold tracking-tight leading-[1.15] sm:text-4xl">{title}</h2>
        <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-primary-foreground/75">
          {description}
        </p>
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            href={primaryHref}
            className={cn(
              marketingPrimaryBtn(),
              "bg-white text-primary hover:bg-white/90 hover:text-primary",
            )}
          >
            {primaryLabel}
          </Link>
          <Link
            href={secondaryHref}
            className={cn(
              marketingOutlineBtn(),
              "border-white/30 text-white hover:bg-white/10 hover:text-white",
            )}
          >
            {secondaryLabel}
          </Link>
        </div>
      </div>
    </section>
  );
}
