import { cn } from "@/lib/utils";

/** Shared application UI tokens (dashboard + admin) */
export const app = {
  page: "space-y-8",
  section: "space-y-4",
  card: "rounded-xl border border-border/60 bg-card shadow-sm",
  tableShell: "overflow-x-auto rounded-xl border border-border/60 bg-card",
  sectionTitle: "text-base font-semibold tracking-tight text-foreground sm:text-lg",
  mutedText: "text-sm text-muted-foreground",
  eyebrow: "text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground",
} as const;

export const adminInputClass = cn(
  "h-10 rounded-lg border border-input bg-background px-3 text-sm text-foreground",
  "placeholder:text-muted-foreground transition-colors",
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
);

export const adminSelectClass = adminInputClass;

export function dataTableShell(className?: string) {
  return cn(app.tableShell, className);
}
