#!/usr/bin/env tsx
/**
 * Legacy migration CLI — run ETL phases independently.
 *
 * Usage:
 *   npm run migration:dry-run
 *   npm run migration -- --phase=validate
 *   npm run migration -- --live --skip-images
 */
import "dotenv/config";
import { readFileSync } from "node:fs";
import { DEFAULT_LEGACY_SQL_PATH } from "../../src/lib/migration/constants";
import { extractLegacyData } from "../../src/lib/migration/legacy-sql-parser";
import { transformLegacyExtract } from "../../src/lib/migration/transform-legacy";
import { validateMigration } from "../../src/lib/migration/validate-legacy";

const args = process.argv.slice(2);
const phase = args.find((a) => a.startsWith("--phase="))?.split("=")[1] ?? "all";
const live = args.includes("--live");
const skipImages = args.includes("--skip-images");
const sourcePath =
  args.find((a) => a.startsWith("--source="))?.split("=")[1] ??
  DEFAULT_LEGACY_SQL_PATH;

async function offlinePhases() {
  console.log("═══ M9 Legacy Migration — Offline Validation ═══\n");
  console.log(`Source: ${sourcePath}`);
  console.log(`Mode: ${live ? "LIVE" : "DRY RUN"}\n`);

  const sql = readFileSync(sourcePath, "utf-8");
  const extract = extractLegacyData(sourcePath, sql);
  console.log(`Extract: ${extract.stats.userCount} users, ${extract.stats.transactionCount} transactions`);

  const transformed = transformLegacyExtract(extract);
  console.log(
    `Transform: ${transformed.users.length} users, ${transformed.ledgerEntries.length} ledger entries, ${transformed.investments.length} investments`,
  );

  const issues = validateMigration(extract, transformed);
  const errors = issues.filter((i) => i.severity === "error");
  const warnings = issues.filter((i) => i.severity === "warning");
  console.log(`Validate: ${errors.length} errors, ${warnings.length} warnings`);

  if (errors.length) {
    console.log("\nErrors:");
    for (const e of errors.slice(0, 20)) {
      console.log(`  [${e.code}] ${e.message}`);
    }
  }

  const balanceErrors = errors.filter((i) => i.code === "BALANCE_MISMATCH");
  console.log(`\nBalance parity: ${balanceErrors.length === 0 ? "PASS ✓" : `FAIL (${balanceErrors.length} exceptions)`}`);

  if (balanceErrors.length) {
    for (const e of balanceErrors) {
      console.log(`  ${e.email}: ${e.message}`);
    }
  }

  return { extract, transformed, issues, balanceErrors };
}

async function onlineMigration() {
  const { migrationOrchestratorService } = await import(
    "../../src/lib/services/migration/migration-orchestrator.service"
  );

  const result = await migrationOrchestratorService.runAll({
    dryRun: !live,
    sourcePath,
    label: live ? "CLI Live Migration" : "CLI Dry Run",
    skipImages,
  });

  if (!result.success) {
    console.error("Migration failed:", result.error.message);
    process.exit(1);
  }

  console.log("Migration completed:", result.data);
}

async function main() {
  if (args.includes("--live") && !process.env.DATABASE_URL) {
    console.error("DATABASE_URL is required for live migration. Set it in .env.local or run from Admin → Migration on production.");
    process.exit(1);
  }

  if (phase === "offline" || !process.env.DATABASE_URL) {
    await offlinePhases();
    return;
  }

  if (phase === "all" || phase === "live") {
    await onlineMigration();
    return;
  }

  await offlinePhases();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
