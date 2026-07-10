import { type NextRequest } from "next/server";
import {
  jsonError,
  jsonSuccess,
  rateLimitedResponse,
} from "@/lib/api/auth-route";
import { AUTH_ROUTES } from "@/lib/auth/constants";
import { mapVerifyOtpType, type VerificationFlow } from "@/lib/auth/verification";
import { normalizeEmail } from "@/lib/auth/validation";
import { getCustomerProfile } from "@/lib/auth/session";
import { profileService } from "@/lib/services/profile.service";
import { createRouteHandlerSupabase } from "@/lib/supabase/route-handler";
import { z } from "zod";

const schema = z.object({
  email: z.string().email(),
  otp: z.string().min(4).max(12),
  type: z.enum(["signup", "verify", "recovery"]).optional(),
});

export async function POST(request: NextRequest) {
  const limited = rateLimitedResponse(request, "auth", "verify-otp");
  if (limited) return limited;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError("Invalid request body");
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return jsonError("Enter the verification code from your email");
  }

  const email = normalizeEmail(parsed.data.email);
  const flow = (parsed.data.type ?? "signup") as VerificationFlow;
  const { supabase, withAuthCookies } = createRouteHandlerSupabase(request);

  const { error } = await supabase.auth.verifyOtp({
    email,
    token: parsed.data.otp.trim(),
    type: mapVerifyOtpType(flow),
  });

  if (error) {
    return jsonError("Invalid or expired verification code. Request a new email and try again.");
  }

  const { data } = await supabase.auth.getUser();
  if (data.user) {
    const profile = await getCustomerProfile(data.user.id);
    if (profile) {
      await profileService.markEmailVerified(profile.id);
    }
  }

  if (flow === "recovery") {
    return withAuthCookies(jsonSuccess({ redirectTo: AUTH_ROUTES.resetPassword }));
  }

  return withAuthCookies(jsonSuccess({ redirectTo: "/dashboard", verified: true }));
}
