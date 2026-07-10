import { NextResponse, type NextRequest } from "next/server";
import { requireSuperAdmin } from "@/lib/auth/api-guard";
import type { MigrationPhase } from "@/lib/migration/types";
import { migrationOrchestratorService } from "@/lib/services/migration/migration-orchestrator.service";

export const maxDuration = 300;

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: RouteParams) {
  const auth = await requireSuperAdmin();
  if (!auth.ok) return auth.response;

  const { id } = await params;
  const [run, reports, exceptions] = await Promise.all([
    migrationOrchestratorService.getRun(id),
    migrationOrchestratorService.getReports(id),
    migrationOrchestratorService.getBalanceExceptions(id),
  ]);

  if (!run.success) {
    return NextResponse.json({ error: run.error.message }, { status: 404 });
  }

  return NextResponse.json({
    run: run.data,
    reports: reports.success ? reports.data : [],
    balanceExceptions: exceptions.success ? exceptions.data : [],
  });
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  const auth = await requireSuperAdmin();
  if (!auth.ok) return auth.response;

  const { id } = await params;
  let body: { action?: string; phase?: MigrationPhase; skipImages?: boolean } = {};

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  if (body.action === "rollback") {
    const result = await migrationOrchestratorService.rollback(id);
    if (!result.success) {
      return NextResponse.json({ error: result.error.message }, { status: 500 });
    }
    return NextResponse.json(result.data);
  }

  if (body.action === "advance") {
    const result = await migrationOrchestratorService.advanceRun(id, {
      skipImages: body.skipImages ?? true,
    });
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

  if (body.phase) {
    const result = await migrationOrchestratorService.runPhase(id, body.phase);
    if (!result.success) {
      return NextResponse.json({ error: result.error.message }, { status: 500 });
    }
    return NextResponse.json(result.data);
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
