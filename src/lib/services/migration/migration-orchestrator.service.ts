import { randomBytes } from "node:crypto";
import { readFileSync } from "node:fs";
import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import {
  migrationBalanceExceptions,
  migrationCheckpoints,
  migrationReports,
  migrationRuns,
} from "@/db/schema";
import { DEFAULT_LEGACY_SQL_PATH } from "@/lib/migration/constants";
import { extractLegacyData } from "@/lib/migration/legacy-sql-parser";
import { transformLegacyExtract } from "@/lib/migration/transform-legacy";
import { validateMigration } from "@/lib/migration/validate-legacy";
import type {
  LegacyExtract,
  MigrationPhase,
  MigrationRunOptions,
  MigrationRunStats,
  MigrationTransformResult,
  MigrationValidationIssue,
} from "@/lib/migration/types";
import { fail, ok } from "../base";
import type { ServiceResult } from "../types";
import { migrationLoadService } from "./migration-load.service";
import { migrationReportService } from "./migration-report.service";
import { migrationVerifyService } from "./migration-verify.service";

type RunContext = {
  runId: string;
  runKey: string;
  dryRun: boolean;
  extract?: LegacyExtract;
  transformed?: MigrationTransformResult;
  validationIssues?: MigrationValidationIssue[];
};

export class MigrationOrchestratorService {
  private runContext = new Map<string, RunContext>();

  async createRun(
    options: MigrationRunOptions,
  ): Promise<ServiceResult<{ runId: string; runKey: string }>> {
    try {
      const db = getDb();
      const runKey =
        options.runKey ??
        `m9-${new Date().toISOString().replace(/[:.]/g, "-")}`;

      const [run] = await db
        .insert(migrationRuns)
        .values({
          runKey,
          label: options.label ?? "M9 Legacy Migration",
          dryRun: options.dryRun,
          sourcePath: options.sourcePath,
          status: "pending",
          startedByAdminId: options.adminId ?? null,
          metadata: { phases: options.phases ?? "all" },
        })
        .returning({ id: migrationRuns.id, runKey: migrationRuns.runKey });

      this.runContext.set(run.id, {
        runId: run.id,
        runKey: run.runKey,
        dryRun: options.dryRun,
      });

      return ok({ runId: run.id, runKey: run.runKey });
    } catch (error) {
      return fail("MIGRATION_RUN_CREATE", "Failed to create migration run", error);
    }
  }

  async getRun(runId: string) {
    try {
      const db = getDb();
      const [run] = await db
        .select()
        .from(migrationRuns)
        .where(eq(migrationRuns.id, runId))
        .limit(1);
      if (!run) return fail("NOT_FOUND", "Migration run not found");
      return ok(run);
    } catch (error) {
      return fail("MIGRATION_RUN_GET", "Failed to get migration run", error);
    }
  }

  async listRuns(limit = 20) {
    try {
      const db = getDb();
      const runs = await db
        .select()
        .from(migrationRuns)
        .orderBy(migrationRuns.createdAt)
        .limit(limit);
      return ok(runs);
    } catch (error) {
      return fail("MIGRATION_RUN_LIST", "Failed to list migration runs", error);
    }
  }

  async runPhase(
    runId: string,
    phase: MigrationPhase,
    options?: Partial<MigrationRunOptions>,
  ): Promise<ServiceResult<Record<string, unknown>>> {
    const ctx = this.runContext.get(runId) ?? {
      runId,
      runKey: runId,
      dryRun: true,
    };

    const runResult = await this.getRun(runId);
    if (!runResult.success) return runResult;
    const run = runResult.data;
    ctx.dryRun = run.dryRun;

    try {
      const db = getDb();
      await db
        .update(migrationRuns)
        .set({
          status: "running",
          currentPhase: phase,
          startedAt: run.startedAt ?? new Date(),
        })
        .where(eq(migrationRuns.id, runId));

      let result: Record<string, unknown> = {};

      switch (phase) {
        case "extract":
          result = await this.runExtract(runId, run.sourcePath, ctx);
          break;
        case "validate":
          result = await this.runValidate(runId, ctx);
          break;
        case "transform":
          result = await this.runTransform(runId, ctx);
          break;
        case "load":
          result = await this.runLoad(runId, ctx, options);
          break;
        case "verify":
          result = await this.runVerify(runId, ctx);
          break;
        case "report":
          result = await this.runReport(runId, ctx);
          break;
        default:
          return fail("INVALID_PHASE", `Unknown phase: ${phase}`);
      }

      await db
        .update(migrationRuns)
        .set({ currentPhase: phase })
        .where(eq(migrationRuns.id, runId));

      await this.saveCheckpoint(runId, phase, result);

      return ok(result);
    } catch (error) {
      const db = getDb();
      await db
        .update(migrationRuns)
        .set({
          status: "failed",
          errorMessage: error instanceof Error ? error.message : String(error),
        })
        .where(eq(migrationRuns.id, runId));
      return fail("MIGRATION_PHASE_FAILED", `Phase ${phase} failed`, error);
    }
  }

