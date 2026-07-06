import { NextResponse } from "next/server";
import { withdrawalMethodService } from "@/lib/services/withdrawal-method.service";

export async function GET() {
  const result = await withdrawalMethodService.listActive();

  if (!result.success) {
    const status = result.error.code === "INFRASTRUCTURE_NOT_CONFIGURED" ? 503 : 500;
    return NextResponse.json({ error: result.error.message }, { status });
  }

  return NextResponse.json(result.data);
}
