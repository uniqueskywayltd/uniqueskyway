import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { statCardAccentBar, type StatCardAccent } from "./stat-card";

type DashboardPanelCardProps = {
  title: string;
  href?: string;
  viewLabel?: string;
  accent?: StatCardAccent;
  children: React.ReactNode;
  className?: string;
};

export function DashboardPanelCard({
  title,
  href,
  viewLabel = "Open",
  accent = "primary",
  children,
  className,
}: DashboardPanelCardProps) {
  const header = (
    <CardHeader className="flex flex-row items-center justify-between gap-3 pb-3">
      <CardTitle className="text-base font-semibold text-foreground">{title}</CardTitle>
      {href ? (
        <ChevronRight
          className="h-4 w-4 shrink-0 text-muted-foreground transition group-hover:translate-x-0.5 group-hover:text-primary"
          aria-hidden
        />
      ) : null}
    </CardHeader>
  );

  return (
    <Card
      className={cn(
        "group relative overflow-hidden border-border/70 bg-card/90 shadow-sm transition-all duration-200",
        href && "hover:border-primary/25 hover:shadow-md",
        className,
      )}
    >
      <div className={cn("h-1 w-full bg-gradient-to-r", statCardAccentBar(accent))} aria-hidden />

      {href ? (
        <Link
          href={href}
          className="block transition-colors hover:bg-muted/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset"
        >
          {header}
        </Link>
      ) : (
        header
      )}

      <CardContent>{children}</CardContent>

      {href ? (
        <Link
          href={href}
          className="block border-t border-border/50 bg-muted/20 px-6 py-2.5 transition-colors hover:bg-muted/35 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset"
        >
          <span className="text-xs font-medium text-primary">{viewLabel} →</span>
        </Link>
      ) : null}
    </Card>
  );
}
