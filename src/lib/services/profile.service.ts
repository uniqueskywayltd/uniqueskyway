import { and, eq, isNull, or } from "drizzle-orm";
import { getDb } from "@/db";
import {
  ledgerAccounts,
  notificationPreferences,
  profilePreferences,
  profiles,
  referralRelationships,
} from "@/db/schema";
import {
  generateReferralCode,
  normalizeEmail,
  normalizeUsername,
} from "@/lib/auth/validation";
import { createAdminClient } from "@/lib/supabase/admin";
import { isStorageConfigured } from "@/lib/env";
import { fail, ok } from "./base";
import type { ServiceResult } from "./types";

export type CreateProfileInput = {
  authUserId: string;
  email: string;
  fullName: string;
  username: string;
  referralCode?: string;
};

export class ProfileService {
  async findByAuthUserId(authUserId: string) {
    const db = getDb();
    const [profile] = await db
      .select()
      .from(profiles)
      .where(and(eq(profiles.authUserId, authUserId), isNull(profiles.deletedAt)))
      .limit(1);
    return profile ?? null;
  }

  async findByEmail(email: string) {
    const db = getDb();
    const [profile] = await db
      .select()
      .from(profiles)
      .where(
        and(eq(profiles.email, normalizeEmail(email)), isNull(profiles.deletedAt)),
      )
      .limit(1);
    return profile ?? null;
  }

  async findByUsername(username: string) {
    const db = getDb();
    const normalized = normalizeUsername(username);
    const [profile] = await db
      .select()
      .from(profiles)
      .where(
        and(eq(profiles.username, normalized), isNull(profiles.deletedAt)),
      )
      .limit(1);
    return profile ?? null;
  }

  async findByReferralCode(code: string) {
    const db = getDb();
    const [profile] = await db
      .select()
      .from(profiles)
      .where(
        and(
          or(
            eq(profiles.referralCode, code.toUpperCase()),
            eq(profiles.username, normalizeUsername(code)),
          ),
          isNull(profiles.deletedAt),
        ),
      )
      .limit(1);
    return profile ?? null;
  }

  async resolveReferrer(referralCode?: string) {
    if (!referralCode?.trim()) return null;
    return this.findByReferralCode(referralCode.trim());
  }

  async createProfileBundle(
    input: CreateProfileInput,
  ): Promise<ServiceResult<{ profileId: string }>> {
    const db = getDb();
    const email = normalizeEmail(input.email);
    const username = normalizeUsername(input.username);

    try {
      const referrer = await this.resolveReferrer(input.referralCode);

      const result = await db.transaction(async (tx) => {
        let referralCode = generateReferralCode(username);
        let attempts = 0;
        while (attempts < 5) {
          const existing = await tx
            .select({ id: profiles.id })
            .from(profiles)
            .where(eq(profiles.referralCode, referralCode))
            .limit(1);
          if (!existing.length) break;
          referralCode = generateReferralCode(username);
          attempts++;
        }

        const [profile] = await tx
          .insert(profiles)
          .values({
            authUserId: input.authUserId,
            email,
            fullName: input.fullName.trim(),
            username,
            referralCode,
            referredByProfileId: referrer?.id,
            status: "pending_verification",
            emailVerified: false,
            avatarPath: null,
          })
          .returning({ id: profiles.id });

        await tx.insert(profilePreferences).values({ profileId: profile.id });
        await tx.insert(notificationPreferences).values({ profileId: profile.id });

        await tx.insert(ledgerAccounts).values({
          profileId: profile.id,
          accountType: "available",
          currency: "USD",
          label: "Available Balance",
        });

        if (referrer) {
          await tx.insert(referralRelationships).values({
            referrerProfileId: referrer.id,
            referredProfileId: profile.id,
            referralCodeUsed: input.referralCode!.trim(),
          });
        }

        return profile;
      });

      return ok({ profileId: result.id });
    } catch (error) {
      return fail("PROFILE_CREATE_ERROR", "Failed to create profile", error);
    }
  }

