import { and, eq, inArray } from "drizzle-orm";
import { getDb } from "@/db";
import { notificationEvents, notifications, profiles } from "@/db/schema";
import { logger } from "@/lib/logging/logger";
import { emailService } from "./email.service";
import { fail, ok } from "./base";
import type { ServiceResult } from "./types";

const MAX_ATTEMPTS = 3;
const BATCH_SIZE = 25;

export class NotificationProcessorService {
  async processPendingEvents(): Promise<
    ServiceResult<{ processed: number; failed: number }>
  > {
    try {
      const db = getDb();
      const events = await db
        .select()
        .from(notificationEvents)
        .where(eq(notificationEvents.status, "pending"))
        .limit(BATCH_SIZE);

      let processed = 0;
      let failed = 0;

      for (const event of events) {
        await db
          .update(notificationEvents)
          .set({ status: "processing" })
          .where(eq(notificationEvents.id, event.id));

        const payload = event.payload as Record<string, unknown>;
        const email = payload.email ? String(payload.email) : null;

        if (email) {
          const result = await emailService.sendForEventType(
            event.eventType,
            email,
            payload,
          );

          if (result.sent) {
            await db
              .update(notificationEvents)
              .set({ status: "completed", processedAt: new Date() })
              .where(eq(notificationEvents.id, event.id));
            processed++;
          } else {
            await db
              .update(notificationEvents)
              .set({
                status: "failed",
                errorMessage: result.error ?? "Send failed",
              })
              .where(eq(notificationEvents.id, event.id));
            failed++;
          }
        } else {
          await db
            .update(notificationEvents)
            .set({ status: "completed", processedAt: new Date() })
            .where(eq(notificationEvents.id, event.id));
          processed++;
        }
      }

      logger.info("email", "Notification events processed", { processed, failed });
      return ok({ processed, failed });
    } catch (error) {
      return fail("NOTIFICATION_PROCESS_ERROR", "Failed to process events", error);
    }
  }

  async processPendingEmails(): Promise<
    ServiceResult<{ sent: number; failed: number; retried: number }>
  > {
    try {
      const db = getDb();
      const pending = await db
        .select()
        .from(notifications)
        .where(
          and(eq(notifications.channel, "email"), eq(notifications.status, "pending")),
        )
        .limit(BATCH_SIZE);

      let sent = 0;
      let failed = 0;
      let retried = 0;

      for (const row of pending) {
        if (!row.profileId) continue;

        const [profile] = await db
          .select({ email: profiles.email, fullName: profiles.fullName })
          .from(profiles)
          .where(eq(profiles.id, row.profileId))
          .limit(1);

        if (!profile) {
          await db
            .update(notifications)
            .set({ status: "failed" })
            .where(eq(notifications.id, row.id));
          failed++;
          continue;
        }

        const payload = (row.payload as Record<string, unknown>) ?? {};
        const attempts = Number(payload.emailAttempts ?? 0);

        const result = await emailService.sendForEventType(row.eventType, profile.email, {
          ...payload,
          name: profile.fullName,
          email: profile.email,
          title: row.title,
          body: row.body,
        });

        if (result.sent) {
          await db
            .update(notifications)
            .set({ status: "sent", sentAt: new Date() })
            .where(eq(notifications.id, row.id));
          sent++;
        } else if (attempts + 1 >= MAX_ATTEMPTS) {
          await db
            .update(notifications)
            .set({ status: "failed" })
            .where(eq(notifications.id, row.id));
          failed++;
        } else {
          await db
            .update(notifications)
            .set({
              payload: { ...payload, emailAttempts: attempts + 1, lastError: result.error },
            })
            .where(eq(notifications.id, row.id));
          retried++;
        }
      }

      logger.info("email", "Pending email notifications processed", { sent, failed, retried });
      return ok({ sent, failed, retried });
    } catch (error) {
      return fail("EMAIL_QUEUE_ERROR", "Failed to process email queue", error);
    }
  }

  async processAll(): Promise<ServiceResult<Record<string, number>>> {
    const events = await this.processPendingEvents();
    const emails = await this.processPendingEmails();

    if (!events.success) return events;
    if (!emails.success) return emails;

    return ok({
      eventsProcessed: events.data.processed,
      eventsFailed: events.data.failed,
      emailsSent: emails.data.sent,
      emailsFailed: emails.data.failed,
      emailsRetried: emails.data.retried,
    });
  }

  async retryFailed(limit = 20): Promise<ServiceResult<{ reset: number }>> {
    try {
      const db = getDb();
      const failed = await db
        .select({ id: notifications.id })
        .from(notifications)
        .where(
          and(eq(notifications.channel, "email"), eq(notifications.status, "failed")),
        )
        .limit(limit);

      if (!failed.length) return ok({ reset: 0 });

      await db
        .update(notifications)
        .set({ status: "pending" })
        .where(inArray(notifications.id, failed.map((f) => f.id)));

      return ok({ reset: failed.length });
    } catch (error) {
      return fail("RETRY_ERROR", "Failed to retry notifications", error);
    }
  }
}

export const notificationProcessorService = new NotificationProcessorService();
