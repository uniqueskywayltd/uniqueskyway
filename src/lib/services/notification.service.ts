import { and, count, desc, eq, isNull } from "drizzle-orm";
import { getDb } from "@/db";
import { notificationEvents, notifications, notificationPreferences, profiles } from "@/db/schema";
import type { NotificationChannel } from "@/types/domain";
import { guardDatabase } from "./infrastructure-guard";
import { fail, ok } from "./base";
import type { PaginatedResult, ServiceResult } from "./types";
import { logger } from "@/lib/logging/logger";

export type EmitNotificationInput = {
  eventType: string;
  payload: Record<string, unknown>;
  idempotencyKey: string;
};

export type CreateNotificationInput = {
  profileId?: string;
  adminUserId?: string;
  channel: NotificationChannel;
  eventType: string;
  title: string;
  body: string;
  payload?: Record<string, unknown>;
};

export type NotificationView = {
  id: string;
  eventType: string;
  title: string;
  body: string;
  status: string;
  readAt: Date | null;
  archivedAt: Date | null;
  createdAt: Date;
  payload: Record<string, unknown> | null;
};

export type NotificationFilters = {
  page?: number;
  pageSize?: number;
  unreadOnly?: boolean;
  includeArchived?: boolean;
  category?: string;
};

export class NotificationService {
  async emitEvent(
    input: EmitNotificationInput,
  ): Promise<ServiceResult<{ id: string }>> {
    try {
      const db = getDb();
      const [event] = await db
        .insert(notificationEvents)
        .values({
          eventType: input.eventType,
          payload: input.payload,
          idempotencyKey: input.idempotencyKey,
        })
        .returning({ id: notificationEvents.id });

      return ok({ id: event.id });
    } catch (error) {
      return fail("NOTIFICATION_EVENT_ERROR", "Failed to emit notification event", error);
    }
  }

  async createNotification(
    input: CreateNotificationInput,
  ): Promise<ServiceResult<{ id: string }>> {
    try {
      const db = getDb();
      const [notification] = await db
        .insert(notifications)
        .values({
          profileId: input.profileId,
          adminUserId: input.adminUserId,
          channel: input.channel,
          eventType: input.eventType,
          title: input.title,
          body: input.body,
          payload: input.payload,
          status: input.channel === "in_app" ? "sent" : "pending",
          sentAt: input.channel === "in_app" ? new Date() : undefined,
        })
        .returning({ id: notifications.id });

      return ok({ id: notification.id });
    } catch (error) {
      return fail("NOTIFICATION_CREATE_ERROR", "Failed to create notification", error);
    }
  }

  /**
   * Creates in-app notification and queues email delivery when preferences allow.
   * Email sends are processed by /api/cron/notifications.
   */
  async notifyProfile(input: {
    profileId: string;
    eventType: string;
    title: string;
    body: string;
    payload?: Record<string, unknown>;
    email?: boolean;
  }): Promise<ServiceResult<{ inAppId: string; emailQueued: boolean }>> {
    const inApp = await this.createNotification({
      profileId: input.profileId,
      channel: "in_app",
      eventType: input.eventType,
      title: input.title,
      body: input.body,
      payload: input.payload,
    });

    if (!inApp.success) return inApp;

    let emailQueued = false;

    if (input.email !== false) {
      try {
        const db = getDb();
        const [prefs] = await db
          .select()
          .from(notificationPreferences)
          .where(eq(notificationPreferences.profileId, input.profileId))
          .limit(1);

        const emailEnabled = prefs?.emailEnabled ?? true;

        if (emailEnabled) {
          await this.createNotification({
            profileId: input.profileId,
            channel: "email",
            eventType: input.eventType,
            title: input.title,
            body: input.body,
            payload: { ...input.payload, emailAttempts: 0 },
          });
          emailQueued = true;
        }
      } catch (error) {
        logger.warn("email", "Failed to queue email notification", {
          profileId: input.profileId,
          eventType: input.eventType,
          error: String(error),
        });
      }
    }

    return ok({ inAppId: inApp.data.id, emailQueued });
  }

  async listForProfile(
    profileId: string,
    filters: NotificationFilters = {},
  ): Promise<ServiceResult<PaginatedResult<NotificationView>>> {
    const infra = guardDatabase<PaginatedResult<NotificationView>>();
    if (infra) return infra;

    try {
      const db = getDb();
      const page = filters.page ?? 1;
      const pageSize = Math.min(filters.pageSize ?? 20, 50);
      const offset = (page - 1) * pageSize;

      const conditions = [
        eq(notifications.profileId, profileId),
        eq(notifications.channel, "in_app"),
      ];

      if (!filters.includeArchived) {
        conditions.push(isNull(notifications.archivedAt));
      }

      if (filters.unreadOnly) {
        conditions.push(isNull(notifications.readAt));
      }

      if (filters.category && filters.category !== "all") {
        conditions.push(eq(notifications.eventType, filters.category));
      }

      const whereClause = and(...conditions);

      const [totalRow] = await db
        .select({ count: count() })
        .from(notifications)
        .where(whereClause);

      const rows = await db
        .select()
        .from(notifications)
        .where(whereClause)
        .orderBy(desc(notifications.createdAt))
        .limit(pageSize)
        .offset(offset);

      const items: NotificationView[] = rows.map((n) => ({
        id: n.id,
        eventType: n.eventType,
        title: n.title,
        body: n.body,
        status: n.status,
        readAt: n.readAt,
        archivedAt: n.archivedAt,
        createdAt: n.createdAt,
        payload: (n.payload as Record<string, unknown>) ?? null,
      }));

      const total = totalRow?.count ?? 0;

      return ok({
        items,
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      });
    } catch (error) {
      return fail("NOTIFICATION_LIST_ERROR", "Failed to load notifications", error);
    }
  }

