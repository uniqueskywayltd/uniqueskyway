import { readFileSync } from "node:fs";
import { isNotNull } from "drizzle-orm";
import { getDb } from "@/db";
import { profiles } from "@/db/schema";
import { extractLegacyData } from "@/lib/migration/legacy-sql-parser";
import { resolveLegacySqlPath } from "@/lib/migration/constants";
import { createAdminClient } from "@/lib/supabase/admin";
import { emailService } from "./email.service";
import { fail, ok } from "./base";
import type { ServiceResult } from "./types";

export type LegacyPasswordSyncResult = {
  totalLegacyUsers: number;
  matchedProfiles: number;
  updated: number;
  resetEmailsSent: number;
  skippedEmpty: number;
  failed: Array<{ email: string; legacyUserId: number; reason: string }>;
};

function slugify(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
}

export function resolveAuthPasswordFromLegacy(legacyPassword: string | null | undefined): {
  password: string;
  fromLegacy: boolean;
} {
  const trimmed = legacyPassword?.trim() ?? "";
  if (!trimmed) {
    return { password: "", fromLegacy: false };
  }
  return { password: trimmed, fromLegacy: true };
}

export class LegacyPasswordSyncService {
  async syncFromLegacySql(
    sourcePath?: string,
  ): Promise<ServiceResult<LegacyPasswordSyncResult>> {
    const path = resolveLegacySqlPath(sourcePath);
    let sql: string;
    try {
      sql = readFileSync(path, "utf8");
    } catch (error) {
      return fail("LEGACY_SQL_MISSING", `Legacy SQL dump not found at ${path}`, error);
    }

    const extract = extractLegacyData(path, sql);
    const legacyByEmail = new Map(
      extract.users.map((user) => [user.email.trim().toLowerCase(), user]),
    );
    const legacyById = new Map(extract.users.map((user) => [user.uId, user]));

    const db = getDb();
    const migratedProfiles = await db
      .select({
        id: profiles.id,
        authUserId: profiles.authUserId,
        email: profiles.email,
        fullName: profiles.fullName,
        legacyUserId: profiles.legacyUserId,
      })
      .from(profiles)
      .where(isNotNull(profiles.legacyUserId));

    const admin = createAdminClient();
    const result: LegacyPasswordSyncResult = {
      totalLegacyUsers: extract.users.length,
      matchedProfiles: migratedProfiles.length,
      updated: 0,
      resetEmailsSent: 0,
      skippedEmpty: 0,
      failed: [],
    };

    for (const profile of migratedProfiles) {
      const legacy =
        (profile.legacyUserId ? legacyById.get(profile.legacyUserId) : undefined) ??
        legacyByEmail.get(profile.email.trim().toLowerCase());

      if (!legacy) {
        result.failed.push({
          email: profile.email,
          legacyUserId: profile.legacyUserId ?? 0,
          reason: "Legacy user row not found in SQL dump",
        });
        continue;
      }

      const { password, fromLegacy } = resolveAuthPasswordFromLegacy(legacy.pass);
      if (!fromLegacy || !password) {
        result.skippedEmpty += 1;
        continue;
      }

      const { error } = await admin.auth.admin.updateUserById(profile.authUserId, {
        password,
        user_metadata: {
          migrated: true,
          legacy_user_id: profile.legacyUserId,
          legacy_password_synced_at: new Date().toISOString(),
        },
      });

      if (!error) {
        result.updated += 1;
        continue;
      }

      const message = error.message ?? "Password update failed";
      if (message.toLowerCase().includes("password")) {
        const reset = await admin.auth.admin.generateLink({
          type: "recovery",
          email: profile.email,
        });
        if (!reset.error && reset.data.properties?.action_link) {
          await emailService.sendPasswordReset({
            to: profile.email,
            name: profile.fullName,
            resetUrl: reset.data.properties.action_link,
          });
          result.resetEmailsSent += 1;
          continue;
        }
      }

      result.failed.push({
        email: profile.email,
        legacyUserId: profile.legacyUserId ?? legacy.uId,
        reason: message,
      });
    }

    return ok(result);
  }
}

export const legacyPasswordSyncService = new LegacyPasswordSyncService();

export { slugify };
