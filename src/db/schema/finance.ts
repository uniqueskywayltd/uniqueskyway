import {
  boolean,
  index,
  integer,
  jsonb,
  numeric,
  pgEnum,
  pgTable,
  text,
} from "drizzle-orm/pg-core";
import { id, timestamps } from "./common";

export const paymentMethodTypeEnum = pgEnum("payment_method_type", [
  "cryptocurrency",
  "bank_transfer",
  "manual",
  "gateway",
]);

export const paymentMethods = pgTable(
  "payment_methods",
  {
    id,
    slug: text("slug").notNull().unique(),
    name: text("name").notNull(),
    methodType: paymentMethodTypeEnum("method_type").notNull(),
    description: text("description"),
    instructions: text("instructions"),
    requiresProof: boolean("requires_proof").notNull().default(true),
    minAmount: numeric("min_amount", { precision: 18, scale: 2 }),
    maxAmount: numeric("max_amount", { precision: 18, scale: 2 }),
    config: jsonb("config").$type<Record<string, unknown>>().default({}),
    isActive: boolean("is_active").notNull().default(true),
    sortOrder: integer("sort_order").notNull().default(0),
    ...timestamps,
  },
  (table) => [
    index("payment_methods_active_idx").on(table.isActive),
    index("payment_methods_slug_idx").on(table.slug),
  ],
);

export const withdrawalMethods = pgTable(
  "withdrawal_methods",
  {
    id,
    slug: text("slug").notNull().unique(),
    name: text("name").notNull(),
    methodType: paymentMethodTypeEnum("method_type").notNull(),
    description: text("description"),
    instructions: text("instructions"),
    requiresDestination: boolean("requires_destination").notNull().default(true),
    minAmount: numeric("min_amount", { precision: 18, scale: 2 }),
    maxAmount: numeric("max_amount", { precision: 18, scale: 2 }),
    config: jsonb("config").$type<Record<string, unknown>>().default({}),
    isActive: boolean("is_active").notNull().default(true),
    sortOrder: integer("sort_order").notNull().default(0),
    ...timestamps,
  },
  (table) => [
    index("withdrawal_methods_active_idx").on(table.isActive),
    index("withdrawal_methods_slug_idx").on(table.slug),
  ],
);
