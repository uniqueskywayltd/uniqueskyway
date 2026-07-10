import { NextResponse, type NextRequest } from "next/server";
import { getActorFromRequest } from "@/lib/api/auth-route";
import {
  IMPERSONATE_PROFILE_COOKIE,
  IMPERSONATE_RETURN_COOKIE,
  STAFF_SESSION_COOKIE,
  buildImpersonationCookieOptions,
} from "@/lib/auth/impersonation";
import { clearLastActiveCookie } from "@/lib/auth/inactivity";
import { getAdminProfile, getSessionUser } from "@/lib/auth/session";
import { auditService } from "@/lib/services/audit.service";
import { authService } from "@/lib/services/auth.service";

async function logoutAndRedirect(request: NextRequest) {
  const user = await getSessionUser();
  const actor = getActorFromRequest(request);

  if (user) {
    const admin = await getAdminProfile(user.authUserId);
    if (admin) {
      await auditService.log({
        action: "logout",
        entityType: "admin_user",
        entityId: admin.id,
        actor: { adminUserId: admin.id, ...actor },
        metadata: {
          reason: request.nextUrl.searchParams.get("reason") ?? undefined,
        },
      });
    }
  }

  await authService.logout(actor);

  const response = NextResponse.redirect(new URL("/hard/auth/login", request.url), 303);
  const cleared = buildImpersonationCookieOptions(0);
  response.cookies.set(STAFF_SESSION_COOKIE, "", cleared);
  response.cookies.set(IMPERSONATE_PROFILE_COOKIE, "", cleared);
  response.cookies.set(IMPERSONATE_RETURN_COOKIE, "", cleared);
  clearLastActiveCookie(response);
  return response;
}

export async function GET(request: NextRequest) {
  return logoutAndRedirect(request);
}

export async function POST(request: NextRequest) {
  return logoutAndRedirect(request);
}
