"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut, Menu } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button, buttonVariants } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { dashboardNavItems, getDashboardNavLabel } from "@/components/dashboard/dashboard-nav-items";
import { cn } from "@/lib/utils";
import { getAvatarUrl, getInitials } from "@/lib/utils/avatar";
import { restoreBodyScroll } from "@/lib/utils/restore-body-scroll";

type DashboardShellProps = {
  fullName: string;
  username: string;
  avatarPath: string | null;
  children: React.ReactNode;
};

function DashboardNavPanel({
  fullName,
  username,
  avatarPath,
  onNavigate,
}: {
  fullName: string;
  username: string;
  avatarPath: string | null;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const initials = getInitials(fullName);

  return (
    <>
      <div className="relative overflow-hidden border-b border-border/60 px-4 py-5">
        <div
          className="pointer-events-none absolute inset-0 bg-gradient-to-br from-primary/12 via-primary/5 to-transparent"
          aria-hidden
        />
        <div className="relative flex items-center gap-3">
          <Avatar className="h-12 w-12 shrink-0 ring-2 ring-primary/20 ring-offset-2 ring-offset-card">
            <AvatarImage src={getAvatarUrl(avatarPath)} alt="" />
            <AvatarFallback className="bg-primary/15 text-sm font-semibold text-primary">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-foreground">Unique Sky Way</p>
            <p className="mt-0.5 truncate text-xs text-muted-foreground">{fullName}</p>
            <p className="truncate text-xs text-primary/80">@{username}</p>
          </div>
        </div>
      </div>

      <nav className="flex flex-col gap-1 p-3" aria-label="Dashboard navigation">
        {dashboardNavItems.map((item) => {
          const active = item.exact
            ? pathname === item.href
            : pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                active
                  ? "bg-primary/10 font-medium text-primary"
                  : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
              )}
              aria-current={active ? "page" : undefined}
            >
              <Icon className="h-4 w-4 shrink-0" aria-hidden />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </>
  );
}

export function DashboardShell({
  fullName,
  username,
  avatarPath,
  children,
}: DashboardShellProps) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const initials = getInitials(fullName);
  const currentLabel = getDashboardNavLabel(pathname);
  const isOverview = pathname === "/dashboard";

  useEffect(() => {
    restoreBodyScroll();
  }, []);

  useEffect(() => {
    setMobileOpen(false);
    restoreBodyScroll();
  }, [pathname]);

  useEffect(() => {
    if (!mobileOpen) {
      restoreBodyScroll();
    }
  }, [mobileOpen]);

  return (
    <div className="min-h-dvh bg-gradient-to-b from-muted/25 via-background to-background lg:flex">
      <aside className="hidden w-64 shrink-0 flex-col border-r border-border/60 bg-card/80 backdrop-blur-sm lg:sticky lg:top-0 lg:flex lg:h-dvh lg:overflow-y-auto">
        <DashboardNavPanel fullName={fullName} username={username} avatarPath={avatarPath} />
      </aside>

      <div className="min-w-0 flex-1">
        <header className="sticky top-0 z-30 flex items-center justify-between gap-3 border-b border-border/60 bg-background/95 px-4 py-3 backdrop-blur-md supports-[backdrop-filter]:bg-background/80 lg:px-8">
          <div className="flex min-w-0 items-center gap-2.5">
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="h-10 w-10 shrink-0 lg:hidden"
              onClick={() => setMobileOpen(true)}
              aria-label="Open navigation menu"
            >
              <Menu className="h-4 w-4" aria-hidden />
            </Button>
            <Avatar className="h-9 w-9 shrink-0 ring-2 ring-primary/15 lg:hidden">
              <AvatarImage src={getAvatarUrl(avatarPath)} alt="" />
              <AvatarFallback className="bg-primary/10 text-xs font-semibold text-primary">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-foreground">
                {isOverview ? "Overview" : currentLabel}
              </p>
              {!isOverview ? (
                <p className="truncate text-xs text-muted-foreground">Investor portal</p>
              ) : (
                <p className="truncate text-xs text-muted-foreground lg:hidden">Investor portal</p>
              )}
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <ThemeToggle showLabel={false} />
            <form action="/api/auth/logout" method="POST">
              <button
                type="submit"
                className={cn(buttonVariants({ variant: "outline", size: "sm" }), "gap-2")}
              >
                <LogOut className="h-4 w-4" aria-hidden />
                <span className="hidden sm:inline">Sign out</span>
              </button>
            </form>
          </div>
        </header>

        <Sheet
          open={mobileOpen}
          onOpenChange={(open) => {
            setMobileOpen(open);
            if (!open) restoreBodyScroll();
          }}
        >
          <SheetContent side="left" className="w-[min(100vw-1rem,20rem)] gap-0 p-0">
            <SheetTitle className="sr-only">Dashboard navigation</SheetTitle>
            <div className="flex max-h-dvh flex-col overflow-y-auto">
              <DashboardNavPanel
                fullName={fullName}
                username={username}
                avatarPath={avatarPath}
                onNavigate={() => {
                  setMobileOpen(false);
                  restoreBodyScroll();
                }}
              />
            </div>
          </SheetContent>
        </Sheet>

        <main className="mx-auto max-w-6xl space-y-6 px-4 py-5 sm:space-y-8 sm:py-6 lg:px-8 lg:py-8">
          {children}
        </main>
      </div>
    </div>
  );
}
