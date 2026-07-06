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
    <div className={cn("grid min-h-screen lg:grid-cols-[1.05fr_1fr]", className)}>
      {/* Brand panel */}
      <div className="relative hidden overflow-hidden bg-[#060b14] lg:block">
        <Image
          src={panelImage}
          alt={panelImageAlt}
          fill
          className="object-cover opacity-20"
          sizes="55vw"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-br from-[#060b14] via-[#0c1527]/95 to-[#060b14]" />
        <div className="absolute -left-24 top-1/4 h-80 w-80 rounded-full bg-amber-500/10 blur-[100px]" />
        <div className="absolute -right-16 bottom-1/4 h-64 w-64 rounded-full bg-[#1e3a5f]/40 blur-[80px]" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:48px_48px] [mask-image:radial-gradient(ellipse_at_center,black,transparent_80%)]" />
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-amber-400/40 to-transparent" />

        <div className="relative flex h-full flex-col justify-between p-12 xl:p-16">
          <Link href="/" className="inline-flex shrink-0">
            <BrandLogo variant="dark" width={150} priority />
          </Link>

          <div className="max-w-md">
            <div className="inline-flex items-center gap-2 rounded-full border border-amber-400/20 bg-amber-400/[0.08] px-3 py-1 text-[10px] font-medium uppercase tracking-[0.16em] text-amber-300/90">
              <Sparkles className="h-3 w-3 text-amber-400" />
              Secure Platform
            </div>
            <h2 className="mt-5 text-3xl font-semibold leading-tight text-white xl:text-4xl">
              {panelTitle}
            </h2>
            <p className="mt-4 text-base leading-relaxed text-slate-400">
              {panelDescription}
            </p>

            {panelHighlights?.length ? (
              <ul className="mt-8 space-y-3">
                {panelHighlights.map((item) => (
                  <li key={item} className="flex items-center gap-3 text-sm text-slate-300">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-amber-400/20 bg-amber-400/10">
                      <ShieldCheck className="h-3.5 w-3.5 text-amber-400" />
                    </span>
                    {item}
                  </li>
                ))}
              </ul>
            ) : null}
          </div>

          <p className="text-xs text-slate-600">
            © {new Date().getFullYear()} Unique Sky Way
          </p>
        </div>
      </div>

      {/* Form panel */}
      <div className="relative flex flex-col bg-[#060b14]">
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_at_center,black,transparent_75%)]" />
        <div className="pointer-events-none absolute -right-20 top-0 h-64 w-64 rounded-full bg-amber-500/[0.06] blur-[90px]" />

        <div className="relative flex flex-1 flex-col">
          <div className="flex items-center justify-between px-6 py-5 lg:px-10">
            <Link href="/" className="inline-flex shrink-0 rounded-md bg-white px-2 py-1 lg:hidden">
              <BrandLogo variant="light" width={120} priority />
            </Link>
            <Link
              href="/"
              className="ml-auto text-sm text-slate-500 transition-colors hover:text-slate-300"
            >
              Back to home
            </Link>
          </div>

          <div className="flex flex-1 items-center justify-center px-6 pb-10 pt-2 lg:px-10">
            <div className="w-full max-w-[440px]">
              <div className="overflow-hidden rounded-2xl border border-white/[0.08] bg-[#0a1220]/90 shadow-2xl shadow-black/40 backdrop-blur-xl">
                <div className="h-1 w-full bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600" />
                <div className="p-8 sm:p-9">
                  <div className="mb-8">
                    <h1 className="text-2xl font-semibold tracking-tight text-white">{title}</h1>
                    <p className="mt-2 text-sm leading-relaxed text-slate-400">{subtitle}</p>
                  </div>

                  <div className="auth-fintech">{children}</div>
                </div>
              </div>

              <div className="mt-6">{footer}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function AuthTrustBar() {
  return (
    <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs text-slate-500">
      <span className="inline-flex items-center gap-1.5">
        <ShieldCheck className="h-3.5 w-3.5 text-amber-400/80" />
        256-bit encryption
      </span>
      <span className="hidden h-3 w-px bg-white/10 sm:block" />
      <span>Secure investor portal</span>
      <span className="hidden h-3 w-px bg-white/10 sm:block" />
      <span>info@uniqueskyway.com</span>
    </div>
  );
}
