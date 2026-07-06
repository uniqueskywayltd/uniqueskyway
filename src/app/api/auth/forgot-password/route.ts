import { type NextRequest } from "next/server";
import {
  getActorFromRequest,
  jsonError,
  jsonSuccess,
  rateLimitedResponse,
} from "@/lib/api/auth-route";
import { forgotPasswordSchema } from "@/lib/auth/validation";
import { authService } from "@/lib/services/auth.service";

export async function POST(request: NextRequest) {
  const limited = rateLimitedResponse(request, "auth", "forgot-password");
  if (limited) return limited;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError("Invalid request body");
  }

  const parsed = forgotPasswordSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError(parsed.error.issues[0]?.message ?? "Invalid input");
  }

  await authService.forgotPassword(parsed.data.email, getActorFromRequest(request));
  return jsonSuccess({ sent: true });
}
