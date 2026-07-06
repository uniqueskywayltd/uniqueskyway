import { asc, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { withdrawalMethods } from "@/db/schema";
import { guardDatabase } from "./infrastructure-guard";
import { fail, ok } from "./base";
import type { ServiceResult } from "./types";

export type WithdrawalMethodView = {
  id: string;
  slug: string;
  name: string;
  methodType: string;
  description: string | null;
  instructions: string | null;
  requiresDestination: boolean;
  minAmount: string | null;
  maxAmount: string | null;
  config: Record<string, unknown>;
};

export class WithdrawalMethodService {
  async listActive(): Promise<ServiceResult<WithdrawalMethodView[]>> {
    const infra = guardDatabase<WithdrawalMethodView[]>();
    if (infra) return infra;

    try {
      const db = getDb();
      const rows = await db
        .select()
        .from(withdrawalMethods)
        .where(eq(withdrawalMethods.isActive, true))
        .orderBy(asc(withdrawalMethods.sortOrder));

      return ok(
        rows.map((r) => ({
          id: r.id,
          slug: r.slug,
          name: r.name,
          methodType: r.methodType,
          description: r.description,
          instructions: r.instructions,
          requiresDestination: r.requiresDestination,
          minAmount: r.minAmount,
          maxAmount: r.maxAmount,
          config: (r.config as Record<string, unknown>) ?? {},
        })),
      );
    } catch (error) {
      return fail("WITHDRAWAL_METHODS_ERROR", "Failed to load withdrawal methods", error);
    }
  }

  async getBySlug(slug: string): Promise<ServiceResult<WithdrawalMethodView>> {
    const infra = guardDatabase<WithdrawalMethodView>();
    if (infra) return infra;

    try {
      const db = getDb();
      const [row] = await db
        .select()
        .from(withdrawalMethods)
        .where(eq(withdrawalMethods.slug, slug))
        .limit(1);

      if (!row || !row.isActive) {
        return fail("WITHDRAWAL_METHOD_NOT_FOUND", "Withdrawal method not found or inactive");
      }

      return ok({
        id: row.id,
        slug: row.slug,
        name: row.name,
        methodType: row.methodType,
        description: row.description,
        instructions: row.instructions,
        requiresDestination: row.requiresDestination,
        minAmount: row.minAmount,
        maxAmount: row.maxAmount,
        config: (row.config as Record<string, unknown>) ?? {},
      });
    } catch (error) {
      return fail("WITHDRAWAL_METHOD_ERROR", "Failed to load withdrawal method", error);
    }
  }
}

export const withdrawalMethodService = new WithdrawalMethodService();
