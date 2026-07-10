import {
  boolean,
  index,
  integer,
  pgEnum,
  pgTable,
  text,
  uuid,
} from "drizzle-orm/pg-core";
import { id, softDelete, timestamps } from "./common";
import { adminUsers } from "./users";

export const platformWalletStatusEnum = pgEnum("platform_wallet_status", [
  "active",
  "inactive",
  "archived",
]);

/**
 * Company-owned deposit wallets — configured by administrators, not tied to individual admins.
 */
export const platformWallets = pgTable(
  "platform_wallets",
  {
    id,
    assetSymbol: text("asset_symbol").notNull(),
    assetName: text("asset_name").notNull(),
    network: text("network").notNull(),
    walletAddress: text("wallet_address").notNull(),
    qrCodePath: text("qr_code_path"),
    instructions: text("instructions"),
    displayOrder: integer("display_order").notNull().default(0),
    isPrimary: boolean("is_primary").notNull().default(false),
    isActive: boolean("is_active").notNull().default(true),
    status: platformWalletStatusEnum("status").notNull().default("active"),
    autoDetectionEnabled: boolean("auto_detection_enabled").notNull().default(false),
    requiredConfirmations: integer("required_confirmations").notNull().default(0),
    icon: text("icon"),
    color: text("color"),
    createdByAdminId: uuid("created_by_admin_id").references(() => adminUsers.id),
    updatedByAdminId: uuid("updated_by_admin_id").references(() => adminUsers.id),
    ...timestamps,
    deletedAt: softDelete,
  },
  (table) => [
    index("platform_wallets_status_idx").on(table.status),
    index("platform_wallets_active_idx").on(table.isActive),
    index("platform_wallets_display_order_idx").on(table.displayOrder),
    index("platform_wallets_asset_network_idx").on(table.assetSymbol, table.network),
  ],
);
