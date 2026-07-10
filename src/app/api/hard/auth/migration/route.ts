import { NextResponse, type NextRequest } from "next/server";
import { requireSuperAdmin } from "@/lib/auth/api-guard";
import { DEFAULT_LEGACY_SQL_PATH } from "@/lib/migration/constants";
import { migrationOrchestratorService } from "@/lib/services/migration/migration-orchestrator.service";

export const maxDuration = 300;

export async function GET() {
  const auth = await requireSuperAdmin();
  if (!auth.ok) return auth.response;

  const [runsResult, previewResult] = await Promise.all([
    migrationOrchestratorService.listRuns(),
    Promise.resolve(migrationOrchestratorService.getSourcePreview()),
  ]);

  if (!runsResult.success) {
    return NextResponse.json({ error: runsResult.error.message }, { status: 500 });
  }

  return NextResponse.json({
    items: runsResult.data,
    source: previewResult.success ? previewResult.data : null,
    sourceError: previewResult.success ? null : previewResult.error.message,
  });
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
    mode?: "start" | "all";
  } = {};

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const options = {
    dryRun: body.dryRun ?? true,
    sourcePath: body.sourcePath ?? DEFAULT_LEGACY_SQL_PATH,
    label: body.label,
    adminId: auth.ctx.adminId,
    skipImages: body.skipImages ?? true,
    phases: body.phases as never,
  };

  if (body.mode === "start") {
    const createResult = await migrationOrchestratorService.createRun(options);
    if (!createResult.success) {
      return NextResponse.json({ error: createResult.error.message }, { status: 500 });
    }
    return NextResponse.json({
      runId: createResult.data.runId,
      runKey: createResult.data.runKey,
      mode: "start",
    });
  }

  const result = await migrationOrchestratorService.runAll(options);

  if (!result.success) {
    const details = result.error.details;
    const message =
      details instanceof Error
        ? details.message
        : typeof details === "object" && details !== null && "message" in details
          ? String((details as { message: unknown }).message)
          : result.error.message;

    return NextResponse.json(
      { error: result.error.message, details: message },
      { status: 500 },
    );
  }

  return NextResponse.json(result.data);
}
