import { index, pgTable, primaryKey, text, uuid } from "drizzle-orm/pg-core";
import { id, timestamps } from "./common";
import { adminRoleEnum, permissionCategoryEnum } from "./enums";

/**
 * Granular permissions for RBAC.
 * Mapped to admin roles via role_permissions.
 */
export const permissions = pgTable(
  "permissions",
  {
    id,
    slug: text("slug").notNull().unique(),
    name: text("name").notNull(),
    description: text("description"),
    category: permissionCategoryEnum("category").notNull(),
    ...timestamps,
  },
  (table) => [
    index("permissions_slug_idx").on(table.slug),
    index("permissions_category_idx").on(table.category),
  ],
);

/**
 * Maps admin roles to permissions.
 * Super Admin receives all permissions via seed + application logic.
 */
export const rolePermissions = pgTable(
  "role_permissions",
  {
    role: adminRoleEnum("role").notNull(),
    permissionId: uuid("permission_id")
      .notNull()
      .references(() => permissions.id, { onDelete: "cascade" }),
    ...timestamps,
  },
  (table) => [
    primaryKey({ columns: [table.role, table.permissionId] }),
    index("role_permissions_role_idx").on(table.role),
  ],
);
