import { and, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { adminUsers, permissions, rolePermissions } from "@/db/schema";
import {
  DEFAULT_ROLE_PERMISSIONS,
  type Permission,
} from "@/lib/permissions/constants";
import type { AdminRole } from "@/types/domain";
import { fail, ok } from "./base";
import type { ServiceResult } from "./types";

/**
 * RBAC permission service.
 */
export class PermissionService {
  async getAdminRole(authUserId: string): Promise<AdminRole | null> {
    try {
      const db = getDb();
      const [admin] = await db
        .select({ role: adminUsers.role, isActive: adminUsers.isActive })
        .from(adminUsers)
        .where(eq(adminUsers.authUserId, authUserId))
        .limit(1);

      if (!admin?.isActive) return null;
      return admin.role;
    } catch {
      return null;
    }
  }

  async hasPermission(
    role: AdminRole,
    permissionSlug: Permission,
  ): Promise<boolean> {
    if (role === "super_admin") return true;

    try {
      const db = getDb();
      const [match] = await db
        .select({ slug: permissions.slug })
        .from(rolePermissions)
        .innerJoin(permissions, eq(rolePermissions.permissionId, permissions.id))
        .where(
          and(
            eq(rolePermissions.role, role),
            eq(permissions.slug, permissionSlug),
          ),
        )
        .limit(1);

      return Boolean(match);
    } catch {
      return DEFAULT_ROLE_PERMISSIONS[role]?.includes(permissionSlug) ?? false;
    }
  }

  async requirePermission(
    authUserId: string,
    permissionSlug: Permission,
  ): Promise<ServiceResult<AdminRole>> {
    const role = await this.getAdminRole(authUserId);
    if (!role) {
      return fail("UNAUTHORIZED", "Admin access required");
    }

    const allowed = await this.hasPermission(role, permissionSlug);
    if (!allowed) {
      return fail("FORBIDDEN", `Permission '${permissionSlug}' required`);
    }

    return ok(role);
  }
}

export const permissionService = new PermissionService();
