import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { migrationReports } from "@/db/schema";
import { MIGRATION_REPORTS_DIR } from "@/lib/migration/constants";
import type {
  LegacyExtract,
  MigrationReportPayload,
  MigrationTransformResult,
  MigrationValidationIssue,
} from "@/lib/migration/types";

type ReportContext = {
  run: { runKey: string; dryRun: boolean; stats?: Record<string, number> | null };
  extract?: LegacyExtract;
  transformed?: MigrationTransformResult;
  validationIssues?: MigrationValidationIssue[];
};

export class MigrationReportService {
  async saveReport(
    runId: string,
    reportType: string,
    payload: {
      title: string;
      summary: string;
      issues?: MigrationValidationIssue[];
      [key: string]: unknown;
    },
  ) {
    const db = getDb();
    mkdirSync(MIGRATION_REPORTS_DIR, { recursive: true });

    const filePath = path.join(
      MIGRATION_REPORTS_DIR,
      `${runId}-${reportType}.json`,
    );
    writeFileSync(filePath, JSON.stringify(payload, null, 2));

    await db.insert(migrationReports).values({
      runId,
      reportType,
      title: payload.title,
      summary: payload.summary,
      payload,
      filePath,
    });
  }

  async generateFullReport(
    runId: string,
    ctx: ReportContext,
  ): Promise<Record<string, unknown>> {
    const report: MigrationReportPayload = {
      generatedAt: new Date().toISOString(),
      runKey: ctx.run.runKey,
      dryRun: ctx.run.dryRun,
      sections: [],
    };

    if (ctx.extract) {
      report.sections.push({
        title: "Extract Summary",
        summary: `${ctx.extract.stats.userCount} users, ${ctx.extract.stats.transactionCount} transactions`,
        items: [ctx.extract.stats as unknown as Record<string, unknown>],
      });
    }

    if (ctx.validationIssues?.length) {
      const errors = ctx.validationIssues.filter((i) => i.severity === "error");
      const warnings = ctx.validationIssues.filter((i) => i.severity === "warning");
      report.sections.push({
        title: "Validation",
        summary: `${errors.length} errors, ${warnings.length} warnings`,
        items: ctx.validationIssues.map((i) => ({ ...i })),
      });
    }

    if (ctx.transformed) {
      report.sections.push({
        title: "Transform Summary",
        summary: "Transformed legacy records for load",
        items: [
          {
            users: ctx.transformed.users.length,
            investments: ctx.transformed.investments.length,
            ledgerEntries: ctx.transformed.ledgerEntries.length,
            referrals: ctx.transformed.referralRelationships.length,
          },
        ],
      });
    }

    if (ctx.run.stats) {
      report.sections.push({
        title: "Load Statistics",
        summary: "Records loaded into new platform",
        items: [ctx.run.stats as unknown as Record<string, unknown>],
      });
    }

    await this.saveReport(runId, "full", {
      title: "Full Migration Report",
      summary: `Migration run ${ctx.run.runKey}`,
      ...report,
    });

    const humanPath = path.join(MIGRATION_REPORTS_DIR, `${runId}-summary.txt`);
    writeFileSync(humanPath, this.formatHumanReport(report));

    return { reportPath: humanPath, sections: report.sections.length };
  }

  formatHumanReport(report: MigrationReportPayload): string {
    const lines: string[] = [
      "═══════════════════════════════════════════════════",
      "  UNIQUE SKY WAY — LEGACY MIGRATION REPORT",
      "═══════════════════════════════════════════════════",
      "",
      `Run Key:    ${report.runKey}`,
      `Generated:  ${report.generatedAt}`,
      `Mode:       ${report.dryRun ? "DRY RUN" : "LIVE"}`,
      "",
    ];

    for (const section of report.sections) {
      lines.push(`── ${section.title} ──`);
      lines.push(section.summary);
      lines.push("");
      for (const item of section.items.slice(0, 50)) {
        lines.push(`  • ${JSON.stringify(item)}`);
      }
      if (section.items.length > 50) {
        lines.push(`  ... and ${section.items.length - 50} more`);
      }
      lines.push("");
    }

    lines.push("═══════════════════════════════════════════════════");
    return lines.join("\n");
  }

  async getReport(runId: string) {
    const db = getDb();
    const [report] = await db
      .select()
      .from(migrationReports)
      .where(eq(migrationReports.runId, runId))
      .limit(1);
    return report;
  }
}

export const migrationReportService = new MigrationReportService();
