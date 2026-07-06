import { type NextRequest } from "next/server";
import { jsonError, jsonSuccess, rateLimitedResponse } from "@/lib/api/auth-route";
import { resetPasswordSchema } from "@/lib/auth/validation";
import { authService } from "@/lib/services/auth.service";

export async function POST(request: NextRequest) {
  const limited = rateLimitedResponse(request, "auth", "reset-password");
  if (limited) return limited;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError("Invalid request body");
  }

  const parsed = resetPasswordSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError(parsed.error.issues[0]?.message ?? "Invalid input");
  }

  const result = await authService.resetPassword(parsed.data.password);
  if (!result.success) {
    return jsonError(result.error.message, 400);
  }

  return jsonSuccess({ redirectTo: "/login?reset=success" });
}
