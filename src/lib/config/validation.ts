import { ENV_KEYS, parseClientEnv, parseServerEnv } from "./env";

export type EnvValidationResult = {
  valid: boolean;
  client: ReturnType<typeof parseClientEnv>;
  server: ReturnType<typeof parseServerEnv>;
  missing: string[];
  warnings: string[];
};

export function validateEnv(source: NodeJS.ProcessEnv = process.env): EnvValidationResult {
  const client = parseClientEnv(source);
  const server = parseServerEnv(source);

  const missing: string[] = [];
  const warnings: string[] = [];

  if (!client.NEXT_PUBLIC_SUPABASE_URL) missing.push(ENV_KEYS.NEXT_PUBLIC_SUPABASE_URL);
  if (!client.NEXT_PUBLIC_SUPABASE_ANON_KEY) missing.push(ENV_KEYS.NEXT_PUBLIC_SUPABASE_ANON_KEY);

  if (!server.DATABASE_URL) warnings.push(ENV_KEYS.DATABASE_URL);
  if (!server.SUPABASE_SERVICE_ROLE_KEY) warnings.push(ENV_KEYS.SUPABASE_SERVICE_ROLE_KEY);
  if (!server.RESEND_API_KEY) warnings.push(ENV_KEYS.RESEND_API_KEY);
  if (!server.CRON_SECRET) warnings.push(ENV_KEYS.CRON_SECRET);

  return {
    valid: missing.length === 0,
    client,
    server,
    missing,
    warnings,
  };
}

/** Production-critical variables required for full platform operation. */
export const PRODUCTION_REQUIRED_SERVER = [
  ENV_KEYS.DATABASE_URL,
  ENV_KEYS.SUPABASE_SERVICE_ROLE_KEY,
  ENV_KEYS.CRON_SECRET,
] as const;

export const PRODUCTION_RECOMMENDED_SERVER = [
  ENV_KEYS.RESEND_API_KEY,
  ENV_KEYS.EMAIL_FROM,
] as const;
