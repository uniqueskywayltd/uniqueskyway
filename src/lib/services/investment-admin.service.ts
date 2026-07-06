import {
  and,
  count,
  desc,
  eq,
  gte,
  ilike,
  inArray,
  isNull,
  or,
  sql,
} from "drizzle-orm";
import { getDb } from "@/db";
import {
  investmentPlans,
  investments,
  ledgerEntries,
  profiles,
  referralCommissions,
  roiProcessingRuns,
} from "@/db/schema";
import { auditService } from "./audit.service";
import { guardDatabase } from "./infrastructure-guard";
import { investmentEngine } from "./investment-engine.service";
import { investmentEventService } from "./investment-event.service";
import { ledgerService } from "./ledger.service";
import { fail, ok } from "./base";
import type { ActorContext, PaginatedResult, ServiceResult } from "./types";
import type { RoiPreview } from "./investment-engine.service";
import type { InvestmentEventView } from "./investment-event.service";

export type InvestmentFilters = {
  page?: number;
  pageSize?: number;
  status?: string | string[];
  planId?: string;
  search?: string;
  isPaused?: boolean;
};

export type AdminInvestmentView = {
  id: string;
  profileId: string;
  customerName: string;
  customerEmail: string;
  planName: string;
  principalAmount: string;
  accruedInterest: string;
  status: string;
  isPaused: boolean;
  startedAt: Date | null;
  maturesAt: Date | null;
  maturedAt: Date | null;
  lastAccrualAt: Date | null;
  totalRoiCredited: string;
  createdAt: Date;
};

export type AdminInvestmentDetail = AdminInvestmentView & {
  dailyRoiPercent: string;
  maxRoiPercent: string | null;
  durationDays: number;
  roiPreview: RoiPreview;
  timeline: InvestmentEventView[];
  roiHistory: Array<{
    id: string;
    amount: string;
    createdAt: Date;
    description: string | null;
  }>;
};

export class InvestmentAdminService {
  async listForAdmin(
    filters: InvestmentFilters = {},
  ): Promise<ServiceResult<PaginatedResult<AdminInvestmentView>>> {
    const infra = guardDatabase<PaginatedResult<AdminInvestmentView>>();
    if (infra) return infra;

    try {
      const db = getDb();
      const page = filters.page ?? 1;
      const pageSize = Math.min(filters.pageSize ?? 20, 100);
      const offset = (page - 1) * pageSize;

      const conditions = [isNull(investments.deletedAt)];

      if (filters.status) {
        const statuses = Array.isArray(filters.status) ? filters.status : [filters.status];
        conditions.push(inArray(investments.status, statuses as never));
      }

      if (filters.planId) {
        conditions.push(eq(investments.planId, filters.planId));
      }

      if (filters.isPaused !== undefined) {
        conditions.push(eq(investments.isPaused, filters.isPaused));
      }

      if (filters.search) {
        conditions.push(
          or(
            ilike(profiles.fullName, `%${filters.search}%`),
            ilike(profiles.email, `%${filters.search}%`),
            ilike(investmentPlans.name, `%${filters.search}%`),
          )!,
        );
      }

      const whereClause = and(...conditions);

      const [totalRow] = await db
        .select({ count: count() })
        .from(investments)
        .innerJoin(profiles, eq(investments.profileId, profiles.id))
        .innerJoin(investmentPlans, eq(investments.planId, investmentPlans.id))
        .where(whereClause);

      const rows = await db
        .select({
          investment: investments,
          customerName: profiles.fullName,
          customerEmail: profiles.email,
          planName: investmentPlans.name,
        })
        .from(investments)
        .innerJoin(profiles, eq(investments.profileId, profiles.id))
        .innerJoin(investmentPlans, eq(investments.planId, investmentPlans.id))
        .where(whereClause)
        .orderBy(desc(investments.createdAt))
        .limit(pageSize)
        .offset(offset);

      const items: AdminInvestmentView[] = rows.map((r) => ({
        id: r.investment.id,
        profileId: r.investment.profileId,
        customerName: r.customerName,
        customerEmail: r.customerEmail,
        planName: r.planName,
        principalAmount: r.investment.principalAmount,
        accruedInterest: r.investment.accruedInterest,
        status: r.investment.status,
        isPaused: r.investment.isPaused,
        startedAt: r.investment.startedAt,
        maturesAt: r.investment.maturesAt,
        maturedAt: r.investment.maturedAt,
        lastAccrualAt: r.investment.lastAccrualAt,
        totalRoiCredited: r.investment.totalRoiCredited,
        createdAt: r.investment.createdAt,
      }));

      return ok({
        items,
        total: totalRow?.count ?? 0,
        page,
        pageSize,
        totalPages: Math.ceil((totalRow?.count ?? 0) / pageSize),
      });
    } catch (error) {
      return fail("INVESTMENT_LIST_ERROR", "Failed to list investments", error);
    }
  }

