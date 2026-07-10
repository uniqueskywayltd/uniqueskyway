import { performance } from "node:perf_hooks";
import { count, desc, eq, and, sql } from "drizzle-orm";
import { getDb } from "@/db";
import {
  auditLogs,
  featureFlags,
  ledgerEntries,
  migrationRuns,
  notificationEvents,
  notifications,
  permissions,
  roiProcessingRuns,
  systemSettings,
} from "@/db/schema";
import { getAppConfig, isDatabaseConfigured, resolveAppUrl } from "@/lib/config";
import { probeIntegrations } from "@/lib/infrastructure";
import { createAdminClient } from "@/lib/supabase/admin";
import packageJson from "../../../package.json";

const APP_START_TIME = Date.now();

export const SCHEDULED_JOBS = [
  {
    id: "roi",
    name: "ROI accrual",
    path: "/api/cron/roi",
    schedule: "0 6 * * *",
    description: "Daily investment ROI processing",
  },
  {
    id: "notifications",
    name: "Notification processor",
    path: "/api/cron/notifications",
    schedule: "*/15 * * * *",
    description: "Email queue and notification event processor",
  },
] as const;

export type DiagnosticsReport = {
  status: "ok" | "degraded" | "down";
  timestamp: string;
  application: {
    name: string;
    version: string;
    uptimeSeconds: number;
    nodeEnv: string;
    nextRuntime: string;
    appUrl: string;
  };
  build: {
    gitCommit: string | null;
    gitRef: string | null;
    deploymentId: string | null;
    vercelEnv: string | null;
  };
  runtime: {
    memory: {
      heapUsedMb: number;
      heapTotalMb: number;
      rssMb: number;
    };
  };
  integrations: Awaited<ReturnType<typeof probeIntegrations>>;
  latency: {
    databaseMs: number | null;
    storageMs: number | null;
  };
  infrastructure: {
    featureFlags: boolean;
    systemSettings: boolean;
    rbac: boolean;
    ledger: boolean;
    auditLogging: boolean;
    notifications: boolean;
  };
  queues: {
    pendingNotificationEvents: number;
    failedNotificationEvents: number;
    pendingEmailNotifications: number;
    failedEmailNotifications: number;
  };
  scheduler: {
    cronConfigured: boolean;
    jobs: Array<{
      id: string;
      name: string;
      schedule: string;
      path: string;
      lastRun: {
        id: string;
        status: string;
        startedAt: string;
        completedAt: string | null;
        durationMs: number | null;
        error: string | null;
      } | null;
    }>;
  };
  migration: {
    lastRun: {
      runKey: string;
      status: string;
      dryRun: boolean;
      completedAt: string | null;
    } | null;
  };
  environment: {
    ready: boolean;
    missing: string[];
    warnings: string[];
    pendingFeatures: string[];
  };
};

async function measureDatabaseLatency(): Promise<{ ok: boolean; ms: number | null }> {
  if (!isDatabaseConfigured()) return { ok: false, ms: null };
  const start = performance.now();
  try {
    const db = getDb();
    await db.execute(sql`select 1 as ok`);
    return { ok: true, ms: Math.round(performance.now() - start) };
  } catch {
    return { ok: false, ms: null };
  }
}

async function measureStorageLatency(): Promise<{ ok: boolean; ms: number | null }> {
  const start = performance.now();
  try {
    const supabase = createAdminClient();
    const { error } = await supabase.storage.listBuckets();
    if (error) return { ok: false, ms: null };
    return { ok: true, ms: Math.round(performance.now() - start) };
  } catch {
    return { ok: false, ms: null };
  }
}

async function probeInfrastructure(dbAvailable: boolean): Promise<DiagnosticsReport["infrastructure"]> {
  if (!dbAvailable) {
    return {
      featureFlags: false,
      systemSettings: false,
      rbac: false,
      ledger: false,
      auditLogging: false,
      notifications: false,
    };
  }

  try {
    const db = getDb();
    const [[flags], [settings], [perms]] = await Promise.all([
      db.select({ count: count() }).from(featureFlags),
      db.select({ count: count() }).from(systemSettings),
      db.select({ count: count() }).from(permissions),
    ]);

    await db.select({ count: count() }).from(ledgerEntries).limit(1);
    await db.select({ count: count() }).from(auditLogs).limit(1);
    await db.select({ count: count() }).from(notifications).limit(1);

    return {
      featureFlags: (flags?.count ?? 0) > 0,
      systemSettings: (settings?.count ?? 0) > 0,
      rbac: (perms?.count ?? 0) > 0,
      ledger: true,
      auditLogging: true,
      notifications: true,
    };
  } catch {
    return {
      featureFlags: false,
      systemSettings: false,
      rbac: false,
      ledger: false,
      auditLogging: false,
      notifications: false,
    };
  }
}

