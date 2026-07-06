"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Activity,
  Bell,
  CreditCard,
  FileText,
  Flag,
  LayoutDashboard,
  PieChart,
  ScrollText,
  Search,
  Settings,
  Shield,
  Database,
  TrendingUp,
  Users,
  Wallet,
  ArrowDownLeft,
  ArrowUpRight,
  Layers,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navSections = [
  {
    label: "Overview",
    items: [
      { href: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
      { href: "/admin/search", label: "Search", icon: Search },
    ],
  },
  {
    label: "Operations",
    items: [
      { href: "/admin/customers", label: "Customers", icon: Users },
      { href: "/admin/deposits", label: "Deposits", icon: ArrowDownLeft },
      { href: "/admin/withdrawals", label: "Withdrawals", icon: ArrowUpRight },
      { href: "/admin/investments", label: "Investments", icon: PieChart },
      { href: "/admin/treasury", label: "Treasury", icon: Wallet },
      { href: "/admin/operations", label: "Financial Ops", icon: Layers },
    ],
  },
  {
    label: "Configuration",
    items: [
      { href: "/admin/plans", label: "Investment Plans", icon: TrendingUp },
      { href: "/admin/payment-methods", label: "Payment Methods", icon: CreditCard },
      { href: "/admin/feature-flags", label: "Feature Flags", icon: Flag },
      { href: "/admin/settings", label: "Settings", icon: Settings },
    ],
  },
  {
    label: "Compliance",
    items: [
      { href: "/admin/referrals", label: "Referrals", icon: Activity },
      { href: "/admin/audit", label: "Audit Center", icon: FileText },
      { href: "/admin/risk", label: "Risk Center", icon: Shield },
      { href: "/admin/reports", label: "Reports", icon: ScrollText },
      { href: "/admin/migration", label: "Migration", icon: Database },
      { href: "/admin/notifications", label: "Notifications", icon: Bell },
    ],
  },
];

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex w-56 shrink-0 flex-col border-r border-slate-800 bg-slate-950">
      <div className="border-b border-slate-800 px-4 py-5">
        <p className="text-sm font-semibold text-white">Unique Sky Way</p>
        <p className="text-xs text-slate-400">Admin Console</p>
      </div>
      <nav className="flex-1 space-y-6 overflow-y-auto p-3" aria-label="Admin navigation">
        {navSections.map((section) => (
          <div key={section.label}>
            <p className="mb-2 px-2.5 text-[10px] font-medium uppercase tracking-[0.12em] text-slate-500">
              {section.label}
            </p>
            <div className="space-y-0.5">
              {section.items.map((item) => {
                const active = item.exact
                  ? pathname === item.href
                  : pathname.startsWith(item.href);
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950",
                      active
                        ? "bg-slate-800 font-medium text-white"
                        : "text-slate-400 hover:bg-slate-800/60 hover:text-white",
                    )}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>
    </aside>
  );
}
