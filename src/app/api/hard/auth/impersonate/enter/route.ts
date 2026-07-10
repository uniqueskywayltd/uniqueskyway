import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { getActorFromRequest } from "@/lib/api/auth-route";
import { getAdminProfile, getCustomerProfileById } from "@/lib/auth/session";
import { applyImpersonationSession } from "@/lib/auth/impersonation";
import { PERMISSIONS } from "@/lib/permissions/constants";
import { auditService } from "@/lib/services/audit.service";
import { permissionService } from "@/lib/services/permissions.service";
import { createRouteHandlerSupabase } from "@/lib/supabase/route-handler";

const profileIdSchema = z.string().uuid();

/**
 * Legacy/direct API entry — sets impersonation cookies on redirect.
 * Prefer /hard/auth/impersonate/[profileId] for browser navigation.
 */
export async function GET(request: NextRequest) {
  const profileId = request.nextUrl.searchParams.get("profileId");
  const parsed = profileIdSchema.safeParse(profileId);
  const fallbackPath = parsed.success
    ? `/hard/auth/impersonate/${parsed.data}`
    : "/hard/auth/customers";

  const { supabase } = createRouteHandlerSupabase(request);
  const { data, error } = await supabase.auth.getUser();
  const authUser = data.user;

  if (error || !authUser?.email) {
    const loginUrl = new URL("/hard/auth/login", request.url);
    loginUrl.searchParams.set("next", fallbackPath);
    return NextResponse.redirect(loginUrl);
  }

  const perm = await permissionService.requirePermission(authUser.id, PERMISSIONS.USERS_READ);
  if (!perm.success) {
    return NextResponse.redirect(new URL("/hard/auth/login", request.url));
  }

  const admin = await getAdminProfile(authUser.id);
  if (!admin) {
    return NextResponse.redirect(new URL("/hard/auth/login", request.url));
  }

  if (!parsed.success) {
    return NextResponse.redirect(new URL("/hard/auth/customers", request.url));
  }

  const profile = await getCustomerProfileById(parsed.data);
  if (!profile) {
    return NextResponse.redirect(new URL("/hard/auth/customers", request.url));
  }

  const actor = getActorFromRequest(request);
  try {
    await auditService.log({
      action: "update",
      entityType: "profile",
      entityId: profile.id,
      actor: { adminUserId: admin.id, ...actor },
      metadata: { impersonate: "start", customerEmail: profile.email },
    });
  } catch {
    // Audit failure must not block impersonation.
  }

  const returnPath = `/hard/auth/customers/${profile.id}`;
  const response = NextResponse.redirect(new URL("/dashboard", request.url));
  return applyImpersonationSession(response, profile.id, returnPath);
}
