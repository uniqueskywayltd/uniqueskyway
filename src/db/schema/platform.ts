import {
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { id, timestamps } from "./common";
import {
  auditActionEnum,
  notificationChannelEnum,
  notificationEventStatusEnum,
  notificationStatusEnum,
} from "./enums";
import { profiles, adminUsers } from "./users";

export const notifications = pgTable(
  "notifications",
  {
    id,
    profileId: uuid("profile_id").references(() => profiles.id),
    adminUserId: uuid("admin_user_id").references(() => adminUsers.id),
    channel: notificationChannelEnum("channel").notNull(),
    eventType: text("event_type").notNull(),
    title: text("title").notNull(),
    body: text("body").notNull(),
    payload: jsonb("payload"),
    status: notificationStatusEnum("status").notNull().default("pending"),
    readAt: timestamp("read_at", { withTimezone: true, mode: "date" }),
    archivedAt: timestamp("archived_at", { withTimezone: true, mode: "date" }),
    sentAt: timestamp("sent_at", { withTimezone: true, mode: "date" }),
    ...timestamps,
  },
  (table) => [
    index("notifications_profile_id_idx").on(table.profileId),
    index("notifications_status_idx").on(table.status),
    index("notifications_event_type_idx").on(table.eventType),
    index("notifications_created_at_idx").on(table.createdAt),
  ],
);

/**
 * Event queue for the notification framework.
 * Business logic emits events; the notification service processes them.
 */
export const notificationEvents = pgTable(
  "notification_events",
  {
    id,
    eventType: text("event_type").notNull(),
    payload: jsonb("payload").notNull(),
    status: notificationEventStatusEnum("status").notNull().default("pending"),
    processedAt: timestamp("processed_at", {
      withTimezone: true,
      mode: "date",
    }),
    errorMessage: text("error_message"),
    idempotencyKey: text("idempotency_key").notNull().unique(),
    ...timestamps,
  },
  (table) => [
    index("notification_events_status_idx").on(table.status),
    index("notification_events_event_type_idx").on(table.eventType),
    index("notification_events_created_at_idx").on(table.createdAt),
  ],
);

export const auditLogs = pgTable(
  "audit_logs",
  {
    id,
    action: auditActionEnum("action").notNull(),
    entityType: text("entity_type").notNull(),
    entityId: text("entity_id"),
    actorProfileId: uuid("actor_profile_id").references(() => profiles.id),
    actorAdminId: uuid("actor_admin_id").references(() => adminUsers.id),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    beforeState: jsonb("before_state"),
    afterState: jsonb("after_state"),
    metadata: jsonb("metadata"),
    ...timestamps,
  },
  (table) => [
    index("audit_logs_entity_idx").on(table.entityType, table.entityId),
    index("audit_logs_actor_profile_idx").on(table.actorProfileId),
    index("audit_logs_actor_admin_idx").on(table.actorAdminId),
    index("audit_logs_action_idx").on(table.action),
    index("audit_logs_created_at_idx").on(table.createdAt),
  ],
);

/**
 * Raw legacy transaction archive for migration parity verification.
 * Never used for live balance calculations after migration is validated.
 */
export const legacyTransactionsArchive = pgTable(
  "legacy_transactions_archive",
  {
    id,
    legacyTransactionId: integer("legacy_transaction_id").notNull().unique(),
    legacyUserId: text("legacy_user_id"),
    email: text("email"),
    plan: text("plan"),
    type: text("type"),
    method: text("method"),
    amount: text("amount"),
    externalRef: text("external_ref"),
    interest: text("interest"),
    address: text("address"),
    network: text("network"),
    confirm: integer("confirm"),
    complete: integer("complete"),
    legacyCreatedAt: text("legacy_created_at"),
    legacyUpdatedAt: text("legacy_updated_at"),
    rawPayload: jsonb("raw_payload").notNull(),
    ...timestamps,
  },
  (table) => [
    index("legacy_tx_archive_email_idx").on(table.email),
    index("legacy_tx_archive_type_idx").on(table.type),
    index("legacy_tx_archive_legacy_id_idx").on(table.legacyTransactionId),
  ],
);
