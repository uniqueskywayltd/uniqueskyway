import { z } from "zod";

/** Trim empty strings to undefined — treats Vercel empty-string env vars as unset. */
export function normalizeEnv(value: string | undefined): string | undefined {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

/**
 * Canonical environment variable registry.
 * Single source of truth for names, requirements, and documentation.
 */
export const ENV_KEYS = {
  // Public (client-safe)
  NEXT_PUBLIC_APP_URL: "NEXT_PUBLIC_APP_URL",
  NEXT_PUBLIC_APP_NAME: "NEXT_PUBLIC_APP_NAME",
  NEXT_PUBLIC_SUPABASE_URL: "NEXT_PUBLIC_SUPABASE_URL",
  NEXT_PUBLIC_SUPABASE_ANON_KEY: "NEXT_PUBLIC_SUPABASE_ANON_KEY",

  // Server — required for production financial operations
  DATABASE_URL: "DATABASE_URL",
  SUPABASE_SERVICE_ROLE_KEY: "SUPABASE_SERVICE_ROLE_KEY",

  // Server — email
  RESEND_API_KEY: "RESEND_API_KEY",
  EMAIL_FROM: "EMAIL_FROM",

  // Server — security & ops
  CRON_SECRET: "CRON_SECRET",
  SITE_ACCESS_KEY: "SITE_ACCESS_KEY",
  MAINTENANCE_MODE: "MAINTENANCE_MODE",

  // Build / runtime (injected by platform)
  NODE_ENV: "NODE_ENV",
  PORT: "PORT",
  HOSTNAME: "HOSTNAME",
  GIT_COMMIT_SHA: "GIT_COMMIT_SHA",
  GIT_COMMIT_REF: "GIT_COMMIT_REF",
  DEPLOYMENT_ID: "DEPLOYMENT_ID",
  VERCEL_GIT_COMMIT_SHA: "VERCEL_GIT_COMMIT_SHA",
  VERCEL_GIT_COMMIT_REF: "VERCEL_GIT_COMMIT_REF",
  VERCEL_DEPLOYMENT_ID: "VERCEL_DEPLOYMENT_ID",
  VERCEL_ENV: "VERCEL_ENV",
  VERCEL_URL: "VERCEL_URL",
  VERCEL_PROJECT_PRODUCTION_URL: "VERCEL_PROJECT_PRODUCTION_URL",
} as const;

export type EnvKey = (typeof ENV_KEYS)[keyof typeof ENV_KEYS];

export const clientEnvSchema = z.object({
  NEXT_PUBLIC_APP_URL: z.string().url().default("http://localhost:3000"),
  NEXT_PUBLIC_APP_NAME: z.string().min(1).default("Unique Sky Way"),
  NEXT_PUBLIC_SUPABASE_URL: z.string().url().optional(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1).optional(),
});

export const serverEnvSchema = z.object({
  DATABASE_URL: z.string().url().optional(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1).optional(),
  RESEND_API_KEY: z.string().min(1).optional(),
  EMAIL_FROM: z.string().min(3).optional(),
  CRON_SECRET: z.string().min(16).optional(),
  SITE_ACCESS_KEY: z.string().min(16).optional(),
  MAINTENANCE_MODE: z.enum(["true", "false"]).optional(),
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  PORT: z.string().optional(),
  HOSTNAME: z.string().optional(),
  GIT_COMMIT_SHA: z.string().optional(),
  GIT_COMMIT_REF: z.string().optional(),
  DEPLOYMENT_ID: z.string().optional(),
  VERCEL_GIT_COMMIT_SHA: z.string().optional(),
  VERCEL_GIT_COMMIT_REF: z.string().optional(),
  VERCEL_DEPLOYMENT_ID: z.string().optional(),
  VERCEL_ENV: z.string().optional(),
});

export type ClientEnv = z.infer<typeof clientEnvSchema>;
export type ServerEnv = z.infer<typeof serverEnvSchema>;

export function parseClientEnv(source: NodeJS.ProcessEnv = process.env): ClientEnv {
  return clientEnvSchema.parse({
    NEXT_PUBLIC_APP_URL: normalizeEnv(source.NEXT_PUBLIC_APP_URL),
    NEXT_PUBLIC_APP_NAME: normalizeEnv(source.NEXT_PUBLIC_APP_NAME),
    NEXT_PUBLIC_SUPABASE_URL: normalizeEnv(source.NEXT_PUBLIC_SUPABASE_URL),
    NEXT_PUBLIC_SUPABASE_ANON_KEY: normalizeEnv(source.NEXT_PUBLIC_SUPABASE_ANON_KEY),
  });
}

export function parseServerEnv(source: NodeJS.ProcessEnv = process.env): ServerEnv {
  return serverEnvSchema.parse({
    DATABASE_URL: normalizeEnv(source.DATABASE_URL),
    SUPABASE_SERVICE_ROLE_KEY: normalizeEnv(source.SUPABASE_SERVICE_ROLE_KEY),
    RESEND_API_KEY: normalizeEnv(source.RESEND_API_KEY),
    EMAIL_FROM: normalizeEnv(source.EMAIL_FROM),
    CRON_SECRET: normalizeEnv(source.CRON_SECRET),
    SITE_ACCESS_KEY: normalizeEnv(source.SITE_ACCESS_KEY),
    MAINTENANCE_MODE: normalizeEnv(source.MAINTENANCE_MODE) as "true" | "false" | undefined,
    NODE_ENV: source.NODE_ENV,
    PORT: normalizeEnv(source.PORT),
    HOSTNAME: normalizeEnv(source.HOSTNAME),
    GIT_COMMIT_SHA: normalizeEnv(source.GIT_COMMIT_SHA),
    GIT_COMMIT_REF: normalizeEnv(source.GIT_COMMIT_REF),
    DEPLOYMENT_ID: normalizeEnv(source.DEPLOYMENT_ID),
    VERCEL_GIT_COMMIT_SHA: normalizeEnv(source.VERCEL_GIT_COMMIT_SHA),
    VERCEL_GIT_COMMIT_REF: normalizeEnv(source.VERCEL_GIT_COMMIT_REF),
    VERCEL_DEPLOYMENT_ID: normalizeEnv(source.VERCEL_DEPLOYMENT_ID),
    VERCEL_ENV: normalizeEnv(source.VERCEL_ENV),
  });
}
