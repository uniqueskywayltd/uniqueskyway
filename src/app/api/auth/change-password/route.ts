import { type NextRequest } from "next/server";
import {
  getActorFromRequest,
  jsonError,
  jsonSuccess,
  rateLimitedResponse,
} from "@/lib/api/auth-route";
import { changePasswordSchema } from "@/lib/auth/validation";
import { authService } from "@/lib/services/auth.service";
import { getSessionUser } from "@/lib/auth/session";

export async function POST(request: NextRequest) {
  const limited = rateLimitedResponse(request, "auth", "change-password");
  if (limited) return limited;

  const user = await getSessionUser();
  if (!user) return jsonError("Not authenticated", 401);

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError("Invalid request body");
  }

  const parsed = changePasswordSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError(parsed.error.issues[0]?.message ?? "Invalid input");
  }

  const result = await authService.changePassword(
    parsed.data.currentPassword,
    parsed.data.password,
    getActorFromRequest(request),
  );

  if (!result.success) {
    return jsonError(result.error.message, 400);
  }

  return jsonSuccess({ success: true });
}