  async markEmailVerified(profileId: string): Promise<void> {
    const db = getDb();
    await db
      .update(profiles)
      .set({ emailVerified: true, status: "active" })
      .where(eq(profiles.id, profileId));
  }

  async getFullProfile(profileId: string) {
    const db = getDb();
    const [profile] = await db
      .select()
      .from(profiles)
      .where(and(eq(profiles.id, profileId), isNull(profiles.deletedAt)))
      .limit(1);

    if (!profile) return null;

    const [prefs] = await db
      .select()
      .from(profilePreferences)
      .where(eq(profilePreferences.profileId, profileId))
      .limit(1);

    const [notifPrefs] = await db
      .select()
      .from(notificationPreferences)
      .where(eq(notificationPreferences.profileId, profileId))
      .limit(1);

    return { profile, preferences: prefs, notificationPreferences: notifPrefs };
  }

  async updateProfile(
    profileId: string,
    data: {
      fullName?: string;
      phone?: string;
      country?: string;
      addressLine1?: string;
      addressLine2?: string;
      city?: string;
      state?: string;
      postalCode?: string;
      timezone?: string;
    },
  ): Promise<ServiceResult<void>> {
    try {
      const db = getDb();
      await db.update(profiles).set(data).where(eq(profiles.id, profileId));
      return ok(undefined);
    } catch (error) {
      return fail("PROFILE_UPDATE_ERROR", "Failed to update profile", error);
    }
  }

  async updatePreferences(
    profileId: string,
    data: {
      locale?: string;
      theme?: string;
      timezone?: string;
      marketingEmails?: boolean;
      preferredCurrency?: string;
    },
  ): Promise<ServiceResult<void>> {
    try {
      const db = getDb();
      await db
        .update(profilePreferences)
        .set(data)
        .where(eq(profilePreferences.profileId, profileId));
      return ok(undefined);
    } catch (error) {
      return fail("PREFERENCES_UPDATE_ERROR", "Failed to update preferences", error);
    }
  }

  async updateNotificationPreferences(
    profileId: string,
    data: Partial<{
      emailEnabled: boolean;
      inAppEnabled: boolean;
      loginAlerts: boolean;
      securityAlerts: boolean;
      investmentUpdates: boolean;
      referralUpdates: boolean;
    }>,
  ): Promise<ServiceResult<void>> {
    try {
      const db = getDb();
      await db
        .update(notificationPreferences)
        .set(data)
        .where(eq(notificationPreferences.profileId, profileId));
      return ok(undefined);
    } catch (error) {
      return fail("NOTIF_PREFS_ERROR", "Failed to update notification preferences", error);
    }
  }

  async updateAvatarPath(
    profileId: string,
    avatarPath: string,
  ): Promise<ServiceResult<void>> {
    try {
      const db = getDb();
      await db.update(profiles).set({ avatarPath }).where(eq(profiles.id, profileId));
      return ok(undefined);
    } catch (error) {
      return fail("AVATAR_UPDATE_ERROR", "Failed to update avatar", error);
    }
  }

  async uploadAvatar(
    authUserId: string,
    profileId: string,
    file: { buffer: Buffer; contentType: string; ext: string },
  ): Promise<ServiceResult<string>> {
    if (!isStorageConfigured()) {
      return fail("INFRASTRUCTURE_NOT_CONFIGURED", "Storage not configured");
    }

    const path = `${authUserId}/avatar.${file.ext}`;
    const supabase = createAdminClient();
    const { error } = await supabase.storage.from("avatars").upload(path, file.buffer, {
      upsert: true,
      contentType: file.contentType,
    });

    if (error) {
      return fail("AVATAR_UPLOAD_ERROR", "Failed to upload avatar", error);
    }

    const updated = await this.updateAvatarPath(profileId, path);
    if (!updated.success) return fail(updated.error.code, updated.error.message, updated.error.details);

    return ok(path);
  }
}

export const profileService = new ProfileService();