export async function getDiagnosticsReport(): Promise<DiagnosticsReport> {
  const config = getAppConfig();
  const integrations = await probeIntegrations();
  const timestamp = new Date().toISOString();

  const [dbLatency, storageLatency] = await Promise.all([
    measureDatabaseLatency(),
    integrations.storage ? measureStorageLatency() : Promise.resolve({ ok: false, ms: null }),
  ]);

  const dbAvailable = dbLatency.ok;

  let queues = {
    pendingNotificationEvents: 0,
    failedNotificationEvents: 0,
    pendingEmailNotifications: 0,
    failedEmailNotifications: 0,
  };

  let schedulerJobs: DiagnosticsReport["scheduler"]["jobs"] = SCHEDULED_JOBS.map((job) => ({
    id: job.id,
    name: job.name,
    schedule: job.schedule,
    path: job.path,
    lastRun: null,
  }));

  let migration: DiagnosticsReport["migration"] = { lastRun: null };

  if (dbAvailable) {
    try {
      const db = getDb();

      const [pendingEvents, failedEvents, pendingEmail, failedEmail] = await Promise.all([
        db
          .select({ count: count() })
          .from(notificationEvents)
          .where(eq(notificationEvents.status, "pending")),
        db
          .select({ count: count() })
          .from(notificationEvents)
          .where(eq(notificationEvents.status, "failed")),
        db
          .select({ count: count() })
          .from(notifications)
          .where(and(eq(notifications.status, "pending"), eq(notifications.channel, "email"))),
        db
          .select({ count: count() })
          .from(notifications)
          .where(and(eq(notifications.status, "failed"), eq(notifications.channel, "email"))),
      ]);

      queues = {
        pendingNotificationEvents: pendingEvents[0]?.count ?? 0,
        failedNotificationEvents: failedEvents[0]?.count ?? 0,
        pendingEmailNotifications: pendingEmail[0]?.count ?? 0,
        failedEmailNotifications: failedEmail[0]?.count ?? 0,
      };

      const [lastRoi] = await db
        .select()
        .from(roiProcessingRuns)
        .orderBy(desc(roiProcessingRuns.startedAt))
        .limit(1);

      if (lastRoi) {
        schedulerJobs = schedulerJobs.map((job) =>
          job.id === "roi"
            ? {
                ...job,
                lastRun: {
                  id: lastRoi.id,
                  status: lastRoi.status,
                  startedAt: lastRoi.startedAt.toISOString(),
                  completedAt: lastRoi.finishedAt?.toISOString() ?? null,
                  durationMs:
                    lastRoi.durationMs ??
                    (lastRoi.finishedAt && lastRoi.startedAt
                      ? lastRoi.finishedAt.getTime() - lastRoi.startedAt.getTime()
                      : null),
                  error:
                    Array.isArray(lastRoi.errors) && lastRoi.errors.length > 0
                      ? (lastRoi.errors[0]?.message ?? "ROI run reported errors")
                      : null,
                },
              }
            : job,
        );
      }

      const [lastMigration] = await db
        .select()
        .from(migrationRuns)
        .orderBy(desc(migrationRuns.createdAt))
        .limit(1);

      if (lastMigration) {
        migration = {
          lastRun: {
            runKey: lastMigration.runKey,
            status: lastMigration.status,
            dryRun: lastMigration.dryRun,
            completedAt: lastMigration.completedAt?.toISOString() ?? null,
          },
        };
      }
    } catch {
      /* keep defaults */
    }
  }

  const infrastructure = await probeInfrastructure(dbAvailable);

  const degraded =
    !integrations.ready ||
    !integrations.email ||
    integrations.warnings.length > 0 ||
    !integrations.cron;

  const status = integrations.missing.length
    ? "down"
    : degraded
      ? "degraded"
      : "ok";

  const mem = process.memoryUsage();

  return {
    status,
    timestamp,
    application: {
      name: config.client.NEXT_PUBLIC_APP_NAME,
      version: packageJson.version,
      uptimeSeconds: Math.floor((Date.now() - APP_START_TIME) / 1000),
      nodeEnv: config.server.NODE_ENV,
      nextRuntime: process.env.NEXT_RUNTIME ?? "nodejs",
      appUrl: resolveAppUrl(),
    },
    build: {
      gitCommit:
        config.server.GIT_COMMIT_SHA ?? config.server.VERCEL_GIT_COMMIT_SHA ?? null,
      gitRef: config.server.GIT_COMMIT_REF ?? config.server.VERCEL_GIT_COMMIT_REF ?? null,
      deploymentId:
        config.server.DEPLOYMENT_ID ?? config.server.VERCEL_DEPLOYMENT_ID ?? null,
      vercelEnv: config.server.VERCEL_ENV ?? null,
    },
    runtime: {
      memory: {
        heapUsedMb: Math.round(mem.heapUsed / 1024 / 1024),
        heapTotalMb: Math.round(mem.heapTotal / 1024 / 1024),
        rssMb: Math.round(mem.rss / 1024 / 1024),
      },
    },
    integrations,
    latency: {
      databaseMs: dbLatency.ms,
      storageMs: storageLatency.ms,
    },
    infrastructure,
    queues,
    scheduler: {
      cronConfigured: integrations.cron,
      jobs: schedulerJobs,
    },
    migration,
    environment: {
      ready: integrations.ready,
      missing: integrations.missing,
      warnings: integrations.warnings,
      pendingFeatures: integrations.pendingFeatures,
    },
  };
}
