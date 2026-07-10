"use client";

import { useEffect, useState } from "react";
import type { MarketQuote } from "@/lib/constants/trust-components";
import { cn } from "@/lib/utils";

function formatPrice(quote: MarketQuote): string {
  if (quote.key === "eur_usd" || quote.key === "gbp_usd") {
    return quote.price.toFixed(4);
  }
  if (quote.price >= 1000) {
    return quote.price.toLocaleString("en-US", { maximumFractionDigits: 0 });
  }
  return quote.price.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function QuoteItem({ quote }: { quote: MarketQuote }) {
  const positive = quote.changePercent24h >= 0;
  return (
    <div
      className="inline-flex shrink-0 items-center gap-3 border-r border-border/40 px-4 py-2.5"
      aria-label={`${quote.name} ${formatPrice(quote)} ${positive ? "up" : "down"} ${Math.abs(quote.changePercent24h).toFixed(2)} percent`}
    >
      <span className="text-[11px] font-semibold uppercase tracking-wider text-foreground/80">
        {quote.symbol}
      </span>
      <span className="text-sm font-medium tabular-nums text-foreground">
        ${formatPrice(quote)}
      </span>
      <span
        className={cn(
          "text-xs font-medium tabular-nums",
          positive ? "text-emerald-600" : "text-red-600",
        )}
      >
        {positive ? "▲" : "▼"} {positive ? "+" : ""}
        {quote.changePercent24h.toFixed(2)}%
      </span>
    </div>
  );
}

export function MarketTickerStrip() {
  const [quotes, setQuotes] = useState<MarketQuote[]>([]);
  const [enabled, setEnabled] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [paused, setPaused] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(
    () =>
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  );

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const handler = () => setReduceMotion(mq.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const res = await fetch("/api/market-ticker");
        if (!res.ok) return;
        const data = await res.json();
        if (!active) return;
        setEnabled(Boolean(data.enabled));
        setQuotes(data.quotes ?? []);
        setLastUpdated(data.lastUpdated ?? null);
      } catch {
        /* graceful degradation */
      }
    }

    load();
    const interval = window.setInterval(load, 5 * 60 * 1000);
    return () => {
      active = false;
      window.clearInterval(interval);
    };
  }, []);

  if (!enabled || quotes.length === 0) return null;

  const track = [...quotes, ...quotes];

  return (
    <div
      className="relative z-40 border-b border-border/50 bg-muted/40"
      role="region"
      aria-label="Market overview"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      <div className="mx-auto flex h-11 max-w-[100vw] items-center overflow-hidden sm:h-12">
        <div
          className={cn(
            "flex min-w-full",
            !reduceMotion && !paused && "animate-market-ticker",
          )}
          style={reduceMotion || paused ? { transform: "none" } : undefined}
        >
          {track.map((quote, index) => (
            <QuoteItem key={`${quote.key}-${index}`} quote={quote} />
          ))}
        </div>
      </div>
      {lastUpdated ? (
        <p className="sr-only">Market data last updated {new Date(lastUpdated).toLocaleString()}</p>
      ) : null}
    </div>
  );
}
