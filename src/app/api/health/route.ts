import { NextResponse } from "next/server";
import { getDiagnosticsReport } from "@/lib/monitoring/diagnostics.service";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  const report = await getDiagnosticsReport();

  const httpStatus =
    report.status === "down" ? 503 : report.status === "degraded" ? 200 : 200;

  return NextResponse.json(report, {
    status: httpStatus,
    headers: {
      "Cache-Control": "no-store, max-age=0",
    },
  });
}
