import { featureFlagService } from "@/lib/services/feature-flags.service";
import { settingsService } from "@/lib/services/settings.service";
import { FEATURE_FLAGS } from "@/lib/constants/feature-flags";
import { SYSTEM_SETTINGS } from "@/lib/constants/system-settings";

/**
 * Maintenance mode check — uses feature flag when DB is available,
 * falls back to MAINTENANCE_MODE env var for edge/middleware contexts.
 */
export async function isMaintenanceModeActive(): Promise<boolean> {
  if (process.env.MAINTENANCE_MODE === "true") return true;

  try {
    return await featureFlagService.isMaintenanceMode();
  } catch {
    return false;
  }
}

export async function getMaintenanceMessage(): Promise<string> {
  const message = await settingsService.getString(
    SYSTEM_SETTINGS.MAINTENANCE_MESSAGE,
    "Unique Sky Way is currently undergoing scheduled maintenance. Please check back shortly.",
  );
  return message;
}

/**
 * Paths that remain accessible during maintenance mode.
 */
export const MAINTENANCE_ALLOWLIST = [
  "/api/health",
  "/login",
  "/maintenance",
] as const;

export function isMaintenanceAllowlisted(pathname: string): boolean {
  return MAINTENANCE_ALLOWLIST.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`),
  );
}

/**
 * Feature gate helper — checks both maintenance mode and specific flag.
 */
export async function isFeatureAccessible(
  flag: (typeof FEATURE_FLAGS)[keyof typeof FEATURE_FLAGS],
): Promise<{ allowed: boolean; reason?: string }> {
  if (await isMaintenanceModeActive()) {
    return { allowed: false, reason: "maintenance_mode" };
  }

  const enabled = await featureFlagService.isEnabled(flag);
  if (!enabled) {
    return { allowed: false, reason: "feature_disabled" };
  }

  return { allowed: true };
}
