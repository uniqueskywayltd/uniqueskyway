import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";

/** Shared homepage / marketing layout tokens */
export const section = {
  padding: "py-20 sm:py-24",
  paddingDark: "py-20 sm:py-24",
  container: "mx-auto max-w-7xl px-4 sm:px-6 lg:px-8",
  eyebrow: "text-xs font-medium uppercase tracking-[0.14em] text-primary",
  eyebrowLight: "text-xs font-medium uppercase tracking-[0.14em] text-slate-400",
  heading: "mt-3 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl leading-[1.15]",
  headingLight: "mt-3 text-3xl font-semibold tracking-tight text-white sm:text-4xl leading-[1.15]",
  body: "mt-4 max-w-2xl text-base leading-relaxed text-muted-foreground",
  bodyLight: "mt-4 max-w-2xl text-base leading-relaxed text-slate-400",
  bodyCenter: "mx-auto mt-4 max-w-2xl text-center text-base leading-relaxed text-muted-foreground",
} as const;

export const card = {
  base: "overflow-hidden rounded-xl border border-border/60 bg-card shadow-sm transition-shadow duration-300 hover:shadow-md",
  media: "relative aspect-[4/3] overflow-hidden rounded-xl border border-border/60 bg-card shadow-sm",
  dark: "overflow-hidden rounded-xl border border-white/[0.08] bg-slate-950/90 text-slate-200 shadow-sm",
  padding: "p-6 sm:p-7",
} as const;

const btnFocus =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2";

export function marketingPrimaryBtn(className?: string) {
  return cn(
    buttonVariants({ size: "lg" }),
    "h-11 rounded-lg px-7 font-medium shadow-sm transition-all duration-200 hover:shadow-md",
    btnFocus,
    className,
  );
}

export function marketingOutlineBtn(className?: string) {
  return cn(
    buttonVariants({ size: "lg", variant: "outline" }),
    "h-11 rounded-lg border-border/80 bg-transparent px-6 font-medium transition-colors duration-200 hover:bg-muted/40",
    btnFocus,
    className,
  );
}

export function marketingGhostLink(className?: string) {
  return cn(
    "inline-flex items-center gap-1.5 text-sm font-medium text-primary transition-colors duration-200 hover:text-primary/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-sm",
    className,
  );
}

export function marketingHeaderOutlineBtn(className?: string) {
  return cn(
    buttonVariants({ variant: "outline", size: "default" }),
    "h-10 rounded-lg border-border/70 bg-transparent px-5 font-medium transition-colors duration-200 hover:bg-muted/50",
    btnFocus,
    className,
  );
}

export function marketingHeaderPrimaryBtn(className?: string) {
  return cn(
    buttonVariants({ size: "default" }),
    "h-10 rounded-lg px-6 font-medium shadow-sm transition-all duration-200 hover:shadow-md",
    btnFocus,
    className,
  );
}

export function marketingDarkOutlineBtn(className?: string) {
  return cn(
    "inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-lg border border-white/20 bg-white/5 px-6 text-sm font-medium text-white transition-colors duration-200 hover:bg-white/10",
    btnFocus,
    className,
  );
}

export function marketingDarkPrimaryBtn(className?: string) {
  return cn(
    "inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-lg bg-amber-500 px-6 text-sm font-medium text-slate-950 shadow-sm transition-colors duration-200 hover:bg-amber-400",
    btnFocus,
    className,
  );
}
