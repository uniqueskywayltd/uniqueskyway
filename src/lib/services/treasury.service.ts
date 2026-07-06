import { and, count, desc, eq, gte, inArray, sql } from "drizzle-orm";
import { getDb } from "@/db";
import { profiles, treasuryPayouts, withdrawalRequests } from "@/db/schema";
import type { PayoutStatus } from "@/types/domain";
import { guardDatabase } from "./infrastructure-guard";
import { fail, ok } from "./base";
import type { PaginatedResult, ServiceResult } from "./types";
import { getPayoutProvider } from "./treasury/providers/types";

export type TreasuryPayoutView = {
  id: string;
  withdrawalRequestId: string;
  providerType: string;
  providerSlug: string;
  status: PayoutStatus;
  amount: string;
  currency: string;
  destinationSnapshot: Record<string, unknown>;
  externalReference: string | null;
  failureReason: string | null;
  processedAt: Date | null;
  completedAt: Date | null;
  failedAt: Date | null;
  createdAt: Date;
  customerName?: string;
  customerEmail?: string;
};

export type TreasuryStats = {
  pendingCount: number;
  processingCount: number;
  completedToday: number;
  failedCount: number;
  volumeToday: string;
  averageProcessingHours: number | null;
};

export class TreasuryService {
  async createPayoutForWithdrawal(input: {
    withdrawalId: string;
    amount: string;
    currency: string;
    destination: Record<string, unknown>;
    providerSlug?: string;
  }): Promise<ServiceResult<{ id: string }>> {
    try {
      const db = getDb();
      const providerSlug = input.providerSlug ?? "manual";
      const provider = getPayoutProvider(providerSlug);

      const [payout] = await db
        .insert(treasuryPayouts)
        .values({
          withdrawalRequestId: input.withdrawalId,
          providerType: provider.type,
          providerSlug: provider.slug,
          status: "pending",
          amount: input.amount,
          currency: input.currency,
          destinationSnapshot: input.destination,
        })
        .returning({ id: treasuryPayouts.id });

      return ok({ id: payout.id });
    } catch (error) {
      return fail("TREASURY_CREATE_ERROR", "Failed to create treasury payout", error);
    }
  }

  async listQueue(
    filters: { status?: PayoutStatus | PayoutStatus[]; page?: number; pageSize?: number } = {},
  ): Promise<ServiceResult<PaginatedResult<TreasuryPayoutView>>> {
    const infra = guardDatabase<PaginatedResult<TreasuryPayoutView>>();
    if (infra) return infra;

    try {
      const db = getDb();
      const page = filters.page ?? 1;
      const pageSize = Math.min(filters.pageSize ?? 20, 100);
      const offset = (page - 1) * pageSize;

      const conditions = [];
      if (filters.status) {
        const statuses = Array.isArray(filters.status) ? filters.status : [filters.status];
        conditions.push(inArray(treasuryPayouts.status, statuses));
      }

      const whereClause = conditions.length ? and(...conditions) : undefined;

      const [totalRow] = await db
        .select({ count: count() })
        .from(treasuryPayouts)
        .where(whereClause);

      const rows = await db
        .select({
          payout: treasuryPayouts,
          customerName: profiles.fullName,
          customerEmail: profiles.email,
        })
        .from(treasuryPayouts)
        .innerJoin(withdrawalRequests, eq(treasuryPayouts.withdrawalRequestId, withdrawalRequests.id))
        .innerJoin(profiles, eq(withdrawalRequests.profileId, profiles.id))
        .where(whereClause)
        .orderBy(desc(treasuryPayouts.createdAt))
        .limit(pageSize)
        .offset(offset);

      const items = rows.map((r) => this.toView(r.payout, r.customerName, r.customerEmail));
      const total = totalRow?.count ?? 0;

      return ok({ items, page, pageSize, total, totalPages: Math.ceil(total / pageSize) });
    } catch (error) {
      return fail("TREASURY_QUEUE_ERROR", "Failed to load treasury queue", error);
    }
  }

