"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CheckCircle2 } from "lucide-react";

export function EmailVerifiedBanner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (searchParams.get("verified") === "1") {
      setVisible(true);
      const url = new URL(window.location.href);
      url.searchParams.delete("verified");
      router.replace(url.pathname + url.search, { scroll: false });
      const timer = window.setTimeout(() => setVisible(false), 8000);
      return () => window.clearTimeout(timer);
    }
  }, [searchParams, router]);

  if (!visible) return null;

  return (
    <div className="flex items-start gap-3 rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-4 py-3">
      <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600 dark:text-emerald-400" />
      <div>
        <p className="text-sm font-medium text-foreground">Email verified</p>
        <p className="text-sm text-muted-foreground">
          Your account is active. Welcome to your investor dashboard.
        </p>
      </div>
    </div>
  );
}
