import { type NextRequest } from "next/server";
import {
  getActorFromRequest,
  jsonError,
  jsonSuccess,
  rateLimitedResponse,
} from "@/lib/api/auth-route";
import { GENERIC_AUTH_ERROR } from "@/lib/auth/constants";
import { loginSchema } from "@/lib/auth/validation";
import { getAdminProfile } from "@/lib/auth/session";
import { STAFF_SESSION_COOKIE, buildImpersonationCookieOptions } from "@/lib/auth/impersonation";
import { auditService } from "@/lib/services/audit.service";
import { authLockoutService } from "@/lib/services/auth-lockout.service";
import { sessionService } from "@/lib/services/session.service";
import { createRouteHandlerSupabase } from "@/lib/supabase/route-handler";
import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { adminUsers } from "@/db/schema";

export async function POST(request: NextRequest) {
  const limited = rateLimitedResponse(request, "auth", "admin-login");
  if (limited) return limited;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError("Invalid request");
  }

  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError(GENERIC_AUTH_ERROR, 401);
  }

  const actor = getActorFromRequest(request);
  const email = parsed.data.email.trim().toLowerCase();

  const lockout = await authLockoutService.getStatus(email);
  if (lockout.locked) {
    return jsonError(GENERIC_AUTH_ERROR, 429);
  }

  const { supabase, withAuthCookies } = createRouteHandlerSupabase(request);
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password: parsed.data.password,
  });

  if (error || !data.user) {
    await authLockoutService.recordFailure(email);
    await sessionService.recordLogin({ success: false, failureReason: "admin_invalid", actor });
    return jsonError(GENERIC_AUTH_ERROR, 401);
  }

  const admin = await getAdminProfile(data.user.id);
  if (!admin) {
    await supabase.auth.signOut();
    return jsonError(GENERIC_AUTH_ERROR, 401);
  }

  await authLockoutService.clear(email);

  const db = getDb();
  await db
    .update(adminUsers)
    .set({ lastLoginAt: new Date() })
    .where(eq(adminUsers.id, admin.id));

  await sessionService.recordLogin({
    adminUserId: admin.id,
    success: true,
    actor: { ...actor, adminUserId: admin.id },
  });

  await sessionService.upsertSession({
    adminUserId: admin.id,
    authSessionId: data.session?.access_token?.slice(0, 32),
    actor: { ...actor, adminUserId: admin.id },
  });

  await auditService.log({
    action: "login",
    entityType: "admin_user",
    entityId: admin.id,
    actor: { adminUserId: admin.id, ...actor },
  });

  const response = withAuthCookies(jsonSuccess({ redirectTo: "/hard/auth" }));
  response.cookies.set(STAFF_SESSION_COOKIE, "1", buildImpersonationCookieOptions(60 * 60 * 24 * 7));
  return response;
}
