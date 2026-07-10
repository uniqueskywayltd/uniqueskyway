import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export type StatCardAccent =
  | "primary"
  | "sky"
  | "emerald"
  | "amber"
  | "violet"
  | "rose"
  | "slate";

const accentStyles: Record<
  StatCardAccent,
  { bar: string; icon: string; hover: string }
> = {
  primary: {
    bar: "from-primary/70 via-primary/40 to-transparent",
    icon: "bg-primary/10 text-primary ring-primary/15",
    hover: "hover:border-primary/30 hover:shadow-primary/5",
  },
  sky: {
    bar: "from-sky-500/70 via-sky-400/35 to-transparent",
    icon: "bg-sky-500/10 text-sky-600 ring-sky-500/15 dark:text-sky-400",
    hover: "hover:border-sky-500/25 hover:shadow-sky-500/5",
  },
  emerald: {
    bar: "from-emerald-500/70 via-emerald-400/35 to-transparent",
    icon: "bg-emerald-500/10 text-emerald-600 ring-emerald-500/15 dark:text-emerald-400",
    hover: "hover:border-emerald-500/25 hover:shadow-emerald-500/5",
  },
  amber: {
    bar: "from-amber-500/70 via-amber-400/35 to-transparent",
    icon: "bg-amber-500/10 text-amber-600 ring-amber-500/15 dark:text-amber-400",
    hover: "hover:border-amber-500/25 hover:shadow-amber-500/5",
  },
  violet: {
    bar: "from-violet-500/70 via-violet-400/35 to-transparent",
    icon: "bg-violet-500/10 text-violet-600 ring-violet-500/15 dark:text-violet-400",
    hover: "hover:border-violet-500/25 hover:shadow-violet-500/5",
  },
  rose: {
    bar: "from-rose-500/70 via-rose-400/35 to-transparent",
    icon: "bg-rose-500/10 text-rose-600 ring-rose-500/15 dark:text-rose-400",
    hover: "hover:border-rose-500/25 hover:shadow-rose-500/5",
  },
  slate: {
    bar: "from-muted-foreground/40 via-muted-foreground/20 to-transparent",
    icon: "bg-muted text-muted-foreground ring-border/60",
    hover: "hover:border-border hover:shadow-muted/10",
  },
};

type StatCardProps = {
  title: string;
  value: string;
  description?: string;
  trend?: string;
  icon?: React.ReactNode;
  href?: string;
  actionLabel?: string;
  accent?: StatCardAccent;
  className?: string;
};

function StatCardBody({
  title,
  value,
  description,
  trend,
  icon,
  href,
  actionLabel = "View details",
  accent = "primary",
  className,
}: StatCardProps) {
  const styles = accentStyles[accent];
  const clickable = Boolean(href);

  return (
    <Card
      className={cn(
        "relative h-full overflow-hidden border-border/70 bg-card/90 shadow-sm transition-all duration-200",
        clickable && cn("-translate-y-0 hover:-translate-y-0.5 hover:shadow-md", styles.hover),
        className,
      )}
    >
      <div
        className={cn("h-1 w-full bg-gradient-to-r", styles.bar)}
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(255,255,255,0.35),transparent_55%)] opacity-60 dark:opacity-20"
        aria-hidden
      />

      <CardHeader className="relative flex flex-row items-start justify-between space-y-0 pb-2">
        <CardTitle className="pr-2 text-sm font-medium leading-snug text-muted-foreground">
          {title}
        </CardTitle>
        {icon ? (
          <div
            className={cn(
              "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ring-1",
              styles.icon,
              "[&_svg]:h-4 [&_svg]:w-4",
            )}
          >
            {icon}
          </div>
        ) : null}
      </CardHeader>

      <CardContent className="relative">
        <div className="text-2xl font-semibold tabular-nums tracking-tight text-foreground">
          {value}
        </div>
        {description ? (
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{description}</p>
        ) : null}
        {trend ? (
          <p className="mt-2 text-xs font-medium text-emerald-600 dark:text-emerald-400">{trend}</p>
        ) : null}
        {clickable ? (
          <p
            className={cn(
              "mt-3 flex items-center gap-1 text-xs font-medium text-primary transition-opacity",
              "opacity-70 group-hover:opacity-100",
            )}
          >
            {actionLabel}
            <ChevronRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" aria-hidden />
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}

export function StatCard(props: StatCardProps) {
  if (props.href) {
    return (
      <Link href={props.href} className="group block h-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-xl">
        <StatCardBody {...props} />
      </Link>
    );
  }

  return <StatCardBody {...props} />;
}

export function statCardAccentBar(accent: StatCardAccent = "primary"): string {
  return accentStyles[accent].bar;
}