  async runAll(
    options: MigrationRunOptions,
  ): Promise<ServiceResult<{ runId: string; stats: MigrationRunStats }>> {
    const createResult = await this.createRun(options);
    if (!createResult.success) return createResult;

    const { runId } = createResult.data;
    const phases: MigrationPhase[] = options.phases ?? [
      "extract",
      "validate",
      "transform",
      "load",
      "verify",
      "report",
    ];

    for (const phase of phases) {
      const phaseResult = await this.runPhase(runId, phase, options);
      if (!phaseResult.success) return phaseResult;

      if (phase === "validate") {
        const errors = (phaseResult.data.errors as number) ?? 0;
        if (errors > 0 && !options.dryRun) {
          return fail(
            "VALIDATION_FAILED",
            `Migration aborted: ${errors} validation errors`,
            phaseResult.data,
          );
        }
      }
    }

    const db = getDb();
    const stats = await this.buildStats(runId);
    await db
      .update(migrationRuns)
      .set({
        status: "completed",
        completedAt: new Date(),
        stats,
      })
      .where(eq(migrationRuns.id, runId));

    return ok({ runId, stats });
  }

  private async runExtract(
    runId: string,
    sourcePath: string,
    ctx: RunContext,
  ): Promise<Record<string, unknown>> {
    const path = sourcePath || DEFAULT_LEGACY_SQL_PATH;
    const sqlContent = readFileSync(path, "utf-8");
    const extract = extractLegacyData(path, sqlContent);
    ctx.extract = extract;
    this.runContext.set(runId, ctx);

    const db = getDb();
    await db
      .update(migrationRuns)
      .set({
        stats: {
          usersExtracted: extract.stats.userCount,
          transactionsExtracted: extract.stats.transactionCount,
        },
      })
      .where(eq(migrationRuns.id, runId));

    return {
      users: extract.stats.userCount,
      transactions: extract.stats.transactionCount,
      admins: extract.stats.adminCount,
      sourcePath: path,
    };
  }

  private async runValidate(
    runId: string,
    ctx: RunContext,
  ): Promise<Record<string, unknown>> {
    if (!ctx.extract) {
      await this.runExtract(runId, DEFAULT_LEGACY_SQL_PATH, ctx);
    }
    const transformed = transformLegacyExtract(ctx.extract!);
    ctx.transformed = transformed;

    const issues = validateMigration(ctx.extract!, transformed);
    ctx.validationIssues = issues;
    this.runContext.set(runId, ctx);

    const errors = issues.filter((i) => i.severity === "error").length;
    const warnings = issues.filter((i) => i.severity === "warning").length;

    await migrationReportService.saveReport(runId, "validation", {
      title: "Validation Report",
      summary: `${errors} errors, ${warnings} warnings`,
      issues,
    });

    return { errors, warnings, total: issues.length };
  }

  private async runTransform(
    runId: string,
    ctx: RunContext,
  ): Promise<Record<string, unknown>> {
    if (!ctx.extract) {
      await this.runExtract(runId, DEFAULT_LEGACY_SQL_PATH, ctx);
    }
    const transformed = transformLegacyExtract(ctx.extract!);
    ctx.transformed = transformed;
    this.runContext.set(runId, ctx);

    return {
      users: transformed.users.length,
      investments: transformed.investments.length,
      ledgerEntries: transformed.ledgerEntries.length,
      referrals: transformed.referralRelationships.length,
      archiveRows: transformed.archiveRows.length,
    };
  }

  private async runLoad(
    runId: string,
    ctx: RunContext,
    options?: Partial<MigrationRunOptions>,
  ): Promise<Record<string, unknown>> {
    if (!ctx.transformed) {
      await this.runTransform(runId, ctx);
    }

    if (ctx.dryRun) {
      return {
        dryRun: true,
        users: ctx.transformed!.users.length,
        transactions: ctx.transformed!.ledgerEntries.length,
        message: "Dry run — no database writes performed",
      };
    }

    return migrationLoadService.loadAll(runId, ctx.transformed!, {
      skipImages: options?.skipImages,
      batchSize: options?.batchSize,
    });
  }

