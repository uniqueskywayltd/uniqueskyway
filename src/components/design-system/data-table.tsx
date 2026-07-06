import { cn } from "@/lib/utils";
import { dataTableShell } from "@/components/design-system/app-ui";

type DataTableProps = {
  children: React.ReactNode;
  theme?: "light" | "dark";
  className?: string;
};

export function DataTable({ children, theme = "light", className }: DataTableProps) {
  return <div className={dataTableShell(theme === "dark", className)}>{children}</div>;
}

type SectionHeadingProps = {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  theme?: "light" | "dark";
  className?: string;
};

export function SectionHeading({
  title,
  description,
  actions,
  theme = "light",
  className,
}: SectionHeadingProps) {
  const isDark = theme === "dark";

  return (
    <div className={cn("mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between", className)}>
      <div>
        <h2 className={cn("text-base font-semibold tracking-tight sm:text-lg", isDark ? "text-white" : "text-foreground")}>
          {title}
        </h2>
        {description ? (
          <p className={cn("mt-1 text-sm", isDark ? "text-slate-400" : "text-muted-foreground")}>
            {description}
          </p>
        ) : null}
      </div>
      {actions ? <div className="flex shrink-0 items-center gap-2">{actions}</div> : null}
    </div>
  );
}
