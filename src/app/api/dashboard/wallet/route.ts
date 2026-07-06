import { NextResponse, type NextRequest } from "next/server";
import { requireCustomer } from "@/lib/auth/api-guard";
import { walletService } from "@/lib/services/wallet.service";
import type { LedgerEntryType } from "@/types/domain";

export async function GET(request: NextRequest) {
  const auth = await requireCustomer();
  if (!auth.ok) return auth.response;

  const { searchParams } = new URL(request.url);
  const mode = searchParams.get("mode");

  if (mode === "history") {
    const result = await walletService.getLedgerHistory(auth.ctx.profile.id, {
      page: Number(searchParams.get("page") ?? 1),
      pageSize: Number(searchParams.get("pageSize") ?? 20),
      entryType: (searchParams.get("entryType") as LedgerEntryType) || undefined,
      direction: (searchParams.get("direction") as "credit" | "debit") || undefined,
      search: searchParams.get("search") || undefined,
      from: searchParams.get("from") ? new Date(searchParams.get("from")!) : undefined,
      to: searchParams.get("to") ? new Date(searchParams.get("to")!) : undefined,
    });

    if (!result.success) {
      return NextResponse.json({ error: result.error.message }, { status: 500 });
    }
    return NextResponse.json(result.data);
  }

  const result = await walletService.getWalletSummary(auth.ctx.profile.id);
  if (!result.success) {
    return NextResponse.json({ error: result.error.message }, { status: 500 });
  }

  return NextResponse.json(result.data);
}
