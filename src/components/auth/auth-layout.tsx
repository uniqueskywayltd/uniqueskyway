import Image from "next/image";
import Link from "next/link";
import { ShieldCheck, Sparkles } from "lucide-react";
import { BrandLogo } from "@/components/brand/brand-logo";
import { cn } from "@/lib/utils";

type AuthLayoutProps = {
  title: string;
  subtitle: string;
  panelTitle: string;
  panelDescription: string;
  panelImage: string;
  panelImageAlt: string;
  panelHighlights?: string[];
  children: React.ReactNode;
  footer: React.ReactNode;
  className?: string;
};

export function AuthLayout({
  title,
  subtitle,
  panelTitle,
  panelDescription,
  panelImage,
  panelImageAlt,
  panelHighlights,
  children,
  footer,
  className,
}: AuthLayoutProps) {
  return (
    <div className={cn("grid min-h-screen bg-white lg:grid-cols-[1.05fr_1fr]", className)}>
      {/* Brand panel */}
      <div className="relative hidden overflow-hidden border-r border-border/50 bg-slate-50 lg:block">
        <Image
          src={panelImage}
          alt={panelImageAlt}
          fill
          className="object-cover opacity-[0.14]"
          sizes="55vw"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-br from-white via-slate-50/95 to-slate-100" />
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-border to-transparent" />

        <div className="relative flex h-full flex-col justify-between p-12 xl:p-16">
          <Link href="/" className="inline-flex shrink-0">
            <BrandLogo variant="light" width={150} priority />
          </Link>

          <div className="max-w-md">
            <div className="inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-[10px] font-medium uppercase tracking-[0.16em] text-amber-800">
              <Sparkles className="h-3 w-3 text-amber-600" />
              Secure Platform
            </div>
            <h2 className="mt-5 text-3xl font-semibold leading-tight text-foreground xl:text-4xl">
              {panelTitle}
            </h2>
            <p className="mt-4 text-base leading-relaxed text-muted-foreground">
              {panelDescription}
            </p>

            {panelHighlights?.length ? (
              <ul className="mt-8 space-y-3">
                {panelHighlights.map((item) => (
                  <li key={item} className="flex items-center gap-3 text-sm text-foreground/80">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-amber-200 bg-amber-50">
                      <ShieldCheck className="h-3.5 w-3.5 text-amber-600" />
                    </span>
                    {item}
                  </li>
                ))}
              </ul>
            ) : null}
          </div>

          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} Unique Sky Way
          </p>
        </div>
      </div>

      {/* Form panel */}
      <div className="relative flex flex-col bg-white">
        <div className="relative flex flex-1 flex-col">
          <div className="flex items-center justify-between border-b border-border/50 px-6 py-5 lg:px-10">
            <Link href="/" className="inline-flex shrink-0 lg:hidden">
              <BrandLogo variant="light" width={120} priority />
            </Link>
            <Link
              href="/"
              className={cn(
                "text-sm text-muted-foreground transition-colors hover:text-foreground",
                "lg:ml-auto",
              )}
            >
              Back to home
            </Link>
          </div>

          <div className="flex flex-1 items-center justify-center px-6 pb-10 pt-8 lg:px-10">
            <div className="w-full max-w-[440px]">
              <div className="overflow-hidden rounded-2xl border border-border bg-white shadow-lg shadow-slate-200/60">
                <div className="h-1 w-full bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600" />
                <div className="p-8 sm:p-9">
                  <div className="mb-8">
                    <h1 className="text-2xl font-semibold tracking-tight text-foreground">{title}</h1>
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{subtitle}</p>
                  </div>

                  <div className="auth-fintech">{children}</div>
                </div>
              </div>

              {footer ? <div className="mt-6">{footer}</div> : null}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function AuthTrustBar() {
  return (
    <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs text-muted-foreground">
      <span className="inline-flex items-center gap-1.5">
        <ShieldCheck className="h-3.5 w-3.5 text-amber-600" />
        256-bit encryption
      </span>
      <span className="hidden h-3 w-px bg-border sm:block" />
      <span>Secure investor portal</span>
      <span className="hidden h-3 w-px bg-border sm:block" />
      <span>info@uniqueskyway.com</span>
    </div>
  );
}
