import { cn } from "@/lib/utils";
import { app } from "@/components/design-system/app-ui";

type DataTableProps = {
  children: React.ReactNode;
  className?: string;
};

export function DataTable({ children, className }: DataTableProps) {
  return <div className={cn(app.tableShell, className)}>{children}</div>;
}

type SectionHeadingProps = {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  className?: string;
};

export function SectionHeading({ title, description, actions, className }: SectionHeadingProps) {
  return (
    <div className={cn("mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between", className)}>
      <div>
        <h2 className="text-base font-semibold tracking-tight text-foreground sm:text-lg">{title}</h2>
        {description ? <p className="mt-1 text-sm text-muted-foreground">{description}</p> : null}
      </div>
      {actions ? <div className="flex shrink-0 items-center gap-2">{actions}</div> : null}
    </div>
  );
}