  async getDetail(investmentId: string): Promise<ServiceResult<AdminInvestmentDetail>> {
    const infra = guardDatabase<AdminInvestmentDetail>();
    if (infra) return infra;

    try {
      const db = getDb();
      const [row] = await db
        .select({
          investment: investments,
          customerName: profiles.fullName,
          customerEmail: profiles.email,
          plan: investmentPlans,
        })
        .from(investments)
        .innerJoin(profiles, eq(investments.profileId, profiles.id))
        .innerJoin(investmentPlans, eq(investments.planId, investmentPlans.id))
        .where(eq(investments.id, investmentId))
        .limit(1);

      if (!row) return fail("INVESTMENT_NOT_FOUND", "Investment not found");

      const roiPreview = investmentEngine.calculateRoiPreview(row.investment, row.plan);

      const timelineResult = await investmentEventService.listForInvestment(investmentId);
      const timeline = timelineResult.success ? timelineResult.data : [];

      const roiHistory = await db
        .select({
          id: ledgerEntries.id,
          amount: ledgerEntries.amount,
          createdAt: ledgerEntries.createdAt,
          description: ledgerEntries.description,
        })
        .from(ledgerEntries)
        .where(
          and(
            eq(ledgerEntries.referenceType, "investment"),
            eq(ledgerEntries.referenceId, investmentId),
            eq(ledgerEntries.entryType, "investment_interest"),
          ),
        )
        .orderBy(desc(ledgerEntries.createdAt))
        .limit(100);

      return ok({
        id: row.investment.id,
        profileId: row.investment.profileId,
        customerName: row.customerName,
        customerEmail: row.customerEmail,
        planName: row.plan.name,
        principalAmount: row.investment.principalAmount,
        accruedInterest: row.investment.accruedInterest,
        status: row.investment.status,
        isPaused: row.investment.isPaused,
        startedAt: row.investment.startedAt,
        maturesAt: row.investment.maturesAt,
        maturedAt: row.investment.maturedAt,
        lastAccrualAt: row.investment.lastAccrualAt,
        totalRoiCredited: row.investment.totalRoiCredited,
        createdAt: row.investment.createdAt,
        dailyRoiPercent: row.plan.dailyRoiPercent,
        maxRoiPercent: row.plan.maxRoiPercent,
        durationDays: row.plan.durationDays,
        roiPreview,
        timeline,
        roiHistory,
      });
    } catch (error) {
      return fail("INVESTMENT_DETAIL_ERROR", "Failed to load investment", error);
    }
  }

