import { count, desc, eq, and } from "drizzle-orm";
import { getDb } from "@/db";
import {
  migrationRuns,
  notificationEvents,
  notifications,
  roiProcessingRuns,
} from "@/db/schema";
import { getIntegrationStatus } from "@/lib/infrastructure";
import { isDatabaseConfigured } from "@/lib/env";
import packageJson from "../../../package.json";

export type DiagnosticsReport = {
  status: "ok" | "degraded" | "down";
  timestamp: string;
  version: string;
  build: {
    nodeEnv: string;
    nextRuntime: string;
  };
  integrations: ReturnType<typeof getIntegrationStatus>;
  queues: {
    pendingNotificationEvents: number;
    pendingEmailNotifications: number;
    failedNotificationEvents: number;
    failedEmailNotifications: number;
  };
  scheduler: {
    lastRoiRun: {
      id: string;
      status: string;
      startedAt: string;
      completedAt: string | null;
    } | null;
  };
  migration: {
    lastRun: {
      runKey: string;
      status: string;
      dryRun: boolean;
      completedAt: string | null;
    } | null;
  };
};

export async function getDiagnosticsReport(): Promise<DiagnosticsReport> {
  const integrations = getIntegrationStatus();
  const timestamp = new Date().toISOString();

  let queues = {
    pendingNotificationEvents: 0,
    pendingEmailNotifications: 0,
    failedNotificationEvents: 0,
    failedEmailNotifications: 0,
  };

  let scheduler: DiagnosticsReport["scheduler"] = { lastRoiRun: null };
  let migration: DiagnosticsReport["migration"] = { lastRun: null };

  if (isDatabaseConfigured()) {
    try {
      const db = getDb();

      const [pendingEvents] = await db
        .select({ count: count() })
        .from(notificationEvents)
        .where(eq(notificationEvents.status, "pending"));

      const [failedEvents] = await db
        .select({ count: count() })
        .from(notificationEvents)
        .where(eq(notificationEvents.status, "failed"));

      const [pendingEmail] = await db
        .select({ count: count() })
        .from(notifications)
        .where(
          and(eq(notifications.status, "pending"), eq(notifications.channel, "email")),
        );

      const [failedEmail] = await db
        .select({ count: count() })
        .from(notifications)
        .where(
          and(eq(notifications.status, "failed"), eq(notifications.channel, "email")),
        );

      queues = {
        pendingNotificationEvents: pendingEvents?.count ?? 0,
        failedNotificationEvents: failedEvents?.count ?? 0,
        pendingEmailNotifications: pendingEmail?.count ?? 0,
        failedEmailNotifications: failedEmail?.count ?? 0,
      };

      const [lastRoi] = await db
        .select()
        .from(roiProcessingRuns)
        .orderBy(desc(roiProcessingRuns.startedAt))
        .limit(1);

      if (lastRoi) {
        scheduler = {
          lastRoiRun: {
            id: lastRoi.id,
            status: lastRoi.status,
            startedAt: lastRoi.startedAt.toISOString(),
            completedAt: lastRoi.finishedAt?.toISOString() ?? null,
          },
        };
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
      // Database unreachable — diagnostics still return integration status
    }
  }

  const status = integrations.ready ? "ok" : integrations.missing.length ? "down" : "degraded";

  return {
    status,
    timestamp,
    version: packageJson.version,
    build: {
      nodeEnv: process.env.NODE_ENV ?? "development",
      nextRuntime: process.env.NEXT_RUNTIME ?? "nodejs",
    },
    integrations,
    queues,
    scheduler,
    migration,
  };
}
