/**
 * Feature flag keys — toggled via feature_flags table, not code.
 */
export const FEATURE_FLAGS = {
  REGISTRATIONS_ENABLED: "registrations_enabled",
  DEPOSITS_ENABLED: "deposits_enabled",
  WITHDRAWALS_ENABLED: "withdrawals_enabled",
  REFERRALS_ENABLED: "referrals_enabled",
  INVESTMENTS_ENABLED: "investments_enabled",
  MAINTENANCE_MODE: "maintenance_mode",
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
];
