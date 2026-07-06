import { cn } from "@/lib/utils";

/** Shared application UI tokens (dashboard + admin) */
export const app = {
  page: "space-y-8",
  section: "space-y-4",
  card: "rounded-xl border border-border/60 bg-card shadow-sm",
  cardDark: "rounded-xl border border-slate-800 bg-slate-900/50 shadow-sm",
  tableShell: "overflow-x-auto rounded-xl border border-border/60 bg-card",
  tableShellDark: "overflow-x-auto rounded-xl border border-slate-800 bg-slate-900/50",
  sectionTitle: "text-base font-semibold tracking-tight text-foreground sm:text-lg",
  sectionTitleDark: "text-base font-semibold tracking-tight text-white sm:text-lg",
  mutedText: "text-sm text-muted-foreground",
  mutedTextDark: "text-sm text-slate-400",
  eyebrow: "text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground",
  eyebrowDark: "text-xs font-medium uppercase tracking-[0.12em] text-slate-500",
} as const;

export const adminInputClass = cn(
  "h-10 rounded-lg border border-slate-700 bg-slate-900 px-3 text-sm text-slate-100",
  "placeholder:text-slate-500 transition-colors",
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-500/50 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950",
);

export const adminSelectClass = adminInputClass;

export function dataTableShell(dark?: boolean, className?: string) {
  return cn(dark ? app.tableShellDark : app.tableShell, className);
}
