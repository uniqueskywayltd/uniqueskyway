"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import { BrandLogo } from "@/components/brand/brand-logo";
import {
  marketingHeaderOutlineBtn,
  marketingHeaderPrimaryBtn,
} from "@/components/marketing/marketing-ui";
import { mainNavLinks } from "@/lib/constants/navigation";
import { cn } from "@/lib/utils";

function NavLink({
  href,
  label,
  onClick,
  mobile,
}: {
  href: string;
  label: string;
  onClick?: () => void;
  mobile?: boolean;
}) {
  const pathname = usePathname();
  const active =
    pathname === href || (href !== "/" && pathname.startsWith(`${href}/`));

  return (
    <Link
      href={href}
      onClick={onClick}
      className={cn(
        "relative font-medium transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        mobile ? "rounded-lg px-3 py-2.5 text-base" : "py-2 text-sm",
        active ? "text-foreground" : "text-muted-foreground hover:text-foreground",
        !mobile &&
          "after:absolute after:bottom-0 after:left-0 after:h-px after:w-full after:bg-primary after:transition-transform after:duration-200 after:content-['']",
        !mobile && (active ? "after:scale-x-100" : "after:origin-left after:scale-x-0 hover:after:scale-x-100"),
        mobile && active && "bg-muted/50 text-foreground",
      )}
    >
      {label}
    </Link>
  );
}

export function SiteHeader() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="relative z-40 border-b border-border/50 bg-white">
      <div className="mx-auto flex h-[4.25rem] max-w-7xl items-center justify-between gap-6 px-4 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="flex shrink-0 items-center py-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-sm"
          aria-label="Unique Sky Way home"
        >
          <BrandLogo
            variant="light"
            width={140}
            priority
            className="h-auto w-[112px] sm:w-[128px] md:w-[136px]"
          />
        </Link>

        <nav className="hidden items-center gap-10 lg:flex" aria-label="Main navigation">
          {mainNavLinks.map((link) => (
            <NavLink key={link.href} href={link.href} label={link.label} />
          ))}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          <Link href="/login" className={marketingHeaderOutlineBtn()}>
            Sign in
          </Link>
          <Link href="/register" className={marketingHeaderPrimaryBtn()}>
            Open account
          </Link>
        </div>

        <button
          type="button"
          className="inline-flex items-center justify-center rounded-lg p-2 text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring md:hidden"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-expanded={mobileOpen}
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {mobileOpen ? (
        <div className="border-t border-border/50 bg-white px-4 py-5 md:hidden">
          <nav className="flex flex-col gap-0.5" aria-label="Mobile navigation">
            {mainNavLinks.map((link) => (
              <NavLink
                key={link.href}
                href={link.href}
                label={link.label}
                mobile
                onClick={() => setMobileOpen(false)}
              />
            ))}
            <div className="mt-4 flex flex-col gap-2.5 border-t border-border/50 pt-4">
              <Link
                href="/login"
                className={cn(marketingHeaderOutlineBtn(), "h-11 w-full")}
                onClick={() => setMobileOpen(false)}
              >
                Sign in
              </Link>
              <Link
                href="/register"
                className={cn(marketingHeaderPrimaryBtn(), "h-11 w-full")}
                onClick={() => setMobileOpen(false)}
              >
                Open account
              </Link>
            </div>
          </nav>
        </div>
      ) : null}
    </header>
  );
}
