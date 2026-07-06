import { and, count, eq, isNull, sql } from "drizzle-orm";
import { getDb } from "@/db";
import { investments } from "@/db/schema";
import { walletService, type LedgerEntryView } from "./wallet.service";
import { notificationService, type NotificationView } from "./notification.service";
import { guardDatabase } from "./infrastructure-guard";
import { fail, ok } from "./base";
import type { ServiceResult } from "./types";

export type PortfolioSummary = {
  wallet: Awaited<ReturnType<typeof walletService.getWalletSummary>> extends ServiceResult<infer T>
    ? T
    : never;
  totalInvestments: number;
  activeInvestments: number;
  maturedInvestments: number;
  pendingInvestments: number;
  totalRoiEarned: string;
  totalPrincipal: string;
};

export type ChartPoint = { date: string; value: number; label?: string };

export type DashboardData = {
  portfolio: PortfolioSummary;
  recentActivity: LedgerEntryView[];
  recentNotifications: NotificationView[];
  charts: {
    portfolioGrowth: ChartPoint[];
    balanceHistory: ChartPoint[];
    earningsTrend: ChartPoint[];
    allocation: Array<{ name: string; value: number }>;
  };
};

export class DashboardService {
  async getPortfolioSummary(profileId: string): Promise<ServiceResult<PortfolioSummary>> {
    const infra = guardDatabase<PortfolioSummary>();
    if (infra) return infra;

    try {
      const walletResult = await walletService.getWalletSummary(profileId);
      if (!walletResult.success) return walletResult;

      const db = getDb();

      const [[total], [active], [matured], [pending]] = await Promise.all([
        db.select({ count: count() }).from(investments).where(
          and(eq(investments.profileId, profileId), isNull(investments.deletedAt)),
        ),
        db.select({ count: count() }).from(investments).where(
          and(eq(investments.profileId, profileId), eq(investments.status, "active")),
        ),
        db.select({ count: count() }).from(investments).where(
          and(eq(investments.profileId, profileId), eq(investments.status, "matured")),
        ),
        db.select({ count: count() }).from(investments).where(
          and(eq(investments.profileId, profileId), eq(investments.status, "pending")),
        ),
      ]);

      const [principal] = await db
        .select({
          total: sql<string>`COALESCE(SUM(${investments.principalAmount}), 0)`,
        })
        .from(investments)
        .where(and(eq(investments.profileId, profileId), isNull(investments.deletedAt)));

      return ok({
        wallet: walletResult.data,
        totalInvestments: total?.count ?? 0,
        activeInvestments: active?.count ?? 0,
        maturedInvestments: matured?.count ?? 0,
        pendingInvestments: pending?.count ?? 0,
        totalRoiEarned: walletResult.data.totalRoiEarned,
        totalPrincipal: principal?.total ?? "0.00",
      });
    } catch (error) {
      return fail("PORTFOLIO_ERROR", "Failed to load portfolio summary", error);
    }
  }

  async getDashboardData(profileId: string): Promise<ServiceResult<DashboardData>> {
    const portfolioResult = await this.getPortfolioSummary(profileId);
    if (!portfolioResult.success) return portfolioResult;

    const [activityResult, notifResult, balanceHistory, earningsHistory] = await Promise.all([
      walletService.getLedgerHistory(profileId, { page: 1, pageSize: 8 }),
      notificationService.listForProfile(profileId, { page: 1, pageSize: 5 }),
      walletService.getBalanceHistory(profileId, 30),
      walletService.getEarningsHistory(profileId, 30),
    ]);

    const w = portfolioResult.data.wallet;
    const allocation = [
      { name: "Available", value: parseFloat(w.availableBalance) || 0 },
      { name: "Invested", value: parseFloat(w.lockedBalance) || 0 },
      { name: "Referral", value: parseFloat(w.referralEarnings) || 0 },
      { name: "Pending", value: parseFloat(w.pendingBalance) || 0 },
    ].filter((a) => a.value > 0);

    const balancePoints = balanceHistory.success
      ? balanceHistory.data.map((p) => ({ date: p.date, value: parseFloat(p.balance) }))
      : [];

    return ok({
      portfolio: portfolioResult.data,
      recentActivity: activityResult.success ? activityResult.data.items : [],
      recentNotifications: notifResult.success ? notifResult.data.items : [],
      charts: {
        portfolioGrowth: balancePoints,
        balanceHistory: balancePoints,
        earningsTrend: earningsHistory.success
          ? earningsHistory.data.map((p) => ({
              date: p.date,
              value: parseFloat(p.earnings),
            }))
          : [],
        allocation,
      },
    });
  }
}

export const dashboardService = new DashboardService();

// Activity timeline is sourced from AuditService — see audit.service.ts getTimelineForProfile
