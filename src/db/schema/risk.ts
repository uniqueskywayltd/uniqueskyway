import { index, jsonb, pgEnum, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { id } from "./common";
import { withdrawalRequests } from "./ledger";
import { profiles } from "./users";

export const riskSeverityEnum = pgEnum("risk_severity", ["low", "medium", "high"]);

export const riskEventTypeEnum = pgEnum("risk_event_type", [
  "large_withdrawal",
  "multiple_withdrawals",
  "device_change",
  "new_login_location",
  "high_risk_pattern",
]);

export const riskEvents = pgTable(
  "risk_events",
  {
    id,
    profileId: uuid("profile_id")
      .notNull()
      .references(() => profiles.id),
    withdrawalRequestId: uuid("withdrawal_request_id").references(
      () => withdrawalRequests.id,
    ),
    eventType: riskEventTypeEnum("event_type").notNull(),
    severity: riskSeverityEnum("severity").notNull().default("low"),
    title: text("title").notNull(),
    description: text("description"),
    metadata: jsonb("metadata").$type<Record<string, unknown>>().default({}),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("risk_events_profile_id_idx").on(table.profileId),
    index("risk_events_withdrawal_id_idx").on(table.withdrawalRequestId),
    index("risk_events_type_idx").on(table.eventType),
  ],
);
