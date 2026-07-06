import {
  isDatabaseConfigured,
  isResendConfigured,
  isStorageConfigured,
  isSupabaseConfigured,
  validateEnv,
} from "@/lib/env";

export type IntegrationStatus = {
  supabase: boolean;
  database: boolean;
  storage: boolean;
  email: boolean;
  ready: boolean;
  missing: string[];
  warnings: string[];
  pendingFeatures: string[];
};

/**
 * Reports which integrations are configured.
 * Used by health endpoint, dashboard banners, and feature gating.
 */
export function getIntegrationStatus(): IntegrationStatus {
  const env = validateEnv();
  const supabase = isSupabaseConfigured();
  const database = isDatabaseConfigured();
  const storage = isStorageConfigured();
  const email = isResendConfigured();

  const pendingFeatures: string[] = [];
  if (!supabase) pendingFeatures.push("Authentication");
  if (!database) pendingFeatures.push("Financial data", "Profile storage", "Notifications");
  if (!storage) pendingFeatures.push("Avatar uploads");
  if (!email) pendingFeatures.push("Transactional email");

  return {
    supabase,
    database,
    storage,
    email,
    ready: supabase && database,
    missing: env.missing,
    warnings: env.warnings,
    pendingFeatures,
  };
}

export function isInfrastructureError(code: string): boolean {
  return code === "INFRASTRUCTURE_NOT_CONFIGURED";
}
