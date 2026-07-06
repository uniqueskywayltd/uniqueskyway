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
      await fetch("/api/hard/auth/impersonate", { method: "DELETE" });
      router.push("/hard/auth");
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-start gap-2.5 text-amber-950">
        <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" />
        <div>
          <p className="text-sm font-medium">Viewing as {customerName}</p>
          <p className="text-xs text-amber-900/80">
            You have full customer dashboard access. Actions are logged.
          </p>
        </div>
      </div>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="shrink-0 border-amber-400 bg-white hover:bg-amber-100"
        onClick={exitImpersonation}
        disabled={loading}
      >
        {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
        Exit to admin
      </Button>
    </div>
  );
}
