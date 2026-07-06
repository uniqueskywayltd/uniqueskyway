import { index, integer, numeric, pgTable, text, uuid } from "drizzle-orm/pg-core";
import { id, timestamps } from "./common";
import { depositRequests } from "./ledger";
import { investments } from "./investments";
import { profiles } from "./users";

export const referralRelationships = pgTable(
  "referral_relationships",
  {
    id,
    referrerProfileId: uuid("referrer_profile_id")
      .notNull()
      .references(() => profiles.id),
    referredProfileId: uuid("referred_profile_id")
      .notNull()
      .references(() => profiles.id)
      .unique(),
    referralCodeUsed: text("referral_code_used").notNull(),
    ...timestamps,
  },
  (table) => [
    index("referral_relationships_referrer_idx").on(table.referrerProfileId),
  ],
);

export const referralCommissions = pgTable(
  "referral_commissions",
  {
    id,
    referrerProfileId: uuid("referrer_profile_id")
      .notNull()
      .references(() => profiles.id),
    referredProfileId: uuid("referred_profile_id")
      .notNull()
      .references(() => profiles.id),
    depositRequestId: uuid("deposit_request_id").references(
      () => depositRequests.id,
    ),
    investmentId: uuid("investment_id").references(() => investments.id),
    commissionPercent: numeric("commission_percent", {
      precision: 8,
      scale: 4,
    }).notNull(),
    commissionAmount: numeric("commission_amount", {
      precision: 18,
      scale: 2,
    }).notNull(),
    legacyTransactionId: integer("legacy_transaction_id").unique(),
    idempotencyKey: text("idempotency_key").unique(),
    status: text("status").notNull().default("paid"),
    ...timestamps,
  },
  (table) => [
    index("referral_commissions_referrer_idx").on(table.referrerProfileId),
    index("referral_commissions_referred_idx").on(table.referredProfileId),
  ],
);
