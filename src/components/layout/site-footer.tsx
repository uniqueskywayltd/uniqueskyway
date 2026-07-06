import Link from "next/link";

import { Mail, MapPin } from "lucide-react";

import { BrandLogo } from "@/components/brand/brand-logo";
import { footerNavLinks } from "@/lib/constants/navigation";

export function SiteFooter() {
  return (
    <footer className="border-t border-border/60 bg-white text-foreground">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid gap-12 md:grid-cols-4">
          <div className="md:col-span-2">
            <BrandLogo variant="light" width={180} />

            <p className="mt-4 max-w-sm text-sm leading-relaxed text-muted-foreground">
              A modern investment and financial services platform built for transparency,
              security, and long-term portfolio growth. Diversify your portfolio with
              confidence.
            </p>
          </div>

          <div>
            <p className="text-sm font-semibold text-foreground">Company</p>
            <ul className="mt-4 space-y-3 text-sm">
              {footerNavLinks.company.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-muted-foreground hover:text-foreground">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="text-sm font-semibold text-foreground">Support & Legal</p>
            <ul className="mt-4 space-y-3 text-sm">
              {footerNavLinks.support.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-muted-foreground hover:text-foreground">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
            <ul className="mt-6 space-y-3 text-sm">
              <li className="flex items-start gap-2">
                <Mail className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <a
                  href="mailto:info@uniqueskyway.com"
                  className="text-muted-foreground hover:text-foreground"
                >
                  info@uniqueskyway.com
                </a>
              </li>
              <li className="flex items-start gap-2">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <span className="text-muted-foreground">
                  Fayetteville, Arkansas
                  <br />
                  United States
                </span>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-border/60 pt-8 sm:flex-row">
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} Unique Sky Way. All rights reserved.
          </p>
          <p className="text-xs text-muted-foreground/80">
            uniqueskyway.com · Secure · Transparent · Professional
          </p>
        </div>
      </div>
    </footer>
  );
}
