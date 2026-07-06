import { boolean, index, jsonb, pgTable, text, uuid } from "drizzle-orm/pg-core";
import { id, timestamps } from "./common";
import { adminUsers } from "./users";

/**
 * Runtime feature flags — toggled without code deployments.
 */
export const featureFlags = pgTable(
  "feature_flags",
  {
    id,
    key: text("key").notNull().unique(),
    enabled: boolean("enabled").notNull().default(false),
    description: text("description"),
    /** Optional JSON metadata (e.g. rollout percentage, allowed roles) */
    metadata: jsonb("metadata"),
    updatedByAdminId: uuid("updated_by_admin_id").references(() => adminUsers.id),
    ...timestamps,
  },
  (table) => [index("feature_flags_key_idx").on(table.key)],
);

/**
 * Platform-wide configuration — no hardcoded business values in application code.
 */
export const systemSettings = pgTable(
  "system_settings",
  {
    id,
    key: text("key").notNull().unique(),
    value: jsonb("value").notNull(),
    description: text("description"),
    /** Public settings are readable by unauthenticated clients (e.g. company name) */
    isPublic: boolean("is_public").notNull().default(false),
    updatedByAdminId: uuid("updated_by_admin_id").references(() => adminUsers.id),
    ...timestamps,
  },
  (table) => [index("system_settings_key_idx").on(table.key)],
);
