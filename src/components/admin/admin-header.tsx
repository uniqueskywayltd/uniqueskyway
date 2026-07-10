"use client";

import { ThemeToggle } from "@/components/theme/theme-toggle";

type AdminHeaderProps = {
  fullName: string;
  role: string;
};

export function AdminHeader({ fullName, role }: AdminHeaderProps) {
  return (
    <header className="flex h-14 items-center justify-between gap-4 border-b border-border bg-background px-4 sm:px-6">
      <p className="min-w-0 truncate text-sm text-muted-foreground">
        Signed in as <span className="font-medium text-foreground">{fullName}</span>
        <span className="ml-2 capitalize text-muted-foreground/80">({role.replace("_", " ")})</span>
      </p>
      <div className="flex shrink-0 items-center gap-2 sm:gap-3">
        <ThemeToggle className="hidden sm:inline-flex" />
        <ThemeToggle showLabel={false} className="sm:hidden" />
        <form action="/api/auth/logout" method="POST">
          <button
            type="submit"
            className="rounded-lg px-2 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            Sign out
          </button>
        </form>
      </div>
    </header>
  );
}
