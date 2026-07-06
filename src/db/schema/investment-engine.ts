import {
  index,
  integer,
  jsonb,
  numeric,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { id } from "./common";
import { investments } from "./investments";
import { profiles } from "./users";

export const roiRunStatusEnum = pgEnum("roi_run_status", [
  "running",
  "completed",
  "failed",
  "dry_run",
]);

export const roiRunModeEnum = pgEnum("roi_run_mode", [
  "daily",
  "single",
  "recovery",
  "dry_run",
]);

export const investmentEventTypeEnum = pgEnum("investment_event_type", [
  "created",
  "activated",
  "roi_accrued",
  "reinvested",
  "matured",
  "closed",
  "paused",
  "resumed",
  "force_matured",
]);

export const roiProcessingRuns = pgTable(
  "roi_processing_runs",
  {
    id,
    mode: roiRunModeEnum("mode").notNull(),
    status: roiRunStatusEnum("status").notNull().default("running"),
    startedAt: timestamp("started_at", { withTimezone: true, mode: "date" })
      .notNull()
      .defaultNow(),
    finishedAt: timestamp("finished_at", { withTimezone: true, mode: "date" }),
    investmentsProcessed: integer("investments_processed").notNull().default(0),
    investmentsMatured: integer("investments_matured").notNull().default(0),
    roiGenerated: numeric("roi_generated", { precision: 18, scale: 2 })
      .notNull()
      .default("0"),
    commissionsGenerated: numeric("commissions_generated", { precision: 18, scale: 2 })
      .notNull()
      .default("0"),
    errors: jsonb("errors").$type<Array<{ investmentId?: string; message: string }>>().default([]),
    durationMs: integer("duration_ms"),
    targetInvestmentId: uuid("target_investment_id").references(() => investments.id),
    metadata: jsonb("metadata").$type<Record<string, unknown>>().default({}),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("roi_processing_runs_started_at_idx").on(table.startedAt),
    index("roi_processing_runs_status_idx").on(table.status),
  ],
);

export const investmentEvents = pgTable(
  "investment_events",
  {
    id,
    investmentId: uuid("investment_id")
      .notNull()
      .references(() => investments.id),
    profileId: uuid("profile_id")
      .notNull()
      .references(() => profiles.id),
    eventType: investmentEventTypeEnum("event_type").notNull(),
    title: text("title").notNull(),
    description: text("description"),
    amount: numeric("amount", { precision: 18, scale: 2 }),
    metadata: jsonb("metadata").$type<Record<string, unknown>>().default({}),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("investment_events_investment_id_idx").on(table.investmentId),
    index("investment_events_profile_id_idx").on(table.profileId),
    index("investment_events_type_idx").on(table.eventType),
  ],
);
