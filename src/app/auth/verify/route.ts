import { NextResponse, type NextRequest } from "next/server";
import { AUTH_ROUTES, DASHBOARD_PREFIX } from "@/lib/auth/constants";
import { mapVerifyOtpType, type VerificationFlow } from "@/lib/auth/verification";
import { getCustomerProfile } from "@/lib/auth/session";
import { profileService } from "@/lib/services/profile.service";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const tokenHash = searchParams.get("token");
  const flow = (searchParams.get("type") ?? "signup") as VerificationFlow;

  if (!tokenHash) {
    return NextResponse.redirect(`${origin}${AUTH_ROUTES.register}?verify_error=invalid`);
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.verifyOtp({
    token_hash: tokenHash,
    type: mapVerifyOtpType(flow),
  });

  if (error) {
    return NextResponse.redirect(`${origin}${AUTH_ROUTES.register}?verify_error=expired`);
  }

  const { data } = await supabase.auth.getUser();
  if (data.user) {
    const profile = await getCustomerProfile(data.user.id);
    if (profile) {
      await profileService.markEmailVerified(profile.id);
    }
  }

  if (flow === "recovery") {
    return NextResponse.redirect(`${origin}${AUTH_ROUTES.resetPassword}`);
  }

  return NextResponse.redirect(`${origin}${DASHBOARD_PREFIX}?verified=1`);
}
