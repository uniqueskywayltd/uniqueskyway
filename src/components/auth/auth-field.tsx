import { cn } from "@/lib/utils";

type AuthFieldProps = {
  label: string;
  htmlFor: string;
  hint?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
};

export function AuthField({
  label,
  htmlFor,
  hint,
  action,
  children,
  className,
}: AuthFieldProps) {
  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center justify-between gap-2">
        <label htmlFor={htmlFor} className="text-sm font-medium leading-none text-foreground">
          {label}
        </label>
        {action}
      </div>
      {children}
      {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

type AuthInputIconProps = {
  children: React.ReactNode;
  icon: React.ReactNode;
};

export const authInputClass =
  "h-11 border-input bg-background pl-10 text-foreground placeholder:text-muted-foreground focus-visible:border-primary/40 focus-visible:ring-primary/20";

export function AuthInputIcon({ children, icon }: AuthInputIconProps) {
  return (
    <div className="relative">
      <span className="pointer-events-none absolute left-3.5 top-1/2 z-10 -translate-y-1/2 text-muted-foreground">
        {icon}
      </span>
      <div className="[&_input]:h-11 [&_input]:border-input [&_input]:bg-background [&_input]:pl-10 [&_input]:text-foreground [&_input]:placeholder:text-muted-foreground [&_input]:focus-visible:border-primary/40 [&_input]:focus-visible:ring-primary/20">
        {children}
      </div>
    </div>
  );
}

export const authSubmitClass =
  "h-11 w-full border-0 bg-gradient-to-r from-amber-500 to-amber-600 text-sm font-semibold text-slate-950 shadow-md shadow-amber-500/15 hover:from-amber-400 hover:to-amber-500 hover:text-slate-950";

export const authLinkClass = "font-medium text-primary hover:underline";
