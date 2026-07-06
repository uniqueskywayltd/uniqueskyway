import Image from "next/image";
import { cn } from "@/lib/utils";

type PageHeroProps = {
  title: string;
  subtitle?: string;
  description?: string;
  image?: string;
  imageAlt?: string;
  overlay?: "dark" | "light" | "gradient";
  align?: "left" | "center";
  className?: string;
  children?: React.ReactNode;
};

export function PageHero({
  title,
  subtitle,
  description,
  image = "/brand/global-markets.jpg",
  imageAlt = "Unique Sky Way",
  overlay = "gradient",
  align = "left",
  className,
  children,
}: PageHeroProps) {
  const overlayClass = {
    dark: "bg-slate-950/80",
    light: "bg-white/85",
    gradient: "bg-gradient-to-r from-slate-950/92 via-slate-950/75 to-slate-950/50",
  }[overlay];

  return (
    <section className={cn("relative overflow-hidden", className)}>
      <div className="absolute inset-0 -z-10">
        <Image
          src={image}
          alt={imageAlt}
          fill
          priority
          className="object-cover"
          sizes="100vw"
        />
        <div className={cn("absolute inset-0", overlayClass)} />
      </div>

      <div
        className={cn(
          "mx-auto max-w-7xl px-4 py-20 sm:px-6 sm:py-24 lg:px-8 lg:py-28",
          align === "center" && "text-center",
        )}
      >
        {subtitle ? (
          <p className="text-xs font-medium uppercase tracking-[0.14em] text-slate-300">
            {subtitle}
          </p>
        ) : null}
        <h1
          className={cn(
            "mt-3 max-w-3xl text-3xl font-semibold leading-[1.12] tracking-tight text-white sm:text-4xl lg:text-5xl",
            align === "center" && "mx-auto",
          )}
        >
          {title}
        </h1>
        {description ? (
          <p
            className={cn(
              "mt-5 max-w-2xl text-base leading-relaxed text-slate-300 sm:text-lg",
              align === "center" && "mx-auto",
            )}
          >
            {description}
          </p>
        ) : null}
        {children ? <div className="mt-8">{children}</div> : null}
      </div>
    </section>
  );
}