  async getStats(): Promise<ServiceResult<TreasuryStats>> {
    const infra = guardDatabase<TreasuryStats>();
    if (infra) return infra;

    try {
      const db = getDb();
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const [[pending], [processing], [completed], [failed], [volume], [avgProcessing]] =
        await Promise.all([
          db
            .select({ count: count() })
            .from(treasuryPayouts)
            .where(eq(treasuryPayouts.status, "pending")),
          db
            .select({ count: count() })
            .from(treasuryPayouts)
            .where(eq(treasuryPayouts.status, "processing")),
          db
            .select({ count: count() })
            .from(treasuryPayouts)
            .where(
              and(
                eq(treasuryPayouts.status, "completed"),
                gte(treasuryPayouts.completedAt, today),
              ),
            ),
          db
            .select({ count: count() })
            .from(treasuryPayouts)
            .where(eq(treasuryPayouts.status, "failed")),
          db
            .select({
              total: sql<string>`COALESCE(SUM(${treasuryPayouts.amount}), 0)`,
            })
            .from(treasuryPayouts)
            .where(
              and(
                eq(treasuryPayouts.status, "completed"),
                gte(treasuryPayouts.completedAt, today),
              ),
            ),
          db
            .select({
              avgHours: sql<number>`AVG(EXTRACT(EPOCH FROM (${treasuryPayouts.completedAt} - ${treasuryPayouts.createdAt})) / 3600)`,
            })
            .from(treasuryPayouts)
            .where(
              and(
                eq(treasuryPayouts.status, "completed"),
                sql`${treasuryPayouts.completedAt} IS NOT NULL`,
              ),
            ),
        ]);

      return ok({
        pendingCount: pending?.count ?? 0,
        processingCount: processing?.count ?? 0,
        completedToday: completed?.count ?? 0,
        failedCount: failed?.count ?? 0,
        volumeToday: volume?.total ?? "0.00",
        averageProcessingHours: avgProcessing?.avgHours ?? null,
      });
    } catch (error) {
      return fail("TREASURY_STATS_ERROR", "Failed to load treasury stats", error);
    }
  }

  async markProcessing(
    payoutId: string,
    adminUserId: string,
  ): Promise<ServiceResult<void>> {
    try {
      const db = getDb();
      await db
        .update(treasuryPayouts)
        .set({
          status: "processing",
          processedByAdminId: adminUserId,
          processedAt: new Date(),
        })
        .where(eq(treasuryPayouts.id, payoutId));
      return ok(undefined);
    } catch (error) {
      return fail("TREASURY_PROCESS_ERROR", "Failed to mark payout processing", error);
    }
  }

  async markCompleted(
    payoutId: string,
    externalReference?: string,
  ): Promise<ServiceResult<void>> {
    try {
      const db = getDb();
      await db
        .update(treasuryPayouts)
        .set({
          status: "completed",
          externalReference: externalReference ?? null,
          completedAt: new Date(),
        })
        .where(eq(treasuryPayouts.id, payoutId));
      return ok(undefined);
    } catch (error) {
      return fail("TREASURY_COMPLETE_ERROR", "Failed to complete payout", error);
    }
  }

  async markFailed(payoutId: string, reason: string): Promise<ServiceResult<void>> {
    try {
      const db = getDb();
      await db
        .update(treasuryPayouts)
        .set({
          status: "failed",
          failureReason: reason,
          failedAt: new Date(),
        })
        .where(eq(treasuryPayouts.id, payoutId));
      return ok(undefined);
    } catch (error) {
      return fail("TREASURY_FAIL_ERROR", "Failed to mark payout failed", error);
    }
  }

  private toView(
    row: typeof treasuryPayouts.$inferSelect,
    customerName?: string,
    customerEmail?: string,
  ): TreasuryPayoutView {
    return {
      id: row.id,
      withdrawalRequestId: row.withdrawalRequestId,
      providerType: row.providerType,
      providerSlug: row.providerSlug,
      status: row.status as PayoutStatus,
      amount: row.amount,
      currency: row.currency,
      destinationSnapshot: (row.destinationSnapshot as Record<string, unknown>) ?? {},
      externalReference: row.externalReference,
      failureReason: row.failureReason,
      processedAt: row.processedAt,
      completedAt: row.completedAt,
      failedAt: row.failedAt,
      createdAt: row.createdAt,
      customerName,
      customerEmail,
    };
  }
}

export const treasuryService = new TreasuryService();
