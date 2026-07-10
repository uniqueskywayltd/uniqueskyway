/**
 * @deprecated Import from `@/lib/config` instead.
 * Re-exports maintained for backward compatibility.
 */
export {
  ENV_KEYS,
  getAppConfig,
  isCronConfigured,
  isDatabaseConfigured,
  isResendApiKeyPresent as isResendConfigured,
  isResendApiKeyPresent,
  isStorageConfigured,
  isSupabaseConfigured,
  normalizeEnv,
  parseClientEnv,
  parseServerEnv,
  resolveAppUrl,
  validateEnv,
  type AppConfig,
  type ClientEnv,
  type EnvValidationResult,
  type ServerEnv,
} from "@/lib/config";
