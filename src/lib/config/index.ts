/**
 * Centralized application configuration.
 * Each symbol is defined once in its module and re-exported here.
 */

export { getAppConfig, type AppConfig } from "./app-config";

export {
  ENV_KEYS,
  clientEnvSchema,
  normalizeEnv,
  parseClientEnv,
  parseServerEnv,
  serverEnvSchema,
  type ClientEnv,
  type EnvKey,
  type ServerEnv,
} from "./env";

export {
  PRODUCTION_RECOMMENDED_SERVER,
  PRODUCTION_REQUIRED_SERVER,
  validateEnv,
  type EnvValidationResult,
} from "./validation";

export {
  isCronConfigured,
  isDatabaseConfigured,
  isResendApiKeyPresent,
  isStorageConfigured,
  isSupabaseConfigured,
  resolveAppUrl,
} from "./runtime";

export { getConfigHealthSnapshot, type ConfigHealthSnapshot } from "./health";
