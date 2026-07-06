import {
  boolean,
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
import { id, timestamps } from "./common";
import { adminUsers } from "./users";

export const migrationPhaseEnum = pgEnum("migration_phase", [
  "extract",
  "validate",
  "transform",
  "load",
  "verify",
  "report",
]);

export const migrationRunStatusEnum = pgEnum("migration_run_status", [
  "pending",
  "running",
  "paused",
  "completed",
  "failed",
  "rolled_back",
]);

export const migrationRuns = pgTable(
  "migration_runs",
  {
    id,
    runKey: text("run_key").notNull().unique(),
    label: text("label"),
    status: migrationRunStatusEnum("status").notNull().default("pending"),
    dryRun: boolean("dry_run").notNull().default(true),
    currentPhase: migrationPhaseEnum("current_phase"),
    sourcePath: text("source_path").notNull(),
    startedByAdminId: uuid("started_by_admin_id").references(() => adminUsers.id),
    startedAt: timestamp("started_at", { withTimezone: true, mode: "date" }),
    completedAt: timestamp("completed_at", { withTimezone: true, mode: "date" }),
    errorMessage: text("error_message"),
    stats: jsonb("stats").$type<Record<string, number>>().default({}),
    metadata: jsonb("metadata").$type<Record<string, unknown>>().default({}),
    ...timestamps,
  },
  (table) => [
    index("migration_runs_status_idx").on(table.status),
    index("migration_runs_created_at_idx").on(table.createdAt),
  ],
);

export const migrationCheckpoints = pgTable(
  "migration_checkpoints",
  {
    id,
    runId: uuid("run_id")
      .notNull()
      .references(() => migrationRuns.id, { onDelete: "cascade" }),
    phase: migrationPhaseEnum("phase").notNull(),
    entityType: text("entity_type").notNull(),
    lastLegacyId: integer("last_legacy_id"),
    processedCount: integer("processed_count").notNull().default(0),
    cursorData: jsonb("cursor_data").$type<Record<string, unknown>>(),
    ...timestamps,
  },
  (table) => [
    index("migration_checkpoints_run_idx").on(table.runId),
    index("migration_checkpoints_run_phase_idx").on(table.runId, table.phase),
  ],
);

export const migrationIdempotency = pgTable(
  "migration_idempotency",
  {
    id,
    runId: uuid("run_id")
      .notNull()
      .references(() => migrationRuns.id, { onDelete: "cascade" }),
    entityType: text("entity_type").notNull(),
    legacyId: integer("legacy_id").notNull(),
    newEntityId: uuid("new_entity_id"),
    idempotencyKey: text("idempotency_key").notNull().unique(),
    ...timestamps,
  },
  (table) => [
    index("migration_idempotency_run_idx").on(table.runId),
    index("migration_idempotency_legacy_idx").on(table.entityType, table.legacyId),
  ],
);

export const migrationReports = pgTable(
  "migration_reports",
  {
    id,
    runId: uuid("run_id")
      .notNull()
      .references(() => migrationRuns.id, { onDelete: "cascade" }),
    reportType: text("report_type").notNull(),
    title: text("title").notNull(),
    summary: text("summary"),
    payload: jsonb("payload").notNull(),
    filePath: text("file_path"),
    ...timestamps,
  },
  (table) => [
    index("migration_reports_run_idx").on(table.runId),
    index("migration_reports_type_idx").on(table.reportType),
  ],
);

export const migrationBalanceExceptions = pgTable(
  "migration_balance_exceptions",
  {
    id,
    runId: uuid("run_id")
      .notNull()
      .references(() => migrationRuns.id, { onDelete: "cascade" }),
    legacyUserId: integer("legacy_user_id").notNull(),
    profileId: uuid("profile_id"),
    email: text("email").notNull(),
    legacyAvailable: numeric("legacy_available", { precision: 18, scale: 2 }).notNull(),
    newAvailable: numeric("new_available", { precision: 18, scale: 2 }).notNull(),
    legacyInvested: numeric("legacy_invested", { precision: 18, scale: 2 }).notNull(),
    newInvested: numeric("new_invested", { precision: 18, scale: 2 }).notNull(),
    legacyTotal: numeric("legacy_total", { precision: 18, scale: 2 }).notNull(),
    newTotal: numeric("new_total", { precision: 18, scale: 2 }).notNull(),
    difference: numeric("difference", { precision: 18, scale: 2 }).notNull(),
    details: jsonb("details").$type<Record<string, unknown>>(),
    resolved: boolean("resolved").notNull().default(false),
    ...timestamps,
  },
  (table) => [
    index("migration_balance_exceptions_run_idx").on(table.runId),
    index("migration_balance_exceptions_email_idx").on(table.email),
  ],
);
