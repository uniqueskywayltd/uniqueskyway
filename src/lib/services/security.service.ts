import { desc, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { loginHistory } from "@/db/schema";
import { sessionService } from "./session.service";
import { fail, ok } from "./base";

export class SecurityService {
  async getLoginHistory(profileId: string, limit = 20) {
    try {
      const db = getDb();
      const rows = await db
        .select()
        .from(loginHistory)
        .where(eq(loginHistory.profileId, profileId))
        .orderBy(desc(loginHistory.createdAt))
        .limit(limit);

      return ok(rows);
    } catch (error) {
      return fail("LOGIN_HISTORY_ERROR", "Failed to load login history", error);
    }
  }

  async getSessions(profileId: string) {
    return sessionService.listSessions(profileId);
  }
}

export const securityService = new SecurityService();
