import path from "node:path";

/** Default path to the immutable legacy SQL dump (read-only). */
export const DEFAULT_LEGACY_SQL_PATH = path.resolve(
  process.cwd(),
  "..",
  "u973246624_uniqueskyway.20260623211625.sql",
);

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
