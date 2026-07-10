import {

  ACTIVITY_FEED_CONFIG_DEFAULT,

  MARKET_TICKER_CONFIG_DEFAULT,

} from "@/lib/constants/trust-components";



/**
 * System setting keys — stored in system_settings table.

 * Business rules (ROI, plans, referral %) are NOT seeded with production values until validated.

 */

export const SYSTEM_SETTINGS = {

  COMPANY_NAME: "company_name",

  SUPPORT_EMAIL: "support_email",

  PRIMARY_EMAIL: "primary_email",

  COMPANY_PHONE: "company_phone",

  COMPANY_ADDRESS: "company_address",

  DEFAULT_CURRENCY: "default_currency",

  TIMEZONE: "timezone",

  REFERRAL_PERCENTAGE: "referral_percentage",

  MINIMUM_DEPOSIT: "minimum_deposit",

  MAXIMUM_DEPOSIT: "maximum_deposit",

  MINIMUM_WITHDRAWAL: "minimum_withdrawal",

  MAXIMUM_WITHDRAWAL: "maximum_withdrawal",

  DAILY_WITHDRAWAL_LIMIT: "daily_withdrawal_limit",

  MAINTENANCE_MESSAGE: "maintenance_message",

  NOTIFICATIONS_ENABLED: "notifications_enabled",

  NOTIFICATION_EMAIL_ENABLED: "notification_email_enabled",

  DEFAULT_INVESTMENT_STATUS: "default_investment_status",

  PLATFORM_URL: "platform_url",

  ACTIVITY_FEED_CONFIG: "activity_feed_config",

  MARKET_TICKER_CONFIG: "market_ticker_config",

} as const;



export type SystemSettingKey =

  (typeof SYSTEM_SETTINGS)[keyof typeof SYSTEM_SETTINGS];



export const SYSTEM_SETTING_DEFINITIONS: Array<{

  key: SystemSettingKey;

  value: unknown;

  description: string;

  isPublic: boolean;

}> = [

  {

    key: SYSTEM_SETTINGS.COMPANY_NAME,

    value: "Unique Sky Way",

    description: "Official company name",

    isPublic: true,

  },

  {

    key: SYSTEM_SETTINGS.SUPPORT_EMAIL,

    value: "info@uniqueskyway.com",

    description: "Customer support email address",

    isPublic: true,

  },

  {

    key: SYSTEM_SETTINGS.PRIMARY_EMAIL,

    value: "info@uniqueskyway.com",

    description: "Primary outbound email address",

    isPublic: false,

  },

  {

    key: SYSTEM_SETTINGS.COMPANY_PHONE,

    value: null,

    description: "Company contact phone number",

    isPublic: true,

  },

  {

    key: SYSTEM_SETTINGS.COMPANY_ADDRESS,

    value: "Fayetteville, Arkansas, United States",

    description: "Company physical address",

    isPublic: true,

  },

  {

    key: SYSTEM_SETTINGS.DEFAULT_CURRENCY,

    value: "USD",

    description: "Default platform currency",

    isPublic: true,

  },

  {

    key: SYSTEM_SETTINGS.TIMEZONE,

    value: "America/Chicago",

    description: "Default platform timezone",

    isPublic: false,

  },

  {

    key: SYSTEM_SETTINGS.REFERRAL_PERCENTAGE,

    value: null,

    description:

      "Referral commission percentage — set after legacy business rule validation",

    isPublic: false,

  },

  {

    key: SYSTEM_SETTINGS.MINIMUM_DEPOSIT,

    value: null,

    description:

      "Minimum deposit amount — set after legacy business rule validation",

    isPublic: false,

  },

  {

    key: SYSTEM_SETTINGS.MAXIMUM_DEPOSIT,

    value: null,

    description:

      "Maximum deposit amount — set after legacy business rule validation",

    isPublic: false,

  },

  {

    key: SYSTEM_SETTINGS.MINIMUM_WITHDRAWAL,

    value: null,

    description:

      "Minimum withdrawal amount — set after legacy business rule validation",

    isPublic: false,

  },

  {

    key: SYSTEM_SETTINGS.MAXIMUM_WITHDRAWAL,

    value: null,

    description: "Maximum single withdrawal amount",

    isPublic: false,

  },

  {

    key: SYSTEM_SETTINGS.DAILY_WITHDRAWAL_LIMIT,

    value: null,

    description: "Maximum total withdrawals per customer per day",

    isPublic: false,

  },

  {

    key: SYSTEM_SETTINGS.MAINTENANCE_MESSAGE,

    value:

      "Unique Sky Way is currently undergoing scheduled maintenance. Please check back shortly.",

    description: "Message shown during maintenance mode",

    isPublic: true,

  },

  {

    key: SYSTEM_SETTINGS.NOTIFICATIONS_ENABLED,

    value: true,

    description: "Master switch for platform notifications",

    isPublic: false,

  },

  {

    key: SYSTEM_SETTINGS.NOTIFICATION_EMAIL_ENABLED,

    value: true,

    description: "Enable transactional email notifications",

    isPublic: false,

  },

  {

    key: SYSTEM_SETTINGS.DEFAULT_INVESTMENT_STATUS,

    value: "pending",

    description: "Default status assigned to new investments",

    isPublic: false,

  },

  {

    key: SYSTEM_SETTINGS.PLATFORM_URL,

    value: "https://uniqueskyway.com",

    description: "Production platform URL",

    isPublic: true,

  },

  {

    key: SYSTEM_SETTINGS.ACTIVITY_FEED_CONFIG,

    value: ACTIVITY_FEED_CONFIG_DEFAULT,

    description: "Homepage activity feed display and seed behaviour",

    isPublic: false,

  },

  {

    key: SYSTEM_SETTINGS.MARKET_TICKER_CONFIG,

    value: MARKET_TICKER_CONFIG_DEFAULT,

    description: "Market overview ticker assets, provider, and refresh settings",

    isPublic: false,

  },

];