  async markRead(profileId: string, notificationId: string): Promise<ServiceResult<void>> {
    try {
      const db = getDb();
      await db
        .update(notifications)
        .set({ readAt: new Date(), status: "read" })
        .where(and(eq(notifications.id, notificationId), eq(notifications.profileId, profileId)));
      return ok(undefined);
    } catch (error) {
      return fail("NOTIFICATION_READ_ERROR", "Failed to mark notification read", error);
    }
  }

  async markAllRead(profileId: string): Promise<ServiceResult<void>> {
    try {
      const db = getDb();
      await db
        .update(notifications)
        .set({ readAt: new Date(), status: "read" })
        .where(and(eq(notifications.profileId, profileId), isNull(notifications.readAt)));
      return ok(undefined);
    } catch (error) {
      return fail("NOTIFICATION_READ_ERROR", "Failed to mark all read", error);
    }
  }

  async archive(profileId: string, notificationId: string): Promise<ServiceResult<void>> {
    try {
      const db = getDb();
      await db
        .update(notifications)
        .set({ archivedAt: new Date() })
        .where(and(eq(notifications.id, notificationId), eq(notifications.profileId, profileId)));
      return ok(undefined);
    } catch (error) {
      return fail("NOTIFICATION_ARCHIVE_ERROR", "Failed to archive notification", error);
    }
  }

  async getUnreadCount(profileId: string): Promise<ServiceResult<number>> {
    try {
      const db = getDb();
      const [row] = await db
        .select({ count: count() })
        .from(notifications)
        .where(
          and(
            eq(notifications.profileId, profileId),
            eq(notifications.channel, "in_app"),
            isNull(notifications.readAt),
            isNull(notifications.archivedAt),
          ),
        );
      return ok(row?.count ?? 0);
    } catch (error) {
      return fail("NOTIFICATION_COUNT_ERROR", "Failed to count notifications", error);
    }
  }

  async broadcastInApp(input: {
    title: string;
    body: string;
    profileIds?: string[];
    adminUserId: string;
  }): Promise<ServiceResult<{ sent: number }>> {
    const infra = guardDatabase<{ sent: number }>();
    if (infra) return infra;

    try {
      const db = getDb();
      let targetIds = input.profileIds ?? [];

      if (!targetIds.length) {
        const rows = await db
          .select({ id: profiles.id })
          .from(profiles)
          .where(isNull(profiles.deletedAt));
        targetIds = rows.map((r) => r.id);
      }

      let sent = 0;
      for (const profileId of targetIds) {
        await this.createNotification({
          profileId,
          channel: "in_app",
          eventType: "admin.broadcast",
          title: input.title,
          body: input.body,
          payload: { adminUserId: input.adminUserId },
        });
        sent++;
      }

      return ok({ sent });
    } catch (error) {
      return fail("BROADCAST_ERROR", "Failed to broadcast notification", error);
    }
  }

  async listAdminDeliveries(page = 1, pageSize = 30): Promise<
    ServiceResult<PaginatedResult<NotificationView & { profileId: string | null }>>
  > {
    const infra = guardDatabase<PaginatedResult<NotificationView & { profileId: string | null }>>();
    if (infra) return infra;

    try {
      const db = getDb();
      const offset = (page - 1) * pageSize;

      const [totalRow] = await db.select({ count: count() }).from(notifications);

      const rows = await db
        .select()
        .from(notifications)
        .orderBy(desc(notifications.createdAt))
        .limit(pageSize)
        .offset(offset);

      const items = rows.map((n) => ({
        id: n.id,
        profileId: n.profileId,
        eventType: n.eventType,
        title: n.title,
        body: n.body,
        status: n.status,
        readAt: n.readAt,
        archivedAt: n.archivedAt,
        createdAt: n.createdAt,
        payload: (n.payload as Record<string, unknown>) ?? null,
      }));

      const total = totalRow?.count ?? 0;
      return ok({ items, page, pageSize, total, totalPages: Math.ceil(total / pageSize) });
    } catch (error) {
      return fail("NOTIFICATION_ADMIN_LIST_ERROR", "Failed to list notifications", error);
    }
  }
}

export const notificationService = new NotificationService();
