import {
  boolean,
  index,
  integer,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { id, softDelete, timestamps } from "./common";
import { adminRoleEnum, userStatusEnum } from "./enums";

/**
 * Customer profile — linked 1:1 with Supabase auth.users via authUserId.
 * legacyUserId preserves the original MariaDB u_id for migration parity.
 */
export const profiles = pgTable(
  "profiles",
  {
    id,
    authUserId: uuid("auth_user_id").notNull().unique(),
    legacyUserId: integer("legacy_user_id").unique(),
    email: text("email").notNull().unique(),
    fullName: text("full_name").notNull(),
    username: text("username").notNull().unique(),
    avatarPath: text("avatar_path"),
    status: userStatusEnum("status").notNull().default("active"),
    referralCode: text("referral_code").notNull().unique(),
    referredByProfileId: uuid("referred_by_profile_id"),
    phone: text("phone"),
    country: text("country"),
    addressLine1: text("address_line1"),
    addressLine2: text("address_line2"),
    city: text("city"),
    state: text("state"),
    postalCode: text("postal_code"),
    timezone: text("timezone").default("UTC"),
    emailVerified: boolean("email_verified").notNull().default(false),
    loginDisabled: boolean("login_disabled").notNull().default(false),
    ...timestamps,
    deletedAt: softDelete,
  },
  (table) => [
    index("profiles_auth_user_id_idx").on(table.authUserId),
    index("profiles_legacy_user_id_idx").on(table.legacyUserId),
    index("profiles_referred_by_idx").on(table.referredByProfileId),
    index("profiles_status_idx").on(table.status),
    index("profiles_email_idx").on(table.email),
  ],
);

/**
 * Admin operators — separate from customer profiles for RBAC isolation.
 */
export const adminUsers = pgTable(
  "admin_users",
  {
    id,
    authUserId: uuid("auth_user_id").notNull().unique(),
    legacyAdminId: integer("legacy_admin_id").unique(),
    email: text("email").notNull().unique(),
    fullName: text("full_name").notNull(),
    role: adminRoleEnum("role").notNull().default("super_admin"),
    isActive: boolean("is_active").notNull().default(true),
    lastLoginAt: timestamp("last_login_at", {
      withTimezone: true,
      mode: "date",
    }),
    ...timestamps,
    deletedAt: softDelete,
  },
  (table) => [
    index("admin_users_auth_user_id_idx").on(table.authUserId),
    index("admin_users_role_idx").on(table.role),
    uniqueIndex("admin_users_email_idx").on(table.email),
  ],
);

export const loginHistory = pgTable(
  "login_history",
  {
    id,
    profileId: uuid("profile_id").references(() => profiles.id),
    adminUserId: uuid("admin_user_id").references(() => adminUsers.id),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    deviceFingerprint: text("device_fingerprint"),
    country: text("country"),
    city: text("city"),
    success: boolean("success").notNull(),
    failureReason: text("failure_reason"),
    ...timestamps,
  },
  (table) => [
    index("login_history_profile_id_idx").on(table.profileId),
    index("login_history_admin_user_id_idx").on(table.adminUserId),
    index("login_history_created_at_idx").on(table.createdAt),
  ],
);

/**
 * Active session tracking for device/session management.
 */
export const userSessions = pgTable(
  "user_sessions",
  {
    id,
    profileId: uuid("profile_id").references(() => profiles.id),
    adminUserId: uuid("admin_user_id").references(() => adminUsers.id),
    authSessionId: text("auth_session_id"),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    deviceFingerprint: text("device_fingerprint"),
    deviceLabel: text("device_label"),
    browser: text("browser"),
    os: text("os"),
    isCurrent: boolean("is_current").notNull().default(false),
    lastActiveAt: timestamp("last_active_at", {
      withTimezone: true,
      mode: "date",
    }),
    revokedAt: timestamp("revoked_at", { withTimezone: true, mode: "date" }),
    ...timestamps,
  },
  (table) => [
    index("user_sessions_profile_id_idx").on(table.profileId),
    index("user_sessions_admin_user_id_idx").on(table.adminUserId),
    index("user_sessions_auth_session_id_idx").on(table.authSessionId),
  ],
);
