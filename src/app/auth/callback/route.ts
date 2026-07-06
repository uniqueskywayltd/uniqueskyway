import { NextResponse, type NextRequest } from "next/server";
import { AUTH_ROUTES, DASHBOARD_PREFIX } from "@/lib/auth/constants";
import { getCustomerProfile } from "@/lib/auth/session";
import { profileService } from "@/lib/services/profile.service";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const type = searchParams.get("type");

  if (!code) {
    return NextResponse.redirect(`${origin}${AUTH_ROUTES.login}`);
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return NextResponse.redirect(`${origin}${AUTH_ROUTES.verifyEmail}?error=expired`);
  }

  const { data } = await supabase.auth.getUser();
  if (data.user) {
    const profile = await getCustomerProfile(data.user.id);
    if (profile && (data.user.email_confirmed_at || type === "verify")) {
      await profileService.markEmailVerified(profile.id);
    }
  }

  if (type === "signup" || type === "verify") {
    return NextResponse.redirect(`${origin}${AUTH_ROUTES.verifyEmail}?verified=1`);
  }

  if (type === "recovery") {
    return NextResponse.redirect(`${origin}${AUTH_ROUTES.resetPassword}`);
  }

  return NextResponse.redirect(`${origin}${DASHBOARD_PREFIX}`);
}
