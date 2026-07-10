import { cn } from "@/lib/utils";
import type {
  DepositStatus,
  InvestmentStatus,
  UserStatus,
  WithdrawalStatus,
} from "@/types/domain";

export type StatusValue =
  | DepositStatus
  | WithdrawalStatus
  | InvestmentStatus
  | UserStatus
  | "active"
  | "inactive"
  | "completed"
  | "processing"
  | "failed"
  | "sent"
  | "approved"
  | "rejected"
  | "cancelled"
  | "pending"
  | "pending_verification"
  | "suspended"
  | "matured"
  | "reinvested"
  | "draft"
  | "submitted"
  | "under_review"
  | "ok"
  | string;

const statusStyles: Record<string, string> = {
  active:
    "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:border-emerald-500/25",
  approved:
    "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:border-emerald-500/25",
  completed:
    "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:border-emerald-500/25",
  sent: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:border-emerald-500/25",
  ok: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:border-emerald-500/25",
  pending:
    "bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-500/10 dark:text-amber-300 dark:border-amber-500/25",
  pending_verification:
    "bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-500/10 dark:text-amber-300 dark:border-amber-500/25",
  submitted:
    "bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-500/10 dark:text-amber-300 dark:border-amber-500/25",
  under_review:
    "bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-500/10 dark:text-amber-300 dark:border-amber-500/25",
  draft:
    "bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-500/10 dark:text-slate-300 dark:border-slate-500/25",
  processing:
    "bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-500/10 dark:text-sky-300 dark:border-sky-500/25",
  rejected:
    "bg-red-50 text-red-700 border-red-200 dark:bg-red-500/10 dark:text-red-300 dark:border-red-500/25",
  suspended:
    "bg-red-50 text-red-700 border-red-200 dark:bg-red-500/10 dark:text-red-300 dark:border-red-500/25",
  failed:
    "bg-red-50 text-red-700 border-red-200 dark:bg-red-500/10 dark:text-red-300 dark:border-red-500/25",
  cancelled:
    "bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-500/10 dark:text-slate-300 dark:border-slate-500/25",
  inactive:
    "bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-500/10 dark:text-slate-300 dark:border-slate-500/25",
  matured:
    "bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-500/10 dark:text-indigo-300 dark:border-indigo-500/25",
  reinvested:
    "bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-500/10 dark:text-violet-300 dark:border-violet-500/25",
};

const fallback =
  "bg-muted text-muted-foreground border-border dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700";

type StatusBadgeProps = {
  status: StatusValue;
  label?: string;
  className?: string;
};

export function StatusBadge({ status, label, className }: StatusBadgeProps) {
  const key = String(status).toLowerCase();
  const styles = statusStyles[key] ?? fallback;
  const display = label ?? key.replace(/_/g, " ");

  return (
    <span
      className={cn(
        "inline-flex h-5 items-center rounded-md border px-2 py-0.5 text-xs font-medium capitalize",
        styles,
        className,
      )}
    >
      {display}
    </span>
  );
}
