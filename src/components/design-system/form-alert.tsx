import { cn } from "@/lib/utils";

type FormAlertProps = {
  variant: "success" | "error" | "warning";
  children: React.ReactNode;
  className?: string;
};

const variants = {
  success: "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
  error: "border-red-500/30 bg-red-500/10 text-red-700 dark:text-red-300",
  warning: "border-amber-500/30 bg-amber-500/10 text-amber-800 dark:text-amber-300",
};

export function FormAlert({ variant, children, className }: FormAlertProps) {
  return (
    <div
      role="alert"
      className={cn(
        "rounded-lg border px-4 py-3 text-sm leading-relaxed",
        variants[variant],
        className,
      )}
    >
      {children}
    </div>
  );
}
