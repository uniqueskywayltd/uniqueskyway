import { type NextRequest } from "next/server";
import { jsonError, jsonSuccess, rateLimitedResponse } from "@/lib/api/auth-route";
import { z } from "zod";
import { authService } from "@/lib/services/auth.service";

const schema = z.object({
  email: z.string().email(),
});

export async function POST(request: NextRequest) {
  const limited = rateLimitedResponse(request, "auth", "resend-verification");
  if (limited) return limited;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError("Invalid request body");
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return jsonError("Invalid email address");
  }

  await authService.resendVerification(parsed.data.email);

  return jsonSuccess({ sent: true });
}
