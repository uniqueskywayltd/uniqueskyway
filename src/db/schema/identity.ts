import {
  boolean,
  index,
  integer,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { id, timestamps } from "./common";
import { profiles } from "./users";

export const profilePreferences = pgTable(
  "profile_preferences",
  {
    id,
    profileId: uuid("profile_id")
      .notNull()
      .unique()
      .references(() => profiles.id),
    locale: text("locale").notNull().default("en"),
    theme: text("theme").notNull().default("system"),
    timezone: text("timezone").default("America/Chicago"),
    marketingEmails: boolean("marketing_emails").notNull().default(false),
    preferredCurrency: text("preferred_currency").notNull().default("USD"),
    ...timestamps,
  },
  (table) => [index("profile_preferences_profile_id_idx").on(table.profileId)],
);

export const notificationPreferences = pgTable(
  "notification_preferences",
  {
    id,
    profileId: uuid("profile_id")
      .notNull()
      .unique()
      .references(() => profiles.id),
    emailEnabled: boolean("email_enabled").notNull().default(true),
    inAppEnabled: boolean("in_app_enabled").notNull().default(true),
    loginAlerts: boolean("login_alerts").notNull().default(true),
    securityAlerts: boolean("security_alerts").notNull().default(true),
    investmentUpdates: boolean("investment_updates").notNull().default(true),
    referralUpdates: boolean("referral_updates").notNull().default(true),
    ...timestamps,
  },
  (table) => [
    index("notification_preferences_profile_id_idx").on(table.profileId),
  ],
);

export const authLockouts = pgTable(
  "auth_lockouts",
  {
    id,
    identifier: text("identifier").notNull().unique(),
    attemptCount: integer("attempt_count").notNull().default(0),
    lockedUntil: timestamp("locked_until", {
      withTimezone: true,
      mode: "date",
    }),
    lastAttemptAt: timestamp("last_attempt_at", {
      withTimezone: true,
      mode: "date",
    }),
    ...timestamps,
  },
  (table) => [index("auth_lockouts_identifier_idx").on(table.identifier)],
);
