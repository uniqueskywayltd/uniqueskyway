"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

type SettingRow = {
  key: string;
  value: unknown;
  description: string | null;
  isPublic: boolean;
};

function formatSettingValue(value: unknown): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "string") return value;
  if (typeof value === "boolean") return value ? "true" : "false";
  if (typeof value === "number") return String(value);
  return JSON.stringify(value, null, 2);
}

function isJsonSetting(key: string, value: unknown): boolean {
  if (key.endsWith("_config")) return true;
  return typeof value === "object" && value !== null;
}

function parseSettingValue(raw: string, original: unknown): unknown {
  const trimmed = raw.trim();
  if (trimmed === "" && (original === null || original === undefined)) {
    return null;
  }
  if (typeof original === "boolean") {
    return trimmed === "true";
  }
  if (typeof original === "number") {
    const num = Number(trimmed);
    return Number.isFinite(num) ? num : raw;
  }
  if (isJsonSetting("", original) || trimmed.startsWith("{") || trimmed.startsWith("[")) {
    return JSON.parse(trimmed);
  }
  try {
    return JSON.parse(trimmed);
  } catch {
    return raw;
  }
}

const SETTING_GROUPS: Array<{ title: string; keys: string[] }> = [
  {
    title: "Company & contact",
    keys: [
      "company_name",
      "support_email",
      "primary_email",
      "company_phone",
      "company_address",
      "platform_url",
      "timezone",
    ],
  },
  {
    title: "Financial limits",
    keys: [
      "default_currency",
      "referral_percentage",
      "minimum_deposit",
      "maximum_deposit",
      "minimum_withdrawal",
      "maximum_withdrawal",
      "daily_withdrawal_limit",
      "default_investment_status",
    ],
  },
  {
    title: "Platform behaviour",
    keys: [
      "maintenance_message",
      "notifications_enabled",
      "notification_email_enabled",
      "super_admin_bootstrapped",
      "activity_feed_config",
      "market_ticker_config",
    ],
  },
];

export function AdminSettingsManager({ settings }: { settings: SettingRow[] }) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);
  const [values, setValues] = useState<Record<string, string>>(() =>
    Object.fromEntries(settings.map((s) => [s.key, formatSettingValue(s.value)])),
  );

  const settingsByKey = useMemo(
    () => new Map(settings.map((s) => [s.key, s])),
    [settings],
  );

  const groupedKeys = useMemo(() => {
    const known = new Set(SETTING_GROUPS.flatMap((g) => g.keys));
    const other = settings.map((s) => s.key).filter((k) => !known.has(k));
    return [
      ...SETTING_GROUPS,
      ...(other.length ? [{ title: "Other", keys: other }] : []),
    ];
  }, [settings]);

  async function save(key: string) {
    const setting = settingsByKey.get(key);
    if (!setting) return;

    setLoading(key);
    try {
      const raw = values[key] ?? "";
      let value: unknown;
      try {
        value = parseSettingValue(raw, setting.value);
      } catch {
        throw new Error("Invalid value format");
      }

      const res = await fetch("/api/hard/auth/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key, value }),
      });
      if (!res.ok) throw new Error("Save failed");
      toast.success("Setting updated");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save setting");
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="space-y-8 max-w-3xl">
      {groupedKeys.map((group) => (
        <section key={group.title} className="space-y-4">
          <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-muted-foreground">
            {group.title}
          </h2>
          {group.keys.map((key) => {
            const s = settingsByKey.get(key);
            if (!s) return null;

            const isUnset = s.value === null || s.value === undefined;
            const multiline = isJsonSetting(s.key, s.value);

            return (
              <div
                key={s.key}
                className="rounded-xl border border-border bg-card p-4 space-y-3"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <Label htmlFor={s.key} className="font-mono text-sm text-foreground">
                    {s.key}
                  </Label>
                  {s.isPublic ? (
                    <Badge variant="secondary" className="text-[10px] uppercase">
                      Public
                    </Badge>
                  ) : null}
                  {isUnset ? (
                    <Badge variant="outline" className="text-[10px] uppercase">
                      Not configured
                    </Badge>
                  ) : null}
                </div>
                {s.description ? (
                  <p className="text-xs leading-relaxed text-muted-foreground">{s.description}</p>
                ) : null}
                {multiline ? (
                  <Textarea
                    id={s.key}
                    value={values[s.key] ?? ""}
                    onChange={(e) => setValues({ ...values, [s.key]: e.target.value })}
                    placeholder={isUnset ? "Leave empty to keep unset" : undefined}
                    className="min-h-[120px] bg-background border-input font-mono text-sm text-foreground"
                  />
                ) : (
                  <Input
                    id={s.key}
                    value={values[s.key] ?? ""}
                    onChange={(e) => setValues({ ...values, [s.key]: e.target.value })}
                    placeholder={isUnset ? "Not configured — enter a value to set" : undefined}
                    className="bg-background border-input font-mono text-sm text-foreground"
                  />
                )}
                <Button
                  size="sm"
                  variant="outline"
                  disabled={loading === s.key}
                  onClick={() => save(s.key)}
                >
                  {loading === s.key ? <Loader2 className="h-3 w-3 animate-spin" /> : "Save"}
                </Button>
              </div>
            );
          })}
        </section>
      ))}
    </div>
  );
}