  private async runVerify(
    runId: string,
    ctx: RunContext,
  ): Promise<Record<string, unknown>> {
    if (!ctx.extract) {
      await this.runExtract(runId, DEFAULT_LEGACY_SQL_PATH, ctx);
    }

    if (ctx.dryRun && ctx.transformed) {
      const issues = validateMigration(ctx.extract!, ctx.transformed);
      const balanceErrors = issues.filter((i) => i.code === "BALANCE_MISMATCH");
      return {
        dryRun: true,
        balanceExceptions: balanceErrors.length,
        parity: balanceErrors.length === 0,
      };
    }

    return migrationVerifyService.verifyAll(runId, ctx.extract!);
  }

  private async runReport(
    runId: string,
    ctx: RunContext,
  ): Promise<Record<string, unknown>> {
    const runResult = await this.getRun(runId);
    if (!runResult.success) throw new Error(runResult.error.message);

    return migrationReportService.generateFullReport(runId, {
      run: runResult.data,
      extract: ctx.extract,
      transformed: ctx.transformed,
      validationIssues: ctx.validationIssues,
    });
  }

  private async saveCheckpoint(
    runId: string,
    phase: MigrationPhase,
    result: Record<string, unknown>,
  ) {
    const db = getDb();
    await db.insert(migrationCheckpoints).values({
      runId,
      phase,
      entityType: "global",
      processedCount: typeof result.users === "number" ? result.users : 0,
      cursorData: result,
    });
  }

  private async buildStats(runId: string): Promise<MigrationRunStats> {
    const db = getDb();
    const [run] = await db
      .select({ stats: migrationRuns.stats })
      .from(migrationRuns)
      .where(eq(migrationRuns.id, runId))
      .limit(1);

    const exceptions = await db
      .select()
      .from(migrationBalanceExceptions)
      .where(eq(migrationBalanceExceptions.runId, runId));

    const base = (run?.stats ?? {}) as Partial<MigrationRunStats>;

    return {
      usersExtracted: base.usersExtracted ?? 0,
      usersLoaded: base.usersLoaded ?? 0,
      transactionsExtracted: base.transactionsExtracted ?? 0,
      transactionsLoaded: base.transactionsLoaded ?? 0,
      investmentsLoaded: base.investmentsLoaded ?? 0,
      ledgerEntriesLoaded: base.ledgerEntriesLoaded ?? 0,
      referralsLoaded: base.referralsLoaded ?? 0,
      imagesLoaded: base.imagesLoaded ?? 0,
      imagesFailed: base.imagesFailed ?? 0,
      balanceExceptions: exceptions.length,
      validationErrors: base.validationErrors ?? 0,
      validationWarnings: base.validationWarnings ?? 0,
    };
  }

  async rollback(runId: string): Promise<ServiceResult<{ deleted: number }>> {
    try {
      const db = getDb();
      const runResult = await this.getRun(runId);
      if (!runResult.success) return runResult;

      if (!runResult.data.dryRun) {
        const deleted = await migrationLoadService.rollbackRun(runId);
        await db
          .update(migrationRuns)
          .set({ status: "rolled_back", completedAt: new Date() })
          .where(eq(migrationRuns.id, runId));
        return ok({ deleted });
      }

      await db
        .update(migrationRuns)
        .set({ status: "rolled_back" })
        .where(eq(migrationRuns.id, runId));
      return ok({ deleted: 0 });
    } catch (error) {
      return fail("MIGRATION_ROLLBACK", "Rollback failed", error);
    }
  }

  async getReports(runId: string) {
    try {
      const db = getDb();
      const reports = await db
        .select()
        .from(migrationReports)
        .where(eq(migrationReports.runId, runId));
      return ok(reports);
    } catch (error) {
      return fail("MIGRATION_REPORTS", "Failed to get reports", error);
    }
  }

  async getBalanceExceptions(runId: string) {
    try {
      const db = getDb();
      const rows = await db
        .select()
        .from(migrationBalanceExceptions)
        .where(eq(migrationBalanceExceptions.runId, runId));
      return ok(rows);
    } catch (error) {
      return fail("MIGRATION_EXCEPTIONS", "Failed to get balance exceptions", error);
    }
  }

  generateTempPassword(): string {
    return randomBytes(24).toString("base64url");
  }
}

export const migrationOrchestratorService = new MigrationOrchestratorService();
