import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { userSessions } from "@/db/schema";
import {
  AUTH_ROUTES,
  DASHBOARD_PREFIX,
  GENERIC_AUTH_ERROR,
  GENERIC_REGISTER_ERROR,
} from "@/lib/auth/constants";
import { parseUserAgent } from "@/lib/auth/user-agent";
import {
  normalizeEmail,
  normalizeUsername,
  type LoginInput,
  type RegisterInput,
} from "@/lib/auth/validation";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { FEATURE_FLAGS } from "@/lib/constants/feature-flags";
import { isStorageConfigured, resolveAppUrl } from "@/lib/env";
import { auditService } from "./audit.service";
import { authLockoutService } from "./auth-lockout.service";
import { emailService } from "./email.service";
import { featureFlagService } from "./feature-flags.service";
import { profileService } from "./profile.service";
import { sessionService } from "./session.service";
import { fail, ok } from "./base";
import type { ActorContext, ServiceResult } from "./types";

const appUrl = resolveAppUrl;

export type RegisterAvatarInput = {
  buffer: Buffer;
  contentType: string;
  ext: string;
};

export class AuthService {
  private async assertRegistrationAllowed(): Promise<ServiceResult<void>> {
    if (await featureFlagService.isMaintenanceMode()) {
      return fail("MAINTENANCE", "Platform is under maintenance");
    }
    return featureFlagService.requireEnabled(FEATURE_FLAGS.REGISTRATIONS_ENABLED);
  }

  private async assertLoginAllowed(): Promise<ServiceResult<void>> {
    if (await featureFlagService.isMaintenanceMode()) {
      return fail("MAINTENANCE", "Platform is under maintenance");
    }
    return ok(undefined);
  }

  async register(
    input: RegisterInput,
    actor?: ActorContext,
    avatar?: RegisterAvatarInput,
  ): Promise<ServiceResult<{ checkEmail: true }>> {
    const allowed = await this.assertRegistrationAllowed();
    if (!allowed.success) return allowed;

    const email = normalizeEmail(input.email);
    const username = normalizeUsername(input.username);

    const existingEmail = await profileService.findByEmail(email);
    if (existingEmail) {
      return fail("REGISTER_FAILED", GENERIC_REGISTER_ERROR);
    }

    const existingUsername = await profileService.findByUsername(username);
    if (existingUsername) {
      return fail("REGISTER_FAILED", GENERIC_REGISTER_ERROR);
    }

    if (input.referralCode) {
      const referrer = await profileService.resolveReferrer(input.referralCode);
      if (!referrer) {
        return fail("INVALID_REFERRAL", "Invalid referral code");
      }
      if (normalizeUsername(referrer.username) === username) {
        return fail("SELF_REFERRAL", "You cannot refer yourself");
      }
    }

    const admin = createAdminClient();
    let authUserId: string | null = null;

    try {
      const { data: authData, error: authError } =
        await admin.auth.admin.createUser({
          email,
          password: input.password,
          email_confirm: false,
          user_metadata: {
            full_name: input.fullName.trim(),
            username,
          },
        });

      if (authError || !authData.user) {
        return fail("REGISTER_FAILED", GENERIC_REGISTER_ERROR, authError);
      }

      authUserId = authData.user.id;

      const profileResult = await profileService.createProfileBundle({
        authUserId,
        email,
        fullName: input.fullName,
        username,
        referralCode: input.referralCode,
      });

      if (!profileResult.success) {
        await admin.auth.admin.deleteUser(authUserId);
        return fail("REGISTER_FAILED", GENERIC_REGISTER_ERROR, profileResult.error);
      }

      if (avatar && isStorageConfigured()) {
        await profileService.uploadAvatar(
          authUserId,
          profileResult.data.profileId,
          avatar,
        );
      }

      const { data: linkData, error: linkError } =
        await admin.auth.admin.generateLink({
          type: "signup",
          email,
          password: input.password,
          options: {
            redirectTo: `${appUrl()}${AUTH_ROUTES.callback}?type=signup`,
          },
        });

      if (linkError || !linkData.properties?.action_link) {
        await admin.auth.admin.deleteUser(authUserId);
        return fail("REGISTER_FAILED", GENERIC_REGISTER_ERROR, linkError);
      }

      await auditService.log({
        action: "create",
        entityType: "profile",
        entityId: profileResult.data.profileId,
        actor: { ...actor, profileId: profileResult.data.profileId },
        afterState: { email, username },
      });

      await sessionService.recordLogin({
        profileId: profileResult.data.profileId,
        success: true,
        actor,
      });

      await emailService.sendWelcome({
        to: email,
        name: input.fullName.trim(),
        verifyUrl: linkData.properties.action_link,
      });

      return ok({ checkEmail: true });
    } catch (error) {
      if (authUserId) {
        await createAdminClient().auth.admin.deleteUser(authUserId).catch(() => {});
      }
      return fail("REGISTER_FAILED", GENERIC_REGISTER_ERROR, error);
    }
  }

