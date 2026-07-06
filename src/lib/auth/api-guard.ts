import { NextResponse } from "next/server";
import { getAdminProfile, getCustomerProfile, getSessionUser } from "@/lib/auth/session";
import type { CustomerProfile } from "@/lib/auth/session";
import { PERMISSIONS, type Permission } from "@/lib/permissions/constants";
import { permissionService } from "@/lib/services/permissions.service";

export type AuthenticatedContext = {
  authUserId: string;
  email: string;
  profile: CustomerProfile;
};

export async function requireCustomer(): Promise<
  { ok: true; ctx: AuthenticatedContext } | { ok: false; response: NextResponse }
> {
  const user = await getSessionUser();
  if (!user) {
    return { ok: false, response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }

  const profile = await getCustomerProfile(user.authUserId);
  if (!profile) {
    return { ok: false, response: NextResponse.json({ error: "Profile not found" }, { status: 404 }) };
  }

  if (!profile.emailVerified && !user.emailVerified) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Email verification required" }, { status: 403 }),
    };
  }

  if (profile.status === "suspended") {
    return { ok: false, response: NextResponse.json({ error: "Account suspended" }, { status: 403 }) };
  }

  return {
    ok: true,
    ctx: { authUserId: user.authUserId, email: user.email, profile },
  };
}

export type AdminContext = {
  authUserId: string;
  email: string;
  adminId: string;
  role: string;
};

export async function requireAdmin(
  permission: Permission,
): Promise<{ ok: true; ctx: AdminContext } | { ok: false; response: NextResponse }> {
  const user = await getSessionUser();
  if (!user) {
    return { ok: false, response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }

  const perm = await permissionService.requirePermission(user.authUserId, permission);
  if (!perm.success) {
    const status = perm.error.code === "FORBIDDEN" ? 403 : 401;
    return { ok: false, response: NextResponse.json({ error: perm.error.message }, { status }) };
  }

  const admin = await getAdminProfile(user.authUserId);
  if (!admin) {
    return { ok: false, response: NextResponse.json({ error: "Admin not found" }, { status: 404 }) };
  }

  return {
    ok: true,
    ctx: {
      authUserId: user.authUserId,
      email: user.email,
      adminId: admin.id,
      role: admin.role,
    },
  };
}

export async function requireSuperAdmin(): Promise<
  { ok: true; ctx: AdminContext } | { ok: false; response: NextResponse }
> {
  const auth = await requireAdmin(PERMISSIONS.MIGRATION_RUN);
  if (!auth.ok) return auth;

  if (auth.ctx.role !== "super_admin") {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "Super Admin access required" },
        { status: 403 },
      ),
    };
  }

  return auth;
}
