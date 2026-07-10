import { cn } from "@/lib/utils";

type FormStepIndicatorProps = {
  steps: readonly string[];
  currentStep: number;
  className?: string;
};

export function FormStepIndicator({ steps, currentStep, className }: FormStepIndicatorProps) {
  return (
    <nav aria-label="Form progress" className={cn("w-full", className)}>
      <ol className="grid gap-2 sm:grid-cols-4">
        {steps.map((label, index) => {
          const stepNumber = index + 1;
          const isComplete = stepNumber < currentStep;
          const isCurrent = stepNumber === currentStep;

          return (
            <li
              key={label}
              className={cn(
                "flex items-center gap-3 rounded-xl border px-3 py-2.5 text-sm transition-colors",
                isCurrent
                  ? "border-primary/40 bg-primary/5 text-foreground"
                  : isComplete
                    ? "border-border/70 bg-muted/30 text-foreground"
                    : "border-border/60 bg-card text-muted-foreground",
              )}
            >
              <span
                className={cn(
                  "flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold",
                  isCurrent
                    ? "bg-primary text-primary-foreground"
                    : isComplete
                      ? "bg-primary/15 text-primary"
                      : "bg-muted text-muted-foreground",
                )}
                aria-hidden
              >
                {stepNumber}
              </span>
              <span className="min-w-0 leading-tight">
                <span className="block text-[11px] uppercase tracking-wide text-muted-foreground">
                  Step {stepNumber}
                </span>
                <span className="block font-medium">{label}</span>
              </span>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
