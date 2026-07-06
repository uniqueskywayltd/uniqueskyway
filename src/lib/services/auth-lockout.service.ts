import { eq, sql } from "drizzle-orm";
import { getDb } from "@/db";
import { authLockouts } from "@/db/schema";
import {
  LOCKOUT_DURATION_MS,
  LOCKOUT_MAX_ATTEMPTS,
} from "@/lib/auth/constants";
import { normalizeEmail } from "@/lib/auth/validation";

export type LockoutStatus = {
  locked: boolean;
  remainingAttempts: number;
  lockedUntil: Date | null;
};

export class AuthLockoutService {
  private identifier(email: string): string {
    return normalizeEmail(email);
  }

  async getStatus(email: string): Promise<LockoutStatus> {
    const db = getDb();
    const id = this.identifier(email);

    const [record] = await db
      .select()
      .from(authLockouts)
      .where(eq(authLockouts.identifier, id))
      .limit(1);

    if (!record) {
      return {
        locked: false,
        remainingAttempts: LOCKOUT_MAX_ATTEMPTS,
        lockedUntil: null,
      };
    }

    if (record.lockedUntil && record.lockedUntil > new Date()) {
      return {
        locked: true,
        remainingAttempts: 0,
        lockedUntil: record.lockedUntil,
      };
    }

    if (record.lockedUntil && record.lockedUntil <= new Date()) {
      await db
        .update(authLockouts)
        .set({ attemptCount: 0, lockedUntil: null })
        .where(eq(authLockouts.identifier, id));
    }

    return {
      locked: false,
      remainingAttempts: Math.max(
        0,
        LOCKOUT_MAX_ATTEMPTS - (record.attemptCount ?? 0),
      ),
      lockedUntil: null,
    };
  }

  async recordFailure(email: string): Promise<LockoutStatus> {
    const db = getDb();
    const id = this.identifier(email);
    const now = new Date();

    await db
      .insert(authLockouts)
      .values({
        identifier: id,
        attemptCount: 1,
        lastAttemptAt: now,
      })
      .onConflictDoUpdate({
        target: authLockouts.identifier,
        set: {
          attemptCount: sql`${authLockouts.attemptCount} + 1`,
          lastAttemptAt: now,
        },
      });

    const [updated] = await db
      .select()
      .from(authLockouts)
      .where(eq(authLockouts.identifier, id))
      .limit(1);

    const attempts = updated?.attemptCount ?? 1;

    if (attempts >= LOCKOUT_MAX_ATTEMPTS) {
      const lockedUntil = new Date(now.getTime() + LOCKOUT_DURATION_MS);
      await db
        .update(authLockouts)
        .set({ lockedUntil })
        .where(eq(authLockouts.identifier, id));

      return { locked: true, remainingAttempts: 0, lockedUntil };
    }

    return {
      locked: false,
      remainingAttempts: LOCKOUT_MAX_ATTEMPTS - attempts,
      lockedUntil: null,
    };
  }

  async clear(email: string): Promise<void> {
    const db = getDb();
    await db
      .delete(authLockouts)
      .where(eq(authLockouts.identifier, this.identifier(email)));
  }

  async lock(email: string, lockedUntil: Date): Promise<void> {
    const db = getDb();
    const id = this.identifier(email);
    await db
      .insert(authLockouts)
      .values({
        identifier: id,
        attemptCount: LOCKOUT_MAX_ATTEMPTS,
        lockedUntil,
        lastAttemptAt: new Date(),
      })
      .onConflictDoUpdate({
        target: authLockouts.identifier,
        set: {
          attemptCount: LOCKOUT_MAX_ATTEMPTS,
          lockedUntil,
          lastAttemptAt: new Date(),
        },
      });
  }
}

export const authLockoutService = new AuthLockoutService();
