import {
  index,
  jsonb,
  numeric,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { id, timestamps } from "./common";
import { withdrawalRequests } from "./ledger";

export const payoutStatusEnum = pgEnum("payout_status", [
  "pending",
  "processing",
  "completed",
  "failed",
]);

export const payoutProviderTypeEnum = pgEnum("payout_provider_type", [
  "manual",
  "api",
]);

export const treasuryPayouts = pgTable(
  "treasury_payouts",
  {
    id,
    withdrawalRequestId: uuid("withdrawal_request_id")
      .notNull()
      .references(() => withdrawalRequests.id),
    providerType: payoutProviderTypeEnum("provider_type").notNull().default("manual"),
    providerSlug: text("provider_slug").notNull().default("manual"),
    status: payoutStatusEnum("status").notNull().default("pending"),
    amount: numeric("amount", { precision: 18, scale: 2 }).notNull(),
    currency: text("currency").notNull().default("USD"),
    destinationSnapshot: jsonb("destination_snapshot")
      .$type<Record<string, unknown>>()
      .notNull()
      .default({}),
    externalReference: text("external_reference"),
    failureReason: text("failure_reason"),
    processedByAdminId: uuid("processed_by_admin_id"),
    processedAt: timestamp("processed_at", { withTimezone: true, mode: "date" }),
    completedAt: timestamp("completed_at", { withTimezone: true, mode: "date" }),
    failedAt: timestamp("failed_at", { withTimezone: true, mode: "date" }),
    metadata: jsonb("metadata").$type<Record<string, unknown>>().default({}),
    ...timestamps,
  },
  (table) => [
    index("treasury_payouts_status_idx").on(table.status),
    index("treasury_payouts_withdrawal_id_idx").on(table.withdrawalRequestId),
  ],
);
