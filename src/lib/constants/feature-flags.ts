/**
 * Feature flag keys — toggled via feature_flags table, not code.
 */export const FEATURE_FLAGS = {
  REGISTRATIONS_ENABLED: "registrations_enabled",
  DEPOSITS_ENABLED: "deposits_enabled",
  WITHDRAWALS_ENABLED: "withdrawals_enabled",
  REFERRALS_ENABLED: "referrals_enabled",
  INVESTMENTS_ENABLED: "investments_enabled",
  MAINTENANCE_MODE: "maintenance_mode",
  ACTIVITY_FEED_ENABLED: "activity_feed_enabled",
  SEED_ACTIVITY_ENABLED: "seed_activity_enabled",
  MARKET_TICKER_ENABLED: "market_ticker_enabled",
  PLATFORM_WALLETS_ENABLED: "platform_wallets_enabled",
} as const;

export type FeatureFlagKey = (typeof FEATURE_FLAGS)[keyof typeof FEATURE_FLAGS];

export const FEATURE_FLAG_DEFINITIONS: Array<{
  key: FeatureFlagKey;
  description: string;
  defaultEnabled: boolean;
}> = [
  {
    key: FEATURE_FLAGS.REGISTRATIONS_ENABLED,
    description: "Allow new customer registrations",
    defaultEnabled: false,
  },
  {
    key: FEATURE_FLAGS.DEPOSITS_ENABLED,
    description: "Allow customer deposit requests",
    defaultEnabled: false,
  },
  {
    key: FEATURE_FLAGS.WITHDRAWALS_ENABLED,
    description: "Allow customer withdrawal requests",
    defaultEnabled: false,
  },
  {
    key: FEATURE_FLAGS.REFERRALS_ENABLED,
    description: "Enable referral program",
    defaultEnabled: false,
  },
  {
    key: FEATURE_FLAGS.INVESTMENTS_ENABLED,
    description: "Allow new investments (requires validated plans)",
    defaultEnabled: false,
  },
  {
    key: FEATURE_FLAGS.MAINTENANCE_MODE,
    description: "Put platform in maintenance mode",
    defaultEnabled: false,
  },
  {
    key: FEATURE_FLAGS.ACTIVITY_FEED_ENABLED,
    description: "Show live activity ticker on the homepage",
    defaultEnabled: true,
  },
  {
    key: FEATURE_FLAGS.SEED_ACTIVITY_ENABLED,
    description: "Include seeded activity items in the homepage feed",
    defaultEnabled: true,
  },
  {
    key: FEATURE_FLAGS.MARKET_TICKER_ENABLED,
    description: "Show market overview strip below the header",
    defaultEnabled: true,
  },
  {
    key: FEATURE_FLAGS.PLATFORM_WALLETS_ENABLED,
    description: "Allow customers to deposit via configured platform wallets",
    defaultEnabled: false,
  },
];
