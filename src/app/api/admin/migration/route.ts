import { NextResponse, type NextRequest } from "next/server";
import { requireSuperAdmin } from "@/lib/auth/api-guard";
import { DEFAULT_LEGACY_SQL_PATH } from "@/lib/migration/constants";
import { migrationOrchestratorService } from "@/lib/services/migration/migration-orchestrator.service";

export async function GET() {
  const auth = await requireSuperAdmin();
  if (!auth.ok) return auth.response;

  const result = await migrationOrchestratorService.listRuns();
  if (!result.success) {
    return NextResponse.json({ error: result.error.message }, { status: 500 });
  }

  return NextResponse.json({ items: result.data });
}

export async function POST(request: NextRequest) {
  const auth = await requireSuperAdmin();
  if (!auth.ok) return auth.response;

  let body: {
    dryRun?: boolean;
    sourcePath?: string;
    label?: string;
    phases?: string[];
    skipImages?: boolean;
  } = {};

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const result = await migrationOrchestratorService.runAll({
    dryRun: body.dryRun ?? true,
    sourcePath: body.sourcePath ?? DEFAULT_LEGACY_SQL_PATH,
    label: body.label,
    adminId: auth.ctx.adminId,
    skipImages: body.skipImages,
    phases: body.phases as never,
  });

  if (!result.success) {
    return NextResponse.json(
      { error: result.error.message, details: result.error.details },
      { status: 500 },
    );
  }

  return NextResponse.json(result.data);
}
