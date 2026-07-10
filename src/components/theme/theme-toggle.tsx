"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type ThemeToggleProps = {
  className?: string;
  /** Show Light/Dark label beside the icon (recommended on desktop). */
  showLabel?: boolean;
};

export function ThemeToggle({ className, showLabel = true }: ThemeToggleProps) {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const isDark = mounted && resolvedTheme === "dark";

  return (
    <Button
      type="button"
      variant="outline"
      size={showLabel ? "default" : "icon"}
      className={cn(
        "h-10 shrink-0 border-border/80 bg-background font-medium shadow-sm",
        showLabel ? "gap-2 px-3" : "w-10",
        className,
      )}
      onClick={() => setTheme(isDark ? "light" : "dark")}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      title={isDark ? "Switch to light mode" : "Switch to dark mode"}
    >
      {mounted ? (
        isDark ? (
          <Sun className="h-4 w-4 text-amber-500" aria-hidden />
        ) : (
          <Moon className="h-4 w-4 text-primary" aria-hidden />
        )
      ) : (
        <span className="h-4 w-4" aria-hidden />
      )}
      {showLabel ? (
        <span className="text-sm">{mounted ? (isDark ? "Light" : "Dark") : "Theme"}</span>
      ) : null}
    </Button>
  );
}
