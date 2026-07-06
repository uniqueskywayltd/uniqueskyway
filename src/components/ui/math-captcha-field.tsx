"use client";

import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type MathCaptchaFieldProps = {
  a: number;
  b: number;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  className?: string;
};

export function MathCaptchaField({
  a,
  b,
  value,
  onChange,
  disabled,
  className,
}: MathCaptchaFieldProps) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <span className="text-sm tabular-nums">{a}</span>
      <span className="text-sm text-muted-foreground">+</span>
      <span className="text-sm tabular-nums">{b}</span>
      <span className="text-sm text-muted-foreground">=</span>
      <Input
        type="number"
        inputMode="numeric"
        min={2}
        max={18}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className="h-9 w-14 px-2 text-center tabular-nums"
        autoComplete="off"
        required
        aria-label="Answer"
      />
    </div>
  );
}
