import { NextResponse } from "next/server";
import { requireCustomer } from "@/lib/auth/api-guard";
import { portfolioService } from "@/lib/services/portfolio.service";

export async function GET() {
  const auth = await requireCustomer();
  if (!auth.ok) return auth.response;

  const result = await portfolioService.getPortfolioData(auth.ctx.profile.id);

  if (!result.success) {
    const status = result.error.code === "INFRASTRUCTURE_NOT_CONFIGURED" ? 503 : 500;
    return NextResponse.json({ error: result.error.message, code: result.error.code }, { status });
  }

  return NextResponse.json(result.data);
}
