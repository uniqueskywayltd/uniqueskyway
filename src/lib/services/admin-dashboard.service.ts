import {
  and,
  count,
  desc,
  eq,
  gte,
  isNull,
  sql,
} from "drizzle-orm";
import { getDb } from "@/db";
import {
  auditLogs,
  depositRequests,
  investments,
  ledgerEntries,
  profiles,
  referralCommissions,
} from "@/db/schema";
import { getIntegrationStatus } from "@/lib/infrastructure";
import { depositService } from "./deposit.service";
import { guardDatabase } from "./infrastructure-guard";
import { investmentAdminService } from "./investment-admin.service";
import { roiSchedulerService } from "./roi-scheduler.service";
import { withdrawalService } from "./withdrawal.service";
import { fail, ok } from "./base";
import type { ServiceResult } from "./types";

export type ExecutiveDashboard = {
  users: {
    total: number;
    active: number;
    newRegistrationsToday: number;
    newRegistrationsMonth: number;
  };
  investments: {
    active: number;
    matured: number;
    pendingMaturities: number;
  };
  operations: {
    pendingDeposits: number;
    pendingWithdrawals: number;
    pendingReviews: number;
    processingQueue: number;
  };
  financials: {
    aum: string;
    totalRoiPaid: string;
    totalReferralCommissions: string;
    dailyRevenue: string;
    monthlyRevenue: string;
  };
  roi: {
    roiToday: string;
    lastRunStatus: string | null;
    lastRunAt: Date | null;
  };
  systemHealth: {
    status: "ok" | "degraded";
    database: boolean;
    supabase: boolean;
    email: boolean;
    storage: boolean;
  };
  recentActivity: Array<{
    id: string;
    action: string;
    entityType: string;
    entityId: string | null;
    actorLabel: string;
    createdAt: Date;
  }>;
};

export class AdminDashboardService {
  async getExecutiveDashboard(): Promise<ServiceResult<ExecutiveDashboard>> {
    const infra = guardDatabase<ExecutiveDashboard>();
    if (infra) return infra;

    try {
      const db = getDb();
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);

      const [
        depositStats,
        withdrawalStats,
        investmentStats,
        lastRun,
        integration,
        recentLogs,
      ] = await Promise.all([
        depositService.getAdminStats(),
        withdrawalService.getAdminStats(),
        investmentAdminService.getDashboardStats(),
        roiSchedulerService.getLatestRun(),
        Promise.resolve(getIntegrationStatus()),
        db
          .select()
          .from(auditLogs)
          .orderBy(desc(auditLogs.createdAt))
          .limit(10),
      ]);

      const [
        [totalUsers],
        [activeUsers],
        [newToday],
        [newMonth],
        [aumRow],
        [roiPaid],
        [commissionsTotal],
        [dailyDeposits],
        [monthlyDeposits],
      ] = await Promise.all([
        db.select({ count: count() }).from(profiles).where(isNull(profiles.deletedAt)),
        db
          .select({ count: count() })
          .from(profiles)
          .where(and(eq(profiles.status, "active"), isNull(profiles.deletedAt))),
        db
          .select({ count: count() })
          .from(profiles)
          .where(and(gte(profiles.createdAt, today), isNull(profiles.deletedAt))),
        db
          .select({ count: count() })
          .from(profiles)
          .where(and(gte(profiles.createdAt, monthStart), isNull(profiles.deletedAt))),
        db
          .select({
            total: sql<string>`COALESCE(SUM(${investments.principalAmount}), 0)`,
          })
          .from(investments)
          .where(and(eq(investments.status, "active"), isNull(investments.deletedAt))),
        db
          .select({
            total: sql<string>`COALESCE(SUM(${ledgerEntries.amount}), 0)`,
          })
          .from(ledgerEntries)
          .where(
            and(
              eq(ledgerEntries.entryType, "investment_interest"),
              eq(ledgerEntries.direction, "credit"),
            ),
          ),
        db
          .select({
            total: sql<string>`COALESCE(SUM(${referralCommissions.commissionAmount}), 0)`,
          })
          .from(referralCommissions),
        db
          .select({
            total: sql<string>`COALESCE(SUM(${depositRequests.amount}), 0)`,
          })
          .from(depositRequests)
          .where(and(eq(depositRequests.status, "approved"), gte(depositRequests.approvedAt, today))),
        db
          .select({
            total: sql<string>`COALESCE(SUM(${depositRequests.amount}), 0)`,
          })
          .from(depositRequests)
          .where(
            and(eq(depositRequests.status, "approved"), gte(depositRequests.approvedAt, monthStart)),
          ),
      ]);

      const pendingDeposits = depositStats.success ? depositStats.data.pendingCount : 0;
      const pendingWithdrawals = withdrawalStats.success ? withdrawalStats.data.pendingCount : 0;
      const pendingReviews = pendingDeposits + pendingWithdrawals;
      const processingQueue =
        (withdrawalStats.success ? withdrawalStats.data.processingCount : 0) +
        pendingDeposits;

      const recentActivity = recentLogs.map((log) => ({
        id: log.id,
        action: log.action,
        entityType: log.entityType,
        entityId: log.entityId,
        actorLabel: log.actorAdminId ? "Admin" : log.actorProfileId ? "Customer" : "System",
        createdAt: log.createdAt,
      }));

      return ok({
        users: {
          total: totalUsers?.count ?? 0,
          active: activeUsers?.count ?? 0,
          newRegistrationsToday: newToday?.count ?? 0,
          newRegistrationsMonth: newMonth?.count ?? 0,
        },
        investments: {
          active: investmentStats.success ? investmentStats.data.activeCount : 0,
          matured: investmentStats.success ? investmentStats.data.maturedCount : 0,
          pendingMaturities: investmentStats.success ? investmentStats.data.pendingMaturities : 0,
        },
        operations: {
          pendingDeposits,
          pendingWithdrawals,
          pendingReviews,
          processingQueue,
        },
        financials: {
          aum: aumRow?.total ?? "0.00",
          totalRoiPaid: roiPaid?.total ?? "0.00",
          totalReferralCommissions: commissionsTotal?.total ?? "0.00",
          dailyRevenue: dailyDeposits?.total ?? "0.00",
          monthlyRevenue: monthlyDeposits?.total ?? "0.00",
        },
        roi: {
          roiToday: investmentStats.success ? investmentStats.data.roiToday : "0.00",
          lastRunStatus: lastRun.success && lastRun.data ? lastRun.data.status : null,
          lastRunAt: lastRun.success && lastRun.data ? lastRun.data.startedAt : null,
        },
        systemHealth: {
          status: integration.ready ? "ok" : "degraded",
          database: integration.database,
          supabase: integration.supabase,
          email: integration.email,
          storage: integration.storage,
        },
        recentActivity,
      });
    } catch (error) {
      return fail("ADMIN_DASHBOARD_ERROR", "Failed to load executive dashboard", error);
    }
  }
}

export const adminDashboardService = new AdminDashboardService();
