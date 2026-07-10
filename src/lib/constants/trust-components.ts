/** Trust component configuration — stored as JSON in system_settings */

export type ActivityFeedConfig = {
  displayDurationMs: number;
  animationSpeedMs: number;
  maxVisibleHistory: number;
  minimumRealActivityBeforeDisablingSeedData: number;
  seedEnabled: boolean;
  /** Minimum gap before the same person appears again (default 1 hour). */
  nameCooldownMs: number;
  /** Registration pop-ups only show within this window (default 24 hours). */
  registrationDisplayWindowMs: number;
};

export type MarketAssetKey =
  | "btc"
  | "eth"
  | "sol"
  | "bnb"
  | "gold"
  | "silver"
  | "crude_oil"
  | "sp500"
  | "nasdaq"
  | "dxy"
  | "eur_usd"
  | "gbp_usd";

export type MarketTickerConfig = {
  provider: "mock" | "cached" | "live";
  refreshIntervalSeconds: number;
  cacheDurationSeconds: number;
  visibleAssets: MarketAssetKey[];
};

export const ACTIVITY_FEED_CONFIG_DEFAULT: ActivityFeedConfig = {
  displayDurationMs: 76_000,
  animationSpeedMs: 400,
  maxVisibleHistory: 50,
  minimumRealActivityBeforeDisablingSeedData: 25,
  seedEnabled: true,
  nameCooldownMs: 60 * 60 * 1000,
  registrationDisplayWindowMs: 24 * 60 * 60 * 1000,
};

export const MARKET_TICKER_CONFIG_DEFAULT: MarketTickerConfig = {
  provider: "mock",
  refreshIntervalSeconds: 300,
  cacheDurationSeconds: 300,
  visibleAssets: [
    "btc",
    "eth",
    "sol",
    "bnb",
    "gold",
    "silver",
    "crude_oil",
    "sp500",
    "nasdaq",
    "dxy",
    "eur_usd",
    "gbp_usd",
  ],
};

export const TRUST_SYSTEM_SETTINGS = {
  ACTIVITY_FEED_CONFIG: "activity_feed_config",
  MARKET_TICKER_CONFIG: "market_ticker_config",
} as const;

export type ActivityFeedType =
  | "registration"
  | "deposit"
  | "withdrawal"
  | "investment"
  | "referral"
  | "roi_earned"
  | "investment_matured"
  | "announcement";

export type ActivityFeedItem = {
  id: string;
  type: ActivityFeedType;
  title: string | null;
  customerNameMasked: string | null;
  /** Stable key for per-person rotation cooldown (profile id or seed id). */
  subjectKey: string | null;
  city: string | null;
  country: string | null;
  amount: string | null;
  currency: string;
  investmentPlan: string | null;
  isSeed: boolean;
  isPinned: boolean;
  occurredAt: string;
};

export type MarketQuote = {
  key: MarketAssetKey;
  symbol: string;
  name: string;
  price: number;
  changePercent24h: number;
  currency: string;
};

export type MarketTickerPayload = {
  quotes: MarketQuote[];
  lastUpdated: string;
  provider: string;
};
