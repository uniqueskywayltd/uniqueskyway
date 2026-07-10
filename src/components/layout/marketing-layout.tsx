import type { ReactNode } from "react";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";

type MarketingLayoutProps = {
  children: React.ReactNode;
  belowHeader?: ReactNode;
  floatingWidgets?: ReactNode;
};

export function MarketingLayout({
  children,
  belowHeader,
  floatingWidgets,
}: MarketingLayoutProps) {
  return (
    <div className="flex min-h-dvh flex-col">
      <SiteHeader />
      {belowHeader}
      <main className="flex-1">{children}</main>
      <SiteFooter />
      {floatingWidgets}
    </div>
  );
}
