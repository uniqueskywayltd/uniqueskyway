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
        <label htmlFor={htmlFor} className="text-sm font-medium leading-none text-slate-300">
          {label}
        </label>
        {action}
      </div>
      {children}
      {hint ? <p className="text-xs text-slate-500">{hint}</p> : null}
    </div>
  );
}

type AuthInputIconProps = {
  children: React.ReactNode;
  icon: React.ReactNode;
};

export function AuthInputIcon({ children, icon }: AuthInputIconProps) {
  return (
    <div className="relative">
      <span className="pointer-events-none absolute left-3.5 top-1/2 z-10 -translate-y-1/2 text-slate-500">
        {icon}
      </span>
      <div className="[&_input]:h-11 [&_input]:border-white/10 [&_input]:bg-white/[0.04] [&_input]:pl-10 [&_input]:text-white [&_input]:placeholder:text-slate-600 [&_input]:focus-visible:border-amber-400/40 [&_input]:focus-visible:ring-amber-400/20">
        {children}
      </div>
    </div>
  );
}

export const authSubmitClass =
  "h-11 w-full border-0 bg-gradient-to-r from-amber-500 to-amber-600 text-sm font-semibold text-slate-950 shadow-lg shadow-amber-500/20 hover:from-amber-400 hover:to-amber-500 hover:text-slate-950";

export const authLinkClass = "font-medium text-amber-400/90 hover:text-amber-300 hover:underline";
