import Link from "next/link";
import { Inbox } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type EmptyStateProps = {
  title: string;
  description: string;
  hint?: string;
  icon?: React.ReactNode;
  actionLabel?: string;
  onAction?: () => void;
  actionHref?: string;
  theme?: "light" | "dark";
  className?: string;
};

export function EmptyState({
  title,
  description,
  hint,
  icon,
  actionLabel,
  onAction,
  actionHref,
  theme = "light",
  className,
}: EmptyStateProps) {
  const isDark = theme === "dark";

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-xl border border-dashed px-6 py-14 text-center sm:py-16",
        isDark
          ? "border-slate-700/80 bg-slate-900/40"
          : "border-border/70 bg-muted/30",
        className,
      )}
    >
      <div
        className={cn(
          "mb-4 flex h-11 w-11 items-center justify-center rounded-full",
          isDark ? "bg-slate-800 text-slate-400" : "bg-muted text-muted-foreground",
        )}
      >
        {icon ?? <Inbox className="h-5 w-5" aria-hidden />}
      </div>
      <h3 className={cn("text-base font-semibold", isDark ? "text-white" : "text-foreground")}>
        {title}
      </h3>
      <p className={cn("mt-2 max-w-sm text-sm leading-relaxed", isDark ? "text-slate-400" : "text-muted-foreground")}>
        {description}
      </p>
      {hint ? (
        <p className={cn("mt-2 max-w-sm text-xs", isDark ? "text-slate-500" : "text-muted-foreground/80")}>
          {hint}
        </p>
      ) : null}
      {actionLabel && actionHref ? (
        <Link href={actionHref} className={cn(buttonVariants(), "mt-6")}>
          {actionLabel}
        </Link>
      ) : actionLabel && onAction ? (
        <Button className="mt-6" onClick={onAction}>
          {actionLabel}
        </Button>
      ) : null}
    </div>
  );
}
