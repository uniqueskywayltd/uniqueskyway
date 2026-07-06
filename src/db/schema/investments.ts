import {
  boolean,
  index,
  integer,
  numeric,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { id, softDelete, timestamps } from "./common";
import { investmentStatusEnum } from "./enums";
import { profiles } from "./users";

/**
 * Configurable investment plans — admin-managed, replaces hardcoded PHP logic.
 * ROI and maturity rules are stored as structured config, not scattered in code.
 */
export const investmentPlans = pgTable(
  "investment_plans",
  {
    id,
    slug: text("slug").notNull().unique(),
    name: text("name").notNull(),
    description: text("description"),
    /** Daily ROI percentage (e.g. 4.00 = 4%) */
    dailyRoiPercent: numeric("daily_roi_percent", {
      precision: 8,
      scale: 4,
    }).notNull(),
    /** Maximum total ROI cap percentage before maturity */
    maxRoiPercent: numeric("max_roi_percent", {
      precision: 8,
      scale: 4,
    }),
    minDeposit: numeric("min_deposit", { precision: 18, scale: 2 }).notNull(),
    maxDeposit: numeric("max_deposit", { precision: 18, scale: 2 }),
    durationDays: integer("duration_days").notNull(),
    lockPeriodDays: integer("lock_period_days").notNull().default(5),
    referralCommissionPercent: numeric("referral_commission_percent", {
      precision: 8,
      scale: 4,
    })
      .notNull()
      .default("10"),
    reinvestEnabled: boolean("reinvest_enabled").notNull().default(true),
    maxReinvestCycles: integer("max_reinvest_cycles").notNull().default(2),
    currency: text("currency").notNull().default("USD"),
    compounding: boolean("compounding").notNull().default(false),
    gracePeriodDays: integer("grace_period_days").notNull().default(0),
    isVisible: boolean("is_visible").notNull().default(true),
    isActive: boolean("is_active").notNull().default(true),
    sortOrder: integer("sort_order").notNull().default(0),
    ...timestamps,
    ...{ deletedAt: softDelete },
  },
  (table) => [
    index("investment_plans_slug_idx").on(table.slug),
    index("investment_plans_active_idx").on(table.isActive),
  ],
);

/**
 * A single customer investment position.
 */
export const investments = pgTable(
  "investments",
  {
    id,
    profileId: uuid("profile_id")
      .notNull()
      .references(() => profiles.id),
    planId: uuid("plan_id")
      .notNull()
      .references(() => investmentPlans.id),
    legacyTransactionId: integer("legacy_transaction_id").unique(),
    principalAmount: numeric("principal_amount", {
      precision: 18,
      scale: 2,
    }).notNull(),
    accruedInterest: numeric("accrued_interest", {
      precision: 18,
      scale: 2,
    })
      .notNull()
      .default("0"),
    status: investmentStatusEnum("status").notNull().default("pending"),
    paymentMethod: text("payment_method"),
    externalTransactionRef: text("external_transaction_ref"),
    startedAt: timestamp("started_at", { withTimezone: true, mode: "date" }),
    maturesAt: timestamp("matures_at", { withTimezone: true, mode: "date" }),
    maturedAt: timestamp("matured_at", { withTimezone: true, mode: "date" }),
    lastAccrualAt: timestamp("last_accrual_at", {
      withTimezone: true,
      mode: "date",
    }),
    reinvestCycle: integer("reinvest_cycle").notNull().default(0),
    parentInvestmentId: uuid("parent_investment_id"),
    approvedByAdminId: uuid("approved_by_admin_id"),
    depositRequestId: uuid("deposit_request_id"),
    isPaused: boolean("is_paused").notNull().default(false),
    pausedAt: timestamp("paused_at", { withTimezone: true, mode: "date" }),
    activatedAt: timestamp("activated_at", { withTimezone: true, mode: "date" }),
    totalRoiCredited: numeric("total_roi_credited", { precision: 18, scale: 2 })
      .notNull()
      .default("0"),
    referralCommissionPaid: boolean("referral_commission_paid").notNull().default(false),
    ...timestamps,
    ...{ deletedAt: softDelete },
  },
  (table) => [
    index("investments_profile_id_idx").on(table.profileId),
    index("investments_plan_id_idx").on(table.planId),
    index("investments_status_idx").on(table.status),
    index("investments_legacy_tx_idx").on(table.legacyTransactionId),
    index("investments_deposit_request_id_idx").on(table.depositRequestId),
    index("investments_last_accrual_idx").on(table.lastAccrualAt),
    index("investments_matures_at_idx").on(table.maturesAt),
  ],
);
