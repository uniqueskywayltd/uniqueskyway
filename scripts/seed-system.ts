import "dotenv/config";
import { getDb } from "../src/db";
import { featureFlags, permissions, rolePermissions, systemSettings } from "../src/db/schema";
import { FEATURE_FLAG_DEFINITIONS } from "../src/lib/constants/feature-flags";
import { SYSTEM_SETTING_DEFINITIONS } from "../src/lib/constants/system-settings";
import {
  DEFAULT_ROLE_PERMISSIONS,
  PERMISSIONS,
} from "../src/lib/permissions/constants";
import type { AdminRole, PermissionCategory } from "../src/types/domain";

function permissionCategory(slug: string): PermissionCategory {
  const prefix = slug.split(".")[0];
  const map: Record<string, PermissionCategory> = {
    users: "users",
    deposits: "finance",
    withdrawals: "finance",
    ledger: "finance",
    investments: "investments",
    plans: "investments",
    referrals: "investments",
    support: "support",
    compliance: "compliance",
    settings: "system",
    feature_flags: "system",
    email: "system",
    audit: "audit",
    admins: "system",
  };
  return map[prefix] ?? "system";
}

/**
 * Seeds infrastructure data only.
 * Does NOT seed investment_plans — pending legacy validation.
 */
async function seed() {
  const db = getDb();
  console.log("Seeding feature flags...");
  for (const flag of FEATURE_FLAG_DEFINITIONS) {
    await db
      .insert(featureFlags)
      .values({
        key: flag.key,
        enabled: flag.defaultEnabled,
        description: flag.description,
      })
      .onConflictDoNothing();
  }

  console.log("Seeding system settings...");
  for (const setting of SYSTEM_SETTING_DEFINITIONS) {
    await db
      .insert(systemSettings)
      .values({
        key: setting.key,
        value: setting.value,
        description: setting.description,
        isPublic: setting.isPublic,
      })
      .onConflictDoNothing();
  }

  console.log("Seeding permissions...");
  const permissionDefs = Object.entries(PERMISSIONS).map(([name, slug]) => ({
    slug,
    name: name.replace(/_/g, " "),
    category: permissionCategory(slug),
    description: `Permission: ${slug}`,
  }));

  for (const perm of permissionDefs) {
    await db.insert(permissions).values(perm).onConflictDoNothing();
  }

  console.log("Seeding role permissions...");
  const allPermissions = await db.select().from(permissions);

  for (const [role, slugs] of Object.entries(DEFAULT_ROLE_PERMISSIONS) as [
    AdminRole,
    string[],
  ][]) {
    for (const slug of slugs) {
      const perm = allPermissions.find((p) => p.slug === slug);
      if (!perm) continue;
      await db
        .insert(rolePermissions)
        .values({ role, permissionId: perm.id })
        .onConflictDoNothing();
    }
  }

  console.log("✓ System seed complete");
  console.log("✗ investment_plans intentionally NOT seeded");
  process.exit(0);
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