  async manualAdjustment(input: {
    investmentId: string;
    amount: string;
    direction: "credit" | "debit";
    reason: string;
    adminUserId: string;
  }): Promise<ServiceResult<void>> {
    const infra = guardDatabase<void>();
    if (infra) return infra;

    if (!input.reason.trim()) {
      return fail("REASON_REQUIRED", "Audit reason is required for manual adjustments");
    }

    try {
      const db = getDb();
      const [inv] = await db
        .select()
        .from(investments)
        .where(eq(investments.id, input.investmentId))
        .limit(1);

      if (!inv) return fail("INVESTMENT_NOT_FOUND", "Investment not found");

      const actor: ActorContext = { adminUserId: input.adminUserId };
      const idempotencyKey = `admin-adjust-${input.investmentId}-${Date.now()}`;

      await db.transaction(async (tx) => {
        await ledgerService.postEntryInTransaction(tx as never, {
          profileId: inv.profileId,
          accountType: "available",
          direction: input.direction,
          amount: input.amount,
          entryType: "admin_adjustment",
          idempotencyKey,
          referenceType: "investment",
          referenceId: input.investmentId,
          description: `Admin adjustment: ${input.reason}`,
          actor,
          currency: "USD",
        });
      });

      await auditService.log({
        action: "update",
        entityType: "investment",
        entityId: input.investmentId,
        actor,
        metadata: {
          action: "manual_adjustment",
          amount: input.amount,
          direction: input.direction,
          reason: input.reason,
        },
      });

      return ok(undefined);
    } catch (error) {
      return fail("ADJUSTMENT_ERROR", "Failed to apply adjustment", error);
    }
  }

  async getDashboardStats(): Promise<
    ServiceResult<{
      activeCount: number;
      maturedCount: number;
      roiToday: string;
      pendingMaturities: number;
      commissionsToday: string;
      lastRunStatus: string | null;
      lastRunAt: Date | null;
    }>
  > {
    const infra = guardDatabase<{
      activeCount: number;
      maturedCount: number;
      roiToday: string;
      pendingMaturities: number;
      commissionsToday: string;
      lastRunStatus: string | null;
      lastRunAt: Date | null;
    }>();
    if (infra) return infra;

    try {
      const db = getDb();
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const weekAhead = new Date();
      weekAhead.setDate(weekAhead.getDate() + 7);

      const [[active], [matured], [pendingMat], [lastRun], [todayRoi], [todayCommissions]] =
        await Promise.all([
          db
            .select({ count: count() })
            .from(investments)
            .where(and(eq(investments.status, "active"), isNull(investments.deletedAt))),
          db
            .select({ count: count() })
            .from(investments)
            .where(and(eq(investments.status, "matured"), isNull(investments.deletedAt))),
          db
            .select({ count: count() })
            .from(investments)
            .where(
              and(
                eq(investments.status, "active"),
                sql`${investments.maturesAt} <= ${weekAhead}`,
                isNull(investments.deletedAt),
              ),
            ),
          db
            .select()
            .from(roiProcessingRuns)
            .orderBy(desc(roiProcessingRuns.startedAt))
            .limit(1),
          db
            .select({
              roi: sql<string>`COALESCE(SUM(${roiProcessingRuns.roiGenerated}), 0)`,
            })
            .from(roiProcessingRuns)
            .where(gte(roiProcessingRuns.startedAt, today)),
          db
            .select({
              total: sql<string>`COALESCE(SUM(${referralCommissions.commissionAmount}), 0)`,
            })
            .from(referralCommissions)
            .where(gte(referralCommissions.createdAt, today)),
        ]);

      return ok({
        activeCount: active?.count ?? 0,
        maturedCount: matured?.count ?? 0,
        roiToday: todayRoi?.roi ?? "0.00",
        pendingMaturities: pendingMat?.count ?? 0,
        commissionsToday: todayCommissions?.total ?? "0.00",
        lastRunStatus: lastRun?.status ?? null,
        lastRunAt: lastRun?.startedAt ?? null,
      });
    } catch (error) {
      return fail("INVESTMENT_ADMIN_STATS_ERROR", "Failed to load stats", error);
    }
  }
}

export const investmentAdminService = new InvestmentAdminService();
