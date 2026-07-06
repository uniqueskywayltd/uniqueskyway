import "dotenv/config";
import { sql } from "drizzle-orm";
import { getDb } from "../src/db";
import { isDatabaseConfigured, isSupabaseConfigured, validateEnv } from "../src/lib/env";

const EXPECTED_TABLES = [
  "profiles",
  "admin_users",
  "login_history",
  "user_sessions",
  "feature_flags",
  "system_settings",
  "permissions",
  "role_permissions",
  "ledger_accounts",
  "ledger_entries",
  "deposit_requests",
  "withdrawal_requests",
  "investment_plans",
  "investments",
  "audit_logs",
  "notifications",
  "notification_events",
  "referral_relationships",
  "referral_commissions",
  "legacy_transactions_archive",
] as const;

const EXPECTED_FEATURE_FLAGS = [
  "registrations_enabled",
  "deposits_enabled",
  "withdrawals_enabled",
  "referrals_enabled",
  "investments_enabled",
  "maintenance_mode",
] as const;

async function verify() {
  console.log("=== M2 Infrastructure Verification ===\n");

  const env = validateEnv();
  console.log("Environment:");
  console.log(`  Supabase configured: ${isSupabaseConfigured()}`);
  console.log(`  Database configured: ${isDatabaseConfigured()}`);
  console.log(`  Env valid: ${env.valid}`);
  if (env.missing.length) console.log(`  Missing: ${env.missing.join(", ")}`);
  if (env.warnings.length) console.log(`  Warnings: ${env.warnings.join(", ")}`);
  console.log();

  if (!isDatabaseConfigured()) {
    console.log("⚠ DATABASE_URL not set — skipping database checks");
    console.log("  Apply migrations with: npm run db:migrate");
    console.log("  Seed infrastructure with: npm run db:seed");
    process.exit(0);
  }

  const db = getDb();

  console.log("Tables:");
  for (const table of EXPECTED_TABLES) {
    const [result] = await db.execute<{ exists: boolean }>(sql`
      SELECT EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = ${table}
      ) AS exists
    `);
    const exists = result?.exists ?? false;
    console.log(`  ${exists ? "✓" : "✗"} ${table}`);
  }
  console.log();

  console.log("RLS enabled:");
  const rlsRows = await db.execute<{ tablename: string; rowsecurity: boolean }>(sql`
    SELECT tablename, rowsecurity
    FROM pg_tables
    WHERE schemaname = 'public'
      AND tablename = ANY(${EXPECTED_TABLES as unknown as string[]})
    ORDER BY tablename
  `);
  for (const row of rlsRows) {
    console.log(`  ${row.rowsecurity ? "✓" : "✗"} ${row.tablename}`);
  }
  console.log();

  console.log("Ledger integrity:");
  const [immutableTrigger] = await db.execute<{ exists: boolean }>(sql`
    SELECT EXISTS (
      SELECT 1 FROM pg_trigger
      WHERE tgname = 'ledger_entries_immutable_update'
    ) AS exists
  `);
  console.log(`  ${immutableTrigger?.exists ? "✓" : "✗"} Immutability triggers`);

  const [balanceFn] = await db.execute<{ exists: boolean }>(sql`
    SELECT EXISTS (
      SELECT 1 FROM pg_proc WHERE proname = 'get_ledger_account_balance'
    ) AS exists
  `);
  console.log(`  ${balanceFn?.exists ? "✓" : "✗"} Balance function`);
  console.log();

  console.log("Feature flags:");
  const flags = await db.execute<{ key: string; enabled: boolean }>(sql`
    SELECT key, enabled FROM feature_flags ORDER BY key
  `);
  for (const expected of EXPECTED_FEATURE_FLAGS) {
    const flag = flags.find((f) => f.key === expected);
    console.log(
      `  ${flag ? "✓" : "✗"} ${expected}${flag ? ` (enabled: ${flag.enabled})` : ""}`,
    );
  }
  console.log();

  console.log("Investment plans:");
  const [planCount] = await db.execute<{ count: string }>(sql`
    SELECT COUNT(*)::text AS count FROM investment_plans
  `);
  const count = parseInt(planCount?.count ?? "0", 10);
  console.log(`  Count: ${count} ${count === 0 ? "✓ (intentionally empty)" : "⚠ (should be empty until validation)"}`);
  console.log();

  console.log("Permissions & roles:");
  const [permCount] = await db.execute<{ count: string }>(sql`
    SELECT COUNT(*)::text AS count FROM permissions
  `);
  const [rolePermCount] = await db.execute<{ count: string }>(sql`
    SELECT COUNT(*)::text AS count FROM role_permissions
  `);
  console.log(`  Permissions: ${permCount?.count ?? 0}`);
  console.log(`  Role mappings: ${rolePermCount?.count ?? 0}`);
  console.log();

  console.log("Storage buckets:");
  const buckets = await db.execute<{ id: string }>(sql`
    SELECT id FROM storage.buckets ORDER BY id
  `);
  const expectedBuckets = ["avatars", "documents", "legacy-imports"];
  for (const bucket of expectedBuckets) {
    const exists = buckets.some((b) => b.id === bucket);
    console.log(`  ${exists ? "✓" : "✗"} ${bucket}`);
  }
  console.log();

  console.log("=== Verification complete ===");
  process.exit(0);
}

verify().catch((err) => {
  console.error("Verification failed:", err);
  process.exit(1);
});
