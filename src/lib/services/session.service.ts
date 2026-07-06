import { and, desc, eq, isNull } from "drizzle-orm";
import { getDb } from "@/db";
import { loginHistory, userSessions } from "@/db/schema";
import { parseUserAgent } from "@/lib/auth/user-agent";
import { deriveDeviceLabel } from "@/lib/security/request-context";
import { fail, ok } from "./base";
import type { ActorContext, ServiceResult } from "./types";

export type RecordLoginInput = {
  profileId?: string;
  adminUserId?: string;
  success: boolean;
  failureReason?: string;
  actor?: ActorContext;
};

export type RecordSessionInput = {
  profileId?: string;
  adminUserId?: string;
  authSessionId?: string;
  actor?: ActorContext;
};

export class SessionService {
  async recordLogin(input: RecordLoginInput): Promise<ServiceResult<{ id: string }>> {
    try {
      const db = getDb();
      const [record] = await db
        .insert(loginHistory)
        .values({
          profileId: input.profileId,
          adminUserId: input.adminUserId,
          success: input.success,
          failureReason: input.failureReason,
          ipAddress: input.actor?.ipAddress,
          userAgent: input.actor?.userAgent,
          deviceFingerprint: input.actor?.deviceFingerprint,
        })
        .returning({ id: loginHistory.id });

      return ok({ id: record.id });
    } catch (error) {
      return fail("LOGIN_HISTORY_ERROR", "Failed to record login event", error);
    }
  }

  async upsertSession(input: RecordSessionInput): Promise<ServiceResult<{ id: string }>> {
    try {
      const db = getDb();
      const parsed = parseUserAgent(input.actor?.userAgent ?? null);
      const deviceLabel =
        deriveDeviceLabel(input.actor?.userAgent ?? null) ?? parsed.deviceLabel;

      if (input.profileId) {
        await db
          .update(userSessions)
          .set({ isCurrent: false })
          .where(
            and(
              eq(userSessions.profileId, input.profileId),
              isNull(userSessions.revokedAt),
            ),
          );
      }

      if (input.authSessionId) {
        const [existing] = await db
          .select({ id: userSessions.id })
          .from(userSessions)
          .where(eq(userSessions.authSessionId, input.authSessionId))
          .limit(1);

        if (existing) {
          await db
            .update(userSessions)
            .set({
              lastActiveAt: new Date(),
              ipAddress: input.actor?.ipAddress,
              userAgent: input.actor?.userAgent,
              deviceFingerprint: input.actor?.deviceFingerprint,
              deviceLabel,
              browser: parsed.browser,
              os: parsed.os,
              isCurrent: true,
            })
            .where(eq(userSessions.id, existing.id));

          return ok({ id: existing.id });
        }
      }

      const [session] = await db
        .insert(userSessions)
        .values({
          profileId: input.profileId,
          adminUserId: input.adminUserId,
          authSessionId: input.authSessionId,
          ipAddress: input.actor?.ipAddress,
          userAgent: input.actor?.userAgent,
          deviceFingerprint: input.actor?.deviceFingerprint,
          deviceLabel,
          browser: parsed.browser,
          os: parsed.os,
          isCurrent: true,
          lastActiveAt: new Date(),
        })
        .returning({ id: userSessions.id });

      return ok({ id: session.id });
    } catch (error) {
      return fail("SESSION_TRACK_ERROR", "Failed to track session", error);
    }
  }

  async revokeSession(sessionId: string): Promise<ServiceResult<void>> {
    try {
      const db = getDb();
      await db
        .update(userSessions)
        .set({ revokedAt: new Date(), isCurrent: false })
        .where(eq(userSessions.id, sessionId));

      return ok(undefined);
    } catch (error) {
      return fail("SESSION_REVOKE_ERROR", "Failed to revoke session", error);
    }
  }

  async listSessions(profileId: string) {
    const db = getDb();
    return db
      .select()
      .from(userSessions)
      .where(
        and(eq(userSessions.profileId, profileId), isNull(userSessions.revokedAt)),
      )
      .orderBy(desc(userSessions.lastActiveAt));
  }
}

export const sessionService = new SessionService();
