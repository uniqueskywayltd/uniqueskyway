"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Activity,
  Bell,
  LayoutDashboard,
  LogOut,
  PieChart,
  ScrollText,
  Shield,
  User,
  Wallet,
  ArrowDownLeft,
  ArrowUpRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";

const navItems = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard, exact: true },
  { href: "/dashboard/deposits", label: "Deposits", icon: ArrowDownLeft },
  { href: "/dashboard/withdrawals", label: "Withdrawals", icon: ArrowUpRight },
  { href: "/dashboard/wallet", label: "Wallet", icon: Wallet },
  { href: "/dashboard/portfolio", label: "Portfolio", icon: PieChart },
  { href: "/dashboard/ledger", label: "Ledger", icon: ScrollText },
  { href: "/dashboard/notifications", label: "Notifications", icon: Bell },
  { href: "/dashboard/activity", label: "Activity", icon: Activity },
  { href: "/dashboard/profile", label: "Profile", icon: User },
  { href: "/dashboard/security", label: "Security", icon: Shield },
];

type DashboardNavProps = {
  fullName: string;
  username: string;
};

export function DashboardNav({ fullName, username }: DashboardNavProps) {
  const pathname = usePathname();

  return (
    <aside className="flex w-full flex-col border-b border-border/60 bg-background lg:w-64 lg:shrink-0 lg:border-b-0 lg:border-r">
      <div className="border-b border-border/60 px-5 py-5">
        <p className="text-sm font-semibold">Unique Sky Way</p>
        <p className="mt-0.5 truncate text-xs text-muted-foreground">{fullName}</p>
        <p className="truncate text-xs text-muted-foreground">@{username}</p>
      </div>

      <nav className="flex flex-1 flex-col gap-1 p-3" aria-label="Dashboard navigation">
        {navItems.map((item) => {
          const active = item.exact
            ? pathname === item.href
            : pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
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

      <div className="border-t border-border/60 p-3">
        <form action="/api/auth/logout" method="POST">
          <button
            type="submit"
            className={cn(
              buttonVariants({ variant: "ghost", size: "sm" }),
              "w-full justify-start gap-2",
            )}
          >
            <LogOut className="h-4 w-4" aria-hidden />
            Sign out
          </button>
        </form>
      </div>
    </aside>
  );
}
