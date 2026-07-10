"use client";

import { ThemeToggle } from "@/components/theme/theme-toggle";

/** Compact toggle for mobile header bars — icon + label always visible. */
export function ThemeToggleMobile() {
  return <ThemeToggle showLabel className="min-w-[5.5rem]" />;
}
