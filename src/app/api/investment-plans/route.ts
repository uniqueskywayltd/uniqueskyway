import { NextResponse } from "next/server";
import { investmentPlanService } from "@/lib/services/investment-plan.service";

export async function GET() {
  const result = await investmentPlanService.listActive();
  if (!result.success) {
    const status = result.error.code === "INFRASTRUCTURE_NOT_CONFIGURED" ? 503 : 500;
    return NextResponse.json({ error: result.error.message, code: result.error.code }, { status });
  }
  return NextResponse.json({ items: result.data });
}
