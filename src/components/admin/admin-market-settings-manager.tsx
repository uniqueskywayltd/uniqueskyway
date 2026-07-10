"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { MarketAssetKey, MarketTickerConfig } from "@/lib/constants/trust-components";
import { toast } from "sonner";

const ALL_ASSETS: { key: MarketAssetKey; label: string }[] = [
  { key: "btc", label: "Bitcoin" },
  { key: "eth", label: "Ethereum" },
  { key: "sol", label: "Solana" },
  { key: "bnb", label: "BNB" },
  { key: "gold", label: "Gold" },
  { key: "silver", label: "Silver" },
  { key: "crude_oil", label: "Crude Oil" },
  { key: "sp500", label: "S&P 500" },
  { key: "nasdaq", label: "NASDAQ" },
  { key: "dxy", label: "DXY" },
  { key: "eur_usd", label: "EUR/USD" },
  { key: "gbp_usd", label: "GBP/USD" },
];

type Props = {
  config: MarketTickerConfig;
};

export function AdminMarketSettingsManager({ config }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [cfg, setCfg] = useState(config);

  function toggleAsset(key: MarketAssetKey) {
    setCfg((prev) => {
      const visible = prev.visibleAssets.includes(key);
      return {
        ...prev,
        visibleAssets: visible
          ? prev.visibleAssets.filter((k) => k !== key)
          : [...prev.visibleAssets, key],
      };
    });
  }

  async function save() {
    setLoading(true);
    try {
      const res = await fetch("/api/hard/auth/market-settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ config: cfg }),
      });
      if (!res.ok) throw new Error();
      toast.success("Market settings saved");
      router.refresh();
    } catch {
      toast.error("Failed to save market settings");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6 rounded-xl border border-border bg-card p-5">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div>
          <Label>Data provider</Label>
          <select
            className="mt-1.5 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={cfg.provider}
            onChange={(e) =>
              setCfg({
                ...cfg,
                provider: e.target.value as MarketTickerConfig["provider"],
              })
            }
          >
            <option value="mock">Mock (institutional preview)</option>
            <option value="cached">Cached provider</option>
            <option value="live">Live provider</option>
          </select>
        </div>
        <div>
          <Label>Refresh interval (seconds)</Label>
          <Input
            type="number"
            value={cfg.refreshIntervalSeconds}
            onChange={(e) =>
              setCfg({ ...cfg, refreshIntervalSeconds: Number(e.target.value) || 300 })
            }
            className="mt-1.5 border-input bg-background"
          />
        </div>
        <div>
          <Label>Cache duration (seconds)</Label>
          <Input
            type="number"
            value={cfg.cacheDurationSeconds}
            onChange={(e) =>
              setCfg({ ...cfg, cacheDurationSeconds: Number(e.target.value) || 300 })
            }
            className="mt-1.5 border-input bg-background"
          />
        </div>
      </div>

      <div>
        <Label className="mb-3 block">Visible assets</Label>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {ALL_ASSETS.map((asset) => (
            <label
              key={asset.key}
              className="flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm text-foreground/80"
            >
              <input
                type="checkbox"
                checked={cfg.visibleAssets.includes(asset.key)}
                onChange={() => toggleAsset(asset.key)}
              />
              {asset.label}
            </label>
          ))}
        </div>
      </div>

      <Button onClick={save} disabled={loading}>
        {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
        Save market settings
      </Button>
      <p className="text-xs text-muted-foreground">
        Use Feature Flags to enable or disable the market ticker globally. Provider swaps do not
        require a deployment.
      </p>
    </div>
  );
}