  async login(
    input: LoginInput,
    actor?: ActorContext,
  ): Promise<ServiceResult<{ redirectTo: string }>> {
    const allowed = await this.assertLoginAllowed();
    if (!allowed.success) return allowed;

    const email = normalizeEmail(input.email);
    const lockout = await authLockoutService.getStatus(email);

    if (lockout.locked) {
      await sessionService.recordLogin({
        success: false,
        failureReason: "account_locked",
        actor,
      });
      return fail("ACCOUNT_LOCKED", GENERIC_AUTH_ERROR);
    }

    const supabase = await createClient();
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password: input.password,
    });

    if (error || !data.user) {
      await authLockoutService.recordFailure(email);
      await sessionService.recordLogin({
        success: false,
        failureReason: "invalid_credentials",
        actor,
      });
      return fail("LOGIN_FAILED", GENERIC_AUTH_ERROR);
    }

    await authLockoutService.clear(email);

    const profile = await profileService.findByAuthUserId(data.user.id);

    if (!profile || profile.deletedAt) {
      await supabase.auth.signOut();
      return fail("LOGIN_FAILED", GENERIC_AUTH_ERROR);
    }

    if (profile.status === "suspended") {
      await supabase.auth.signOut();
      await sessionService.recordLogin({
        profileId: profile.id,
        success: false,
        failureReason: "suspended",
        actor,
      });
      return fail("LOGIN_FAILED", GENERIC_AUTH_ERROR);
    }

    const { browser, os } = parseUserAgent(actor?.userAgent);

    const db = getDb();
    const existingSessions = await db
      .select({ id: userSessions.id, userAgent: userSessions.userAgent })
      .from(userSessions)
      .where(eq(userSessions.profileId, profile.id));

    const isNewDevice =
      existingSessions.length === 0 ||
      !existingSessions.some((s) => s.userAgent === actor?.userAgent);

    await sessionService.upsertSession({
      profileId: profile.id,
      authSessionId: data.session?.access_token?.slice(0, 32),
      actor: { ...actor, profileId: profile.id },
    });

    await sessionService.recordLogin({
      profileId: profile.id,
      success: true,
      actor: { ...actor, profileId: profile.id },
    });

    await auditService.log({
      action: "login",
      entityType: "profile",
      entityId: profile.id,
      actor: { ...actor, profileId: profile.id },
    });

    const loginTime = new Date().toLocaleString("en-US", {
      dateStyle: "medium",
      timeStyle: "short",
    });

    const emailParams = {
      to: profile.email,
      name: profile.fullName,
      ipAddress: actor?.ipAddress ?? "Unknown",
      browser,
      os,
      loginTime,
    };

    if (isNewDevice) {
      await emailService.sendNewDeviceLogin({
        ...emailParams,
        sessionsUrl: `${appUrl()}${DASHBOARD_PREFIX}/security`,
      });
    } else {
      await emailService.sendLoginAlert(emailParams);
    }

    const emailVerified =
      profile.emailVerified || Boolean(data.user.email_confirmed_at);

    const redirectTo = emailVerified
      ? `${DASHBOARD_PREFIX}`
      : AUTH_ROUTES.verifyEmail;

    return ok({ redirectTo });
  }

  async logout(actor?: ActorContext): Promise<ServiceResult<void>> {
    const supabase = await createClient();
    const { data } = await supabase.auth.getUser();

    if (data.user) {
      const profile = await profileService.findByAuthUserId(data.user.id);
      if (profile) {
        await auditService.log({
          action: "logout",
          entityType: "profile",
          entityId: profile.id,
          actor: { ...actor, profileId: profile.id },
        });
      }
    }

    await supabase.auth.signOut();
    return ok(undefined);
  }

  async forgotPassword(
    email: string,
    actor?: ActorContext,
  ): Promise<ServiceResult<{ sent: true }>> {
    const normalized = normalizeEmail(email);
    const profile = await profileService.findByEmail(normalized);

    // Always return success — never reveal if email exists
    if (!profile) {
      return ok({ sent: true });
    }

    const admin = createAdminClient();
    const { data, error } = await admin.auth.admin.generateLink({
      type: "recovery",
      email: normalized,
      options: {
        redirectTo: `${appUrl()}${AUTH_ROUTES.resetPassword}`,
      },
    });

    if (!error && data.properties?.action_link) {
      await emailService.sendPasswordReset({
        to: normalized,
        name: profile.fullName,
        resetUrl: data.properties.action_link,
      });
    }

    await auditService.log({
      action: "update",
      entityType: "auth",
      entityId: profile.id,
      actor,
      metadata: { action: "password_reset_requested" },
    });

    return ok({ sent: true });
  }

  async resendVerification(email: string): Promise<ServiceResult<{ sent: true }>> {
    const normalized = normalizeEmail(email);
    const profile = await profileService.findByEmail(normalized);

    if (!profile || profile.emailVerified) {
      return ok({ sent: true });
    }

    const admin = createAdminClient();
    const { data, error } = await admin.auth.admin.generateLink({
      type: "magiclink",
      email: normalized,
      options: {
        redirectTo: `${appUrl()}${AUTH_ROUTES.callback}?type=verify`,
      },
    });

    if (!error && data.properties?.action_link) {
      await emailService.sendVerification({
        to: normalized,
        name: profile.fullName,
        verifyUrl: data.properties.action_link,
      });
    }

    return ok({ sent: true });
  }

  async changePassword(
    currentPassword: string,
    newPassword: string,
    actor?: ActorContext,
  ): Promise<ServiceResult<void>> {
    const supabase = await createClient();
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user?.email) {
      return fail("UNAUTHORIZED", "Not authenticated");
    }

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: userData.user.email,
      password: currentPassword,
    });

    if (signInError) {
      return fail("INVALID_PASSWORD", "Current password is incorrect");
    }

    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) {
      return fail("PASSWORD_UPDATE_FAILED", "Unable to update password");
    }

    const profile = await profileService.findByAuthUserId(userData.user.id);
    if (profile) {
      await auditService.log({
        action: "update",
        entityType: "auth",
        entityId: profile.id,
        actor: { ...actor, profileId: profile.id },
        metadata: { action: "password_changed" },
      });

      await emailService.sendPasswordChanged({
        to: profile.email,
        name: profile.fullName,
        changedAt: new Date().toLocaleString("en-US", {
          dateStyle: "medium",
          timeStyle: "short",
        }),
      });
    }

    return ok(undefined);
  }

  async resetPassword(newPassword: string): Promise<ServiceResult<void>> {
    const supabase = await createClient();
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) {
      return fail("UNAUTHORIZED", "Invalid or expired reset link");
    }

    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) {
      return fail("PASSWORD_RESET_FAILED", "Unable to reset password");
    }

    const profile = await profileService.findByAuthUserId(userData.user.id);
    if (profile) {
      await profileService.markEmailVerified(profile.id);
      await emailService.sendPasswordChanged({
        to: profile.email,
        name: profile.fullName,
        changedAt: new Date().toLocaleString("en-US", {
          dateStyle: "medium",
          timeStyle: "short",
        }),
      });
    }

    return ok(undefined);
  }
}

export const authService = new AuthService();
