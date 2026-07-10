import {
  isCronConfigured,
  isDatabaseConfigured,
  isResendApiKeyPresent,
  isStorageConfigured,
  isSupabaseConfigured,
} from "./runtime";
import { validateEnv } from "./validation";

export type ConfigHealthSnapshot = {
  supabase: boolean;
  database: boolean;
  storage: boolean;
  emailKeyPresent: boolean;
  cron: boolean;
  valid: boolean;
  missing: string[];
  warnings: string[];
};

/** Synchronous env-only health signals (no external probes). */
export function getConfigHealthSnapshot(
  source: NodeJS.ProcessEnv = process.env,
): ConfigHealthSnapshot {
  const env = validateEnv(source);

  return {
    supabase: isSupabaseConfigured(source),
    database: isDatabaseConfigured(source),
    storage: isStorageConfigured(source),
    emailKeyPresent: isResendApiKeyPresent(source),
    cron: isCronConfigured(source),
    valid: env.valid,
    missing: env.missing,
    warnings: env.warnings,
  };
}
