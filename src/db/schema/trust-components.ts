import {
  boolean,
  index,
  integer,
  numeric,
  pgEnum,
  pgTable,
  text,
  timestamp,
} from "drizzle-orm/pg-core";
import { id, timestamps } from "./common";

export const activityFeedTypeEnum = pgEnum("activity_feed_type", [
  "registration",
  "deposit",
  "withdrawal",
  "investment",
  "referral",
  "roi_earned",
  "investment_matured",
  "announcement",
]);

export const activityFeed = pgTable(
  "activity_feed",
  {
    id,
    type: activityFeedTypeEnum("type").notNull(),
    title: text("title"),
    customerNameMasked: text("customer_name_masked"),
    city: text("city"),
    country: text("country"),
    amount: numeric("amount", { precision: 18, scale: 2 }),
    currency: text("currency").notNull().default("USD"),
    investmentPlan: text("investment_plan"),
    isSeed: boolean("is_seed").notNull().default(false),
    isVisible: boolean("is_visible").notNull().default(true),
    priority: integer("priority").notNull().default(0),
    startsAt: timestamp("starts_at", { withTimezone: true, mode: "date" }),
    expiresAt: timestamp("expires_at", { withTimezone: true, mode: "date" }),
    ...timestamps,
  },
  (table) => [
    index("activity_feed_type_idx").on(table.type),
    index("activity_feed_visible_idx").on(table.isVisible),
    index("activity_feed_seed_idx").on(table.isSeed),
    index("activity_feed_priority_idx").on(table.priority),
    index("activity_feed_created_at_idx").on(table.createdAt),
  ],
);
