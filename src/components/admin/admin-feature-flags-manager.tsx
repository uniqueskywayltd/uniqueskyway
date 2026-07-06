"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FEATURE_FLAG_DEFINITIONS } from "@/lib/constants/feature-flags";
import { toast } from "sonner";

type FlagRow = { key: string; enabled: boolean };

export function AdminFeatureFlagsManager({ flags }: { flags: FlagRow[] }) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);

  const flagMap = new Map(flags.map((f) => [f.key, f.enabled]));

  async function toggle(key: string, enabled: boolean) {
    setLoading(key);
    try {
      const res = await fetch("/api/admin/feature-flags", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key, enabled }),
      });
      if (!res.ok) throw new Error("Toggle failed");
      toast.success(`Feature ${enabled ? "enabled" : "disabled"}`);
      router.refresh();
    } catch {
      toast.error("Failed to toggle feature");
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="space-y-3">
      {FEATURE_FLAG_DEFINITIONS.map((def) => {
        const enabled = flagMap.get(def.key) ?? def.defaultEnabled;
        return (
          <div
            key={def.key}
            className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-900 px-4 py-4"
          >
            <div>
              <p className="font-medium font-mono text-sm">{def.key}</p>
              <p className="text-sm text-slate-400">{def.description}</p>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant={enabled ? "default" : "outline"}>
                {enabled ? "Enabled" : "Disabled"}
              </Badge>
              <Button
                variant="outline"
                size="sm"
                disabled={loading === def.key}
                onClick={() => toggle(def.key, !enabled)}
              >
                {loading === def.key ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : enabled ? (
                  "Disable"
                ) : (
                  "Enable"
                )}
              </Button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
