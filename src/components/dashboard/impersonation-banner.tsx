"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Loader2, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";

type ImpersonationBannerProps = {
  customerName: string;
};

export function ImpersonationBanner({ customerName }: ImpersonationBannerProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function exitImpersonation() {
    setLoading(true);
    try {
      const res = await fetch("/api/hard/auth/impersonate", {
        method: "DELETE",
        credentials: "same-origin",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(typeof data.error === "string" ? data.error : "Failed to exit impersonation");
      }
      window.location.assign(data.redirectTo ?? "/hard/auth/customers");
    } catch {
      router.push("/hard/auth/customers");
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-amber-500/40 bg-amber-500/10 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-start gap-2.5 text-foreground">
        <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
        <div>
          <p className="text-sm font-medium">Viewing as {customerName}</p>
          <p className="text-xs text-muted-foreground">
            Customer dashboard in this tab. Use Exit to return to the admin customer record.
          </p>
        </div>
      </div>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="shrink-0 border-amber-500/40 hover:bg-amber-500/10"
        onClick={exitImpersonation}
        disabled={loading}
      >
        {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
        Exit to admin
      </Button>
    </div>
  );
}
