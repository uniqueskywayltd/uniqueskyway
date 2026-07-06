import { type NextRequest } from "next/server";
import {
  getActorFromRequest,
  jsonError,
  jsonSuccess,
  rateLimitedResponse,
} from "@/lib/api/auth-route";
import { loginSchema } from "@/lib/auth/validation";
import { authService } from "@/lib/services/auth.service";
import { isDatabaseConfigured, isSupabaseConfigured } from "@/lib/env";

export async function POST(request: NextRequest) {
  const limited = rateLimitedResponse(request, "auth", "login");
  if (limited) return limited;

  if (!isSupabaseConfigured() || !isDatabaseConfigured()) {
    return jsonError("Service temporarily unavailable", 503);
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

  const result = await authService.login(parsed.data, getActorFromRequest(request));

  if (!result.success) {
    const status = result.error.code === "ACCOUNT_LOCKED" ? 429 : 401;
    return jsonError(result.error.message, status);
  }

  return jsonSuccess({ redirectTo: result.data.redirectTo });
}
