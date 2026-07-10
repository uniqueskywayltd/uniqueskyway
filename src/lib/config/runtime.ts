import { normalizeEnv } from "./env";

export function resolveAppUrl(source: NodeJS.ProcessEnv = process.env): string {
  const explicit = normalizeEnv(source.NEXT_PUBLIC_APP_URL)?.replace(/\/$/, "");
  if (explicit) return explicit;

  const production = normalizeEnv(source.VERCEL_PROJECT_PRODUCTION_URL)?.replace(/\/$/, "");
  if (production) {
    return production.startsWith("http") ? production : `https://${production}`;
  }

  const deployment = normalizeEnv(source.VERCEL_URL);
  if (deployment) return `https://${deployment}`;

  if (source.NODE_ENV === "development") return "http://localhost:3000";

  return "https://uniqueskyway.com";
}

export function isDatabaseConfigured(source: NodeJS.ProcessEnv = process.env): boolean {
  return Boolean(normalizeEnv(source.DATABASE_URL));
}

export function isSupabaseConfigured(source: NodeJS.ProcessEnv = process.env): boolean {
  return (
    Boolean(normalizeEnv(source.NEXT_PUBLIC_SUPABASE_URL)) &&
    Boolean(normalizeEnv(source.NEXT_PUBLIC_SUPABASE_ANON_KEY))
  );
}

export function isStorageConfigured(source: NodeJS.ProcessEnv = process.env): boolean {
  return isSupabaseConfigured(source) && Boolean(normalizeEnv(source.SUPABASE_SERVICE_ROLE_KEY));
}

export function isResendApiKeyPresent(source: NodeJS.ProcessEnv = process.env): boolean {
  return Boolean(normalizeEnv(source.RESEND_API_KEY));
}

export function isCronConfigured(source: NodeJS.ProcessEnv = process.env): boolean {
  return Boolean(normalizeEnv(source.CRON_SECRET));
}
