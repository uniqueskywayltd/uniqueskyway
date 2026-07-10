import {
  index,
  integer,
  jsonb,
  numeric,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { id, timestamps } from "./common";
import { investmentPlans, investments } from "./investments";
import { paymentMethods, withdrawalMethods } from "./finance";
import { platformWallets } from "./platform-wallets";
import {
  depositStatusEnum,
  ledgerAccountTypeEnum,
  ledgerEntryTypeEnum,
  transactionDirectionEnum,
  withdrawalStatusEnum,
} from "./enums";
import { profiles } from "./users";

/**
 * Financial ledger accounts — one or more per user by type.
 * Balances are ALWAYS derived from ledger_entries, never stored ad-hoc.
 */
export const ledgerAccounts = pgTable(
  "ledger_accounts",
  {
    id,
    profileId: uuid("profile_id")
      .notNull()
      .references(() => profiles.id),
    accountType: ledgerAccountTypeEnum("account_type").notNull(),
    currency: text("currency").notNull().default("USD"),
    label: text("label"),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("ledger_accounts_profile_type_currency_idx").on(
      table.profileId,
      table.accountType,
      table.currency,
    ),
    index("ledger_accounts_profile_id_idx").on(table.profileId),
  ],
);

/**
 * Immutable ledger entries — append-only financial record.
 * Every deposit, withdrawal, ROI accrual, and referral creates entries here.
 */
export const ledgerEntries = pgTable(
  "ledger_entries",
  {
    id,
    accountId: uuid("account_id")
      .notNull()
      .references(() => ledgerAccounts.id),
    direction: transactionDirectionEnum("direction").notNull(),
    amount: numeric("amount", { precision: 18, scale: 2 }).notNull(),
    entryType: ledgerEntryTypeEnum("entry_type").notNull(),
    /** Idempotency key prevents duplicate entries from retries */
    idempotencyKey: text("idempotency_key").notNull().unique(),
    referenceType: text("reference_type"),
    referenceId: uuid("reference_id"),
    legacyTransactionId: integer("legacy_transaction_id"),
    description: text("description"),
    metadata: text("metadata"),
    createdByProfileId: uuid("created_by_profile_id"),
    createdByAdminId: uuid("created_by_admin_id"),
    ...timestamps,
  },
  (table) => [
    index("ledger_entries_account_id_idx").on(table.accountId),
    index("ledger_entries_entry_type_idx").on(table.entryType),
    index("ledger_entries_reference_idx").on(
      table.referenceType,
      table.referenceId,
    ),
    index("ledger_entries_legacy_tx_idx").on(table.legacyTransactionId),
    index("ledger_entries_created_at_idx").on(table.createdAt),
  ],
);

export const depositRequests = pgTable(
  "deposit_requests",
  {
    id,
    profileId: uuid("profile_id")
      .notNull()
      .references(() => profiles.id),
    planId: uuid("plan_id").references(() => investmentPlans.id),
    paymentMethodId: uuid("payment_method_id").references(() => paymentMethods.id),
    amount: numeric("amount", { precision: 18, scale: 2 }).notNull(),
    currency: text("currency").notNull().default("USD"),
    paymentMethod: text("payment_method").notNull(),
    externalTransactionRef: text("external_transaction_ref").notNull(),
    status: depositStatusEnum("status").notNull().default("draft"),
    proofStoragePath: text("proof_storage_path"),
    internalNotes: text("internal_notes"),
    infoRequestMessage: text("info_request_message"),
    idempotencyKey: text("idempotency_key").unique(),
    investmentId: uuid("investment_id").references(() => investments.id),
    legacyTransactionId: integer("legacy_transaction_id").unique(),
    reviewedByAdminId: uuid("reviewed_by_admin_id"),
    reviewedAt: timestamp("reviewed_at", { withTimezone: true, mode: "date" }),
    submittedAt: timestamp("submitted_at", { withTimezone: true, mode: "date" }),
    approvedAt: timestamp("approved_at", { withTimezone: true, mode: "date" }),
    rejectionReason: text("rejection_reason"),
    platformWalletId: uuid("platform_wallet_id").references(() => platformWallets.id, {
      onDelete: "set null",
    }),
    walletAddressSnapshot: text("wallet_address_snapshot"),
    assetSymbolSnapshot: text("asset_symbol_snapshot"),
    assetNameSnapshot: text("asset_name_snapshot"),
    networkSnapshot: text("network_snapshot"),
    qrCodePathSnapshot: text("qr_code_path_snapshot"),
    walletInstructionsSnapshot: text("wallet_instructions_snapshot"),
    ...timestamps,
  },
  (table) => [
    index("deposit_requests_profile_id_idx").on(table.profileId),
    index("deposit_requests_status_idx").on(table.status),
    index("deposit_requests_payment_method_id_idx").on(table.paymentMethodId),
    index("deposit_requests_investment_id_idx").on(table.investmentId),
    index("deposit_requests_platform_wallet_id_idx").on(table.platformWalletId),
  ],
);

export const withdrawalRequests = pgTable(
  "withdrawal_requests",
  {
    id,
    profileId: uuid("profile_id")
      .notNull()
      .references(() => profiles.id),
    withdrawalMethodId: uuid("withdrawal_method_id").references(
      () => withdrawalMethods.id,
    ),
    amount: numeric("amount", { precision: 18, scale: 2 }).notNull(),
    currency: text("currency").notNull().default("USD"),
    paymentMethod: text("payment_method").notNull(),
    walletAddress: text("wallet_address").notNull(),
    network: text("network").notNull(),
    destinationDetails: jsonb("destination_details")
      .$type<Record<string, unknown>>()
      .default({}),
    status: withdrawalStatusEnum("status").notNull().default("submitted"),
    idempotencyKey: text("idempotency_key").unique(),
    internalNotes: text("internal_notes"),
    infoRequestMessage: text("info_request_message"),
    payoutReference: text("payout_reference"),
    treasuryPayoutId: uuid("treasury_payout_id"),
    legacyTransactionId: integer("legacy_transaction_id").unique(),
    reviewedByAdminId: uuid("reviewed_by_admin_id"),
    reviewedAt: timestamp("reviewed_at", { withTimezone: true, mode: "date" }),
    submittedAt: timestamp("submitted_at", { withTimezone: true, mode: "date" }),
    approvedAt: timestamp("approved_at", { withTimezone: true, mode: "date" }),
    processingAt: timestamp("processing_at", { withTimezone: true, mode: "date" }),
    completedAt: timestamp("completed_at", { withTimezone: true, mode: "date" }),
    rejectionReason: text("rejection_reason"),
    ...timestamps,
  },
  (table) => [
    index("withdrawal_requests_profile_id_idx").on(table.profileId),
    index("withdrawal_requests_status_idx").on(table.status),
    index("withdrawal_requests_method_id_idx").on(table.withdrawalMethodId),
    index("withdrawal_requests_submitted_at_idx").on(table.submittedAt),
  ],
);
