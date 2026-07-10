import {
  isCronConfigured,
  isDatabaseConfigured,
  isResendApiKeyPresent,
  isStorageConfigured,
  isSupabaseConfigured,
  validateEnv,
} from "@/lib/config";
import type { EmailDiagnostics } from "@/lib/services/email/email-provider";

export type IntegrationStatus = {
  supabase: boolean;
  database: boolean;
  storage: boolean;
  email: boolean;
  cron: boolean;
  ready: boolean;
  missing: string[];
  warnings: string[];
  pendingFeatures: string[];
};

export type IntegrationProbeResult = IntegrationStatus & {
  emailDiagnostics: EmailDiagnostics;
};

/**
 * Synchronous integration flags (env presence only).
 * Use `probeIntegrations()` for runtime verification.
 */
export function getIntegrationStatus(): IntegrationStatus {
  const env = validateEnv();
  const supabase = isSupabaseConfigured();
  const database = isDatabaseConfigured();
  const storage = isStorageConfigured();
  const emailKeyPresent = isResendApiKeyPresent();
  const cron = isCronConfigured();

  const pendingFeatures: string[] = [];
  if (!supabase) pendingFeatures.push("Authentication");
  if (!database) pendingFeatures.push("Financial data", "Profile storage", "Notifications");
  if (!storage) pendingFeatures.push("Avatar uploads");
  if (!emailKeyPresent) pendingFeatures.push("Transactional email");
  if (!cron) pendingFeatures.push("Scheduled jobs");

  return {
    supabase,
    database,
    storage,
    email: emailKeyPresent,
    cron,
    ready: supabase && database,
    missing: env.missing,
    warnings: env.warnings,
    pendingFeatures,
  };
}

export async function probeIntegrations(): Promise<IntegrationProbeResult> {
  const base = getIntegrationStatus();
  const { getEmailDiagnostics } = await import("@/lib/services/email/email-provider");
  const emailDiagnostics = await getEmailDiagnostics();

  const warnings = base.warnings.filter(
    (w) => w !== "RESEND_API_KEY" || !emailDiagnostics.apiKeyPresent,
  );
  if (emailDiagnostics.apiKeyPresent && !emailDiagnostics.configured && emailDiagnostics.lastError) {
    warnings.push(`RESEND_API_KEY: ${emailDiagnostics.lastError}`);
  }

  return {
    ...base,
    email: emailDiagnostics.configured,
    warnings,
    pendingFeatures: base.pendingFeatures.filter(
      (f) => f !== "Transactional email" || !emailDiagnostics.configured,
    ),
    emailDiagnostics,
  };
}

export function isInfrastructureError(code: string): boolean {
  return code === "INFRASTRUCTURE_NOT_CONFIGURED";
}
