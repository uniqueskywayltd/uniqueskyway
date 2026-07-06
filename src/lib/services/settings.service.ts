import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { systemSettings } from "@/db/schema";
import type { SystemSettingKey } from "@/lib/constants/system-settings";
import { guardDatabase } from "./infrastructure-guard";
import { fail, ok } from "./base";
import type { ServiceResult } from "./types";

/**
 * System settings service — configurable platform values.
 * Business rules live here, not in application code.
 */
export class SettingsService {
  async get<T = unknown>(key: SystemSettingKey): Promise<T | null> {
    try {
      const db = getDb();
      const [setting] = await db
        .select({ value: systemSettings.value })
        .from(systemSettings)
        .where(eq(systemSettings.key, key))
        .limit(1);

      return (setting?.value as T) ?? null;
    } catch {
      return null;
    }
  }

  async getPublic(): Promise<ServiceResult<Record<string, unknown>>> {
    try {
      const db = getDb();
      const settings = await db
        .select({ key: systemSettings.key, value: systemSettings.value })
        .from(systemSettings)
        .where(eq(systemSettings.isPublic, true));

      const result: Record<string, unknown> = {};
      for (const s of settings) {
        result[s.key] = s.value;
      }
      return ok(result);
    } catch (error) {
      return fail("SETTINGS_ERROR", "Failed to load public settings", error);
    }
  }

  async getString(key: SystemSettingKey, fallback = ""): Promise<string> {
    const value = await this.get<string>(key);
    return value ?? fallback;
  }

  async listAll(): Promise<
    ServiceResult<
      Array<{
        key: string;
        value: unknown;
        description: string | null;
        isPublic: boolean;
        updatedAt: Date;
      }>
    >
  > {
    const infra = guardDatabase<
      Array<{
        key: string;
        value: unknown;
        description: string | null;
        isPublic: boolean;
        updatedAt: Date;
      }>
    >();
    if (infra) return infra;

    try {
      const db = getDb();
      const rows = await db.select().from(systemSettings);
      return ok(
        rows.map((r) => ({
          key: r.key,
          value: r.value,
          description: r.description,
          isPublic: r.isPublic,
          updatedAt: r.updatedAt,
        })),
      );
    } catch (error) {
      return fail("SETTINGS_LIST_ERROR", "Failed to load settings", error);
    }
  }

  async update(
    key: SystemSettingKey,
    value: unknown,
    adminUserId: string,
  ): Promise<ServiceResult<void>> {
    try {
      const db = getDb();
      await db
        .update(systemSettings)
        .set({ value, updatedByAdminId: adminUserId, updatedAt: new Date() })
        .where(eq(systemSettings.key, key));
      return ok(undefined);
    } catch (error) {
      return fail("SETTINGS_UPDATE_ERROR", "Failed to update setting", error);
    }
  }
}

export const settingsService = new SettingsService();
