import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { profiles } from "@/db/schema";
import { DEFAULT_LEGACY_IMAGES_PATH } from "@/lib/migration/constants";
import type { TransformedUser } from "@/lib/migration/types";
import { createAdminClient } from "@/lib/supabase/admin";

const MIME: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".gif": "image/gif",
  ".webp": "image/webp",
};

export class MigrationImageService {
  async migrateImages(
    runId: string,
    users: TransformedUser[],
    profileMap: Map<string, string>,
  ): Promise<{ loaded: number; failed: number; failures: string[] }> {
    let loaded = 0;
    let failed = 0;
    const failures: string[] = [];
    const admin = createAdminClient();
    const db = getDb();

    for (const user of users) {
      if (!user.avatarFilename) continue;

      const profileId = profileMap.get(user.email);
      if (!profileId) continue;

      const sourcePath = path.join(DEFAULT_LEGACY_IMAGES_PATH, user.avatarFilename);
      if (!existsSync(sourcePath)) {
        failed += 1;
        failures.push(`${user.email}: file not found ${user.avatarFilename}`);
        continue;
      }

      try {
        const buffer = readFileSync(sourcePath);
        const ext = path.extname(user.avatarFilename).toLowerCase();
        const contentType = MIME[ext] ?? "image/jpeg";
        const storagePath = `${profileId}/avatar${ext}`;

        const { error } = await admin.storage
          .from("avatars")
          .upload(storagePath, buffer, {
            contentType,
            upsert: true,
          });

        if (error) {
          failed += 1;
          failures.push(`${user.email}: upload error ${error.message}`);
          continue;
        }

        await db
          .update(profiles)
          .set({ avatarPath: storagePath })
          .where(eq(profiles.id, profileId));

        loaded += 1;
      } catch (err) {
        failed += 1;
        failures.push(
          `${user.email}: ${err instanceof Error ? err.message : String(err)}`,
        );
      }
    }

    void runId;
    return { loaded, failed, failures };
  }
}

export const migrationImageService = new MigrationImageService();
