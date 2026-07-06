import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type StatCardProps = {
  title: string;
  value: string;
  description?: string;
  trend?: string;
  icon?: React.ReactNode;
  theme?: "light" | "dark";
  className?: string;
};

export function StatCard({
  title,
  value,
  description,
  trend,
  icon,
  theme = "light",
  className,
}: StatCardProps) {
  const isDark = theme === "dark";

  return (
    <Card
      className={cn(
        "shadow-sm",
        isDark ? "border-slate-800 bg-slate-900/50" : "border-border/60",
        className,
      )}
    >
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle
          className={cn(
            "text-sm font-medium",
            isDark ? "text-slate-400" : "text-muted-foreground",
          )}
        >
          {title}
        </CardTitle>
        {icon ? (
          <div className={cn(isDark ? "text-slate-500" : "text-muted-foreground", "[&_svg]:h-4 [&_svg]:w-4")}>
            {icon}
          </div>
        ) : null}
      </CardHeader>
      <CardContent>
        <div className={cn("text-2xl font-semibold tabular-nums tracking-tight", isDark && "text-white")}>
          {value}
        </div>
        {description ? (
          <p className={cn("mt-1 text-xs", isDark ? "text-slate-500" : "text-muted-foreground")}>
            {description}
          </p>
        ) : null}
        {trend ? (
          <p className="mt-2 text-xs font-medium text-emerald-600 dark:text-emerald-400">{trend}</p>
        ) : null}
      </CardContent>
    </Card>
  );
}
