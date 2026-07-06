import { NextResponse } from "next/server";
import { paymentMethodService } from "@/lib/services/payment-method.service";

export async function GET() {
  const result = await paymentMethodService.listActive();
  if (!result.success) {
    const status = result.error.code === "INFRASTRUCTURE_NOT_CONFIGURED" ? 503 : 500;
    return NextResponse.json({ error: result.error.message, code: result.error.code }, { status });
  }
  return NextResponse.json({ items: result.data });
}
