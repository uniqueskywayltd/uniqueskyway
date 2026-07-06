"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

type SettingRow = {
  key: string;
  value: unknown;
  description: string | null;
  isPublic: boolean;
};

export function AdminSettingsManager({ settings }: { settings: SettingRow[] }) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);
  const [edits, setEdits] = useState<Record<string, string>>({});

  async function save(key: string) {
    setLoading(key);
    try {
      const raw = edits[key];
      let value: unknown = raw;
      try {
        value = JSON.parse(raw);
      } catch {
        value = raw;
      }

      const res = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key, value }),
      });
      if (!res.ok) throw new Error("Save failed");
      toast.success("Setting updated");
      router.refresh();
    } catch {
      toast.error("Failed to save setting");
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="space-y-4 max-w-2xl">
      {settings.map((s) => (
        <div key={s.key} className="rounded-xl border border-slate-800 bg-slate-900 p-4 space-y-2">
          <div className="flex items-center justify-between">
            <Label className="font-mono text-sm">{s.key}</Label>
            {s.isPublic ? (
              <span className="text-xs text-slate-500">Public</span>
            ) : null}
          </div>
          {s.description ? <p className="text-xs text-slate-400">{s.description}</p> : null}
          <Input
            defaultValue={
              edits[s.key] ??
              (typeof s.value === "string" ? s.value : JSON.stringify(s.value))
            }
            onChange={(e) => setEdits({ ...edits, [s.key]: e.target.value })}
            className="bg-slate-950 border-slate-700 font-mono text-sm"
          />
          <Button
            size="sm"
            variant="outline"
            disabled={loading === s.key}
            onClick={() => save(s.key)}
          >
            {loading === s.key ? <Loader2 className="h-3 w-3 animate-spin" /> : "Save"}
          </Button>
        </div>
      ))}
    </div>
  );
}
