import { NextResponse } from "next/server";
import { getDiagnosticsReport } from "@/lib/monitoring/diagnostics.service";

export async function GET() {
  const report = await getDiagnosticsReport();

  return NextResponse.json({
    ...report,
    environment: {
      ready: report.integrations.ready,
      missing: report.integrations.missing,
      warnings: report.integrations.warnings,
      pendingFeatures: report.integrations.pendingFeatures,
    },
    infrastructure: {
      featureFlags: report.integrations.database,
      systemSettings: report.integrations.database,
      rbac: report.integrations.database,
      ledger: report.integrations.database,
      auditLogging: report.integrations.database,
      notifications: report.integrations.database,
    },
  });
}
