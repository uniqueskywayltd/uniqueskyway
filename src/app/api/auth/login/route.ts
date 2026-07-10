import { type NextRequest } from "next/server";
import {
  getActorFromRequest,
  jsonError,
  jsonSuccess,
  rateLimitedResponse,
} from "@/lib/api/auth-route";
import { loginSchema } from "@/lib/auth/validation";
import { STAFF_SESSION_COOKIE, buildImpersonationCookieOptions } from "@/lib/auth/impersonation";
import { authService } from "@/lib/services/auth.service";
import { isDatabaseConfigured, isStorageConfigured, isSupabaseConfigured } from "@/lib/env";
import { createRouteHandlerSupabase } from "@/lib/supabase/route-handler";

export async function POST(request: NextRequest) {
  const limited = rateLimitedResponse(request, "auth", "login");
  if (limited) return limited;

  if (!isSupabaseConfigured() || !isDatabaseConfigured()) {
    return jsonError(
      "Sign-in is unavailable right now. Our team has been notified — please try again shortly.",
      503,
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError("Invalid request body");
  }

  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError(parsed.error.issues[0]?.message ?? "Invalid input");
  }

  const { supabase, withAuthCookies } = createRouteHandlerSupabase(request);
  const result = await authService.login(parsed.data, getActorFromRequest(request), supabase);

  if (!result.success) {
    const status = result.error.code === "ACCOUNT_LOCKED" ? 429 : 401;
    return jsonError(result.error.message, status);
  }

  const response = withAuthCookies(jsonSuccess({ redirectTo: result.data.redirectTo }));
  if (result.data.isStaffLogin) {
    response.cookies.set(
      STAFF_SESSION_COOKIE,
      "1",
      buildImpersonationCookieOptions(60 * 60 * 24 * 7),
    );
  }
  return response;
}
