"use client";

import dynamic from "next/dynamic";

export const LazyMarketTicker = dynamic(
  () =>
    import("@/components/marketing/market-ticker-strip").then((m) => m.MarketTickerStrip),
  { ssr: false },
);

export const LazyActivityFeed = dynamic(
  () =>
    import("@/components/marketing/activity-feed-ticker").then((m) => m.ActivityFeedTicker),
  { ssr: false },
);
