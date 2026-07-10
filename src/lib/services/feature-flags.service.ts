import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { featureFlags } from "@/db/schema";
import { FEATURE_FLAGS, type FeatureFlagKey } from "@/lib/constants/feature-flags";
import { auditService } from "./audit.service";
import { fail, ok } from "./base";
import type { ServiceResult } from "./types";

/**
 * Feature flag service — runtime toggles without deployments.
 */
export class FeatureFlagService {
  async isEnabled(key: FeatureFlagKey): Promise<boolean> {
    if (key === FEATURE_FLAGS.REGISTRATIONS_ENABLED) {
      const envOverride = process.env.REGISTRATIONS_ENABLED?.trim().toLowerCase();
      if (envOverride === "true" || envOverride === "1") return true;
      if (envOverride === "false" || envOverride === "0") return false;
    }

    try {
      const db = getDb();
      const [flag] = await db
        .select({ enabled: featureFlags.enabled })
        .from(featureFlags)
        .where(eq(featureFlags.key, key))
        .limit(1);

      return flag?.enabled ?? false;
    } catch {
      return false;
    }
  }

  async getAll(): Promise<ServiceResult<Array<{ key: string; enabled: boolean }>>> {
    try {
      const db = getDb();
      const flags = await db
        .select({ key: featureFlags.key, enabled: featureFlags.enabled })
        .from(featureFlags);

      return ok(flags);
    } catch (error) {
      return fail("FEATURE_FLAGS_ERROR", "Failed to load feature flags", error);
    }
  }

  async requireEnabled(key: FeatureFlagKey): Promise<ServiceResult<void>> {
    const enabled = await this.isEnabled(key);
    if (!enabled) {
      if (key === FEATURE_FLAGS.REGISTRATIONS_ENABLED) {
        return fail(
          "FEATURE_DISABLED",
          "New account registration is temporarily unavailable. Please try again later or contact support.",
        );
      }
      return fail("FEATURE_DISABLED", `Feature '${key}' is currently disabled`);
    }
    return ok(undefined);
  }

  async isMaintenanceMode(): Promise<boolean> {
    return this.isEnabled(FEATURE_FLAGS.MAINTENANCE_MODE);
  }

  async setEnabled(
    key: FeatureFlagKey,
    enabled: boolean,
    adminUserId: string,
  ): Promise<ServiceResult<void>> {
    try {
      const db = getDb();
      const [before] = await db
        .select({ enabled: featureFlags.enabled })
        .from(featureFlags)
        .where(eq(featureFlags.key, key))
        .limit(1);

      await db
        .update(featureFlags)
        .set({ enabled, updatedByAdminId: adminUserId, updatedAt: new Date() })
        .where(eq(featureFlags.key, key));

      await auditService.log({
        action: "update",
        entityType: "feature_flag",
        entityId: key,
        actor: { adminUserId },
        beforeState: { enabled: before?.enabled },
        afterState: { enabled },
      });

      return ok(undefined);
    } catch (error) {
      return fail("FEATURE_FLAG_UPDATE_ERROR", "Failed to update feature flag", error);
    }
  }
}

export const featureFlagService = new FeatureFlagService();
