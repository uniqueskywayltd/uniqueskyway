import { NextResponse } from "next/server";
import { marketDataService } from "@/lib/services/market-data.service";

export async function GET() {
  const result = await marketDataService.getTicker();
  if (!result.success) {
    return NextResponse.json({ error: result.error.message }, { status: 503 });
  }
  return NextResponse.json(result.data, {
    headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120" },
  });
}
