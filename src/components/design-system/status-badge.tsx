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

const statusStyles: Record<string, { light: string; dark: string }> = {
  active: {
    light: "bg-emerald-50 text-emerald-700 border-emerald-200",
    dark: "bg-emerald-500/10 text-emerald-300 border-emerald-500/25",
  },
  approved: {
    light: "bg-emerald-50 text-emerald-700 border-emerald-200",
    dark: "bg-emerald-500/10 text-emerald-300 border-emerald-500/25",
  },
  completed: {
    light: "bg-emerald-50 text-emerald-700 border-emerald-200",
    dark: "bg-emerald-500/10 text-emerald-300 border-emerald-500/25",
  },
  sent: {
    light: "bg-emerald-50 text-emerald-700 border-emerald-200",
    dark: "bg-emerald-500/10 text-emerald-300 border-emerald-500/25",
  },
  ok: {
    light: "bg-emerald-50 text-emerald-700 border-emerald-200",
    dark: "bg-emerald-500/10 text-emerald-300 border-emerald-500/25",
  },
  pending: {
    light: "bg-amber-50 text-amber-800 border-amber-200",
    dark: "bg-amber-500/10 text-amber-300 border-amber-500/25",
  },
  pending_verification: {
    light: "bg-amber-50 text-amber-800 border-amber-200",
    dark: "bg-amber-500/10 text-amber-300 border-amber-500/25",
  },
  submitted: {
    light: "bg-amber-50 text-amber-800 border-amber-200",
    dark: "bg-amber-500/10 text-amber-300 border-amber-500/25",
  },
  under_review: {
    light: "bg-amber-50 text-amber-800 border-amber-200",
    dark: "bg-amber-500/10 text-amber-300 border-amber-500/25",
  },
  draft: {
    light: "bg-slate-100 text-slate-600 border-slate-200",
    dark: "bg-slate-500/10 text-slate-300 border-slate-500/25",
  },
  processing: {
    light: "bg-sky-50 text-sky-700 border-sky-200",
    dark: "bg-sky-500/10 text-sky-300 border-sky-500/25",
  },
  rejected: {
    light: "bg-red-50 text-red-700 border-red-200",
    dark: "bg-red-500/10 text-red-300 border-red-500/25",
  },
  suspended: {
    light: "bg-red-50 text-red-700 border-red-200",
    dark: "bg-red-500/10 text-red-300 border-red-500/25",
  },
  failed: {
    light: "bg-red-50 text-red-700 border-red-200",
    dark: "bg-red-500/10 text-red-300 border-red-500/25",
  },
  cancelled: {
    light: "bg-slate-100 text-slate-600 border-slate-200",
    dark: "bg-slate-500/10 text-slate-300 border-slate-500/25",
  },
  inactive: {
    light: "bg-slate-100 text-slate-600 border-slate-200",
    dark: "bg-slate-500/10 text-slate-300 border-slate-500/25",
  },
  matured: {
    light: "bg-indigo-50 text-indigo-700 border-indigo-200",
    dark: "bg-indigo-500/10 text-indigo-300 border-indigo-500/25",
  },
  reinvested: {
    light: "bg-violet-50 text-violet-700 border-violet-200",
    dark: "bg-violet-500/10 text-violet-300 border-violet-500/25",
  },
};

const fallback = {
  light: "bg-muted text-muted-foreground border-border",
  dark: "bg-slate-800 text-slate-300 border-slate-700",
};

type StatusBadgeProps = {
  status: StatusValue;
  label?: string;
  theme?: "light" | "dark";
  className?: string;
};

export function StatusBadge({ status, label, theme = "light", className }: StatusBadgeProps) {
  const key = String(status).toLowerCase();
  const styles = statusStyles[key] ?? fallback;
  const display = label ?? key.replace(/_/g, " ");

  return (
    <span
      className={cn(
        "inline-flex h-5 items-center rounded-md border px-2 py-0.5 text-xs font-medium capitalize",
        theme === "dark" ? styles.dark : styles.light,
        className,
      )}
    >
      {display}
    </span>
  );
}
