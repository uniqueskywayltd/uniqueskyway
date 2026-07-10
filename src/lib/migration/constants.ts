import { existsSync } from "node:fs";
import path from "node:path";

const LEGACY_SQL_CANDIDATES = [
  path.resolve(process.cwd(), "migration-data", "legacy.sql"),
  path.resolve(process.cwd(), "..", "u973246624_uniqueskyway.20260623211625.sql"),
];

/** Resolve the legacy SQL dump path (bundled in deploy, or repo root in local dev). */
export function resolveLegacySqlPath(override?: string | null): string {
  if (override && existsSync(override)) return override;
  for (const candidate of LEGACY_SQL_CANDIDATES) {
    if (existsSync(candidate)) return candidate;
  }
  return LEGACY_SQL_CANDIDATES[0];
}

/** Default path to the immutable legacy SQL dump (read-only). */
export const DEFAULT_LEGACY_SQL_PATH = resolveLegacySqlPath();

export const DEFAULT_LEGACY_IMAGES_PATH = path.resolve(
  process.cwd(),
  "..",
  "u_images",
);

export const MIGRATION_BATCH_SIZE = 50;

export const MIGRATION_REPORTS_DIR = path.resolve(
  process.cwd(),
  "migration-reports",
);

/** Lock period in days before ROI/withdrawable funds unlock (legacy dashboard.php). */
export const LEGACY_LOCK_PERIOD_DAYS = 5;

export const MIGRATION_IDEMPOTENCY_PREFIX = "legacy-m9";
