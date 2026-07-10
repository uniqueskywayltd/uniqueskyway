import { NextResponse } from "next/server";
import { requireCustomer } from "@/lib/auth/api-guard";
import { platformWalletService } from "@/lib/services/platform-wallet.service";

export async function GET() {
  const auth = await requireCustomer();
  if (!auth.ok) return auth.response;

  const result = await platformWalletService.listActiveForCustomers();
  if (!result.success) {
    const code = result.error.code === "INFRASTRUCTURE_NOT_CONFIGURED" ? 503 : 500;
    return NextResponse.json({ error: result.error.message, code: result.error.code }, { status: code });
  }

  return NextResponse.json(result.data);
}
