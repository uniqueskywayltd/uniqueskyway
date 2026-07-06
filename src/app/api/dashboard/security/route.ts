import { NextResponse } from "next/server";
import { requireCustomer } from "@/lib/auth/api-guard";
import { securityService } from "@/lib/services/security.service";

export async function GET() {
  const auth = await requireCustomer();
  if (!auth.ok) return auth.response;

  const [history, sessions] = await Promise.all([
    securityService.getLoginHistory(auth.ctx.profile.id),
    securityService.getSessions(auth.ctx.profile.id),
  ]);

  return NextResponse.json({
    loginHistory: history.success ? history.data : [],
    sessions: sessions ?? [],
  });
}
