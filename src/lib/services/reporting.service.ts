import { and, count, desc, eq, gte, sql } from "drizzle-orm";
import { getDb } from "@/db";
import {
  depositRequests,
  investments,
  profiles,
  referralCommissions,
  roiProcessingRuns,
  withdrawalRequests,
} from "@/db/schema";
import { guardDatabase } from "./infrastructure-guard";
import { fail, ok } from "./base";
import type { ServiceResult } from "./types";

export type DailyActivityReport = {
  date: string;
  newUsers: number;
  depositsApproved: number;
  depositVolume: string;
  withdrawalsCompleted: number;
  withdrawalVolume: string;
  roiGenerated: string;
  referralCommissions: string;
};

export type ReferralPerformanceReport = {
  topReferrers: Array<{
    profileId: string;
    fullName: string;
    email: string;
    referralCount: number;
    totalCommissions: string;
  }>;
  totalCommissions: string;
  totalReferrals: number;
};

export class ReportingService {
  async getDailyActivity(days = 30): Promise<ServiceResult<DailyActivityReport[]>> {
    const infra = guardDatabase<DailyActivityReport[]>();
    if (infra) return infra;

    try {
      const db = getDb();
      const since = new Date();
      since.setDate(since.getDate() - days);

      const [users, deposits, withdrawals, roiRuns, commissions] = await Promise.all([
        db
          .select({
            day: sql<string>`DATE(${profiles.createdAt})`,
            count: count(),
          })
          .from(profiles)
          .where(gte(profiles.createdAt, since))
          .groupBy(sql`DATE(${profiles.createdAt})`),
        db
          .select({
            day: sql<string>`DATE(${depositRequests.approvedAt})`,
            count: count(),
            volume: sql<string>`COALESCE(SUM(${depositRequests.amount}), 0)`,
          })
          .from(depositRequests)
          .where(and(eq(depositRequests.status, "approved"), gte(depositRequests.approvedAt, since)))
          .groupBy(sql`DATE(${depositRequests.approvedAt})`),
        db
          .select({
            day: sql<string>`DATE(${withdrawalRequests.completedAt})`,
            count: count(),
            volume: sql<string>`COALESCE(SUM(${withdrawalRequests.amount}), 0)`,
          })
          .from(withdrawalRequests)
          .where(
            and(eq(withdrawalRequests.status, "completed"), gte(withdrawalRequests.completedAt, since)),
          )
          .groupBy(sql`DATE(${withdrawalRequests.completedAt})`),
        db
          .select({
            day: sql<string>`DATE(${roiProcessingRuns.startedAt})`,
            roi: sql<string>`COALESCE(SUM(${roiProcessingRuns.roiGenerated}), 0)`,
          })
          .from(roiProcessingRuns)
          .where(gte(roiProcessingRuns.startedAt, since))
          .groupBy(sql`DATE(${roiProcessingRuns.startedAt})`),
        db
          .select({
            day: sql<string>`DATE(${referralCommissions.createdAt})`,
            total: sql<string>`COALESCE(SUM(${referralCommissions.commissionAmount}), 0)`,
          })
          .from(referralCommissions)
          .where(gte(referralCommissions.createdAt, since))
          .groupBy(sql`DATE(${referralCommissions.createdAt})`),
      ]);

      const dayMap = new Map<string, DailyActivityReport>();

      for (let i = 0; i < days; i++) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const key = d.toISOString().slice(0, 10);
        dayMap.set(key, {
          date: key,
          newUsers: 0,
          depositsApproved: 0,
          depositVolume: "0.00",
          withdrawalsCompleted: 0,
          withdrawalVolume: "0.00",
          roiGenerated: "0.00",
          referralCommissions: "0.00",
        });
      }

      for (const u of users) {
        const row = dayMap.get(u.day);
        if (row) row.newUsers = u.count;
      }
      for (const d of deposits) {
        const row = dayMap.get(d.day);
        if (row) {
          row.depositsApproved = d.count;
          row.depositVolume = d.volume;
        }
      }
      for (const w of withdrawals) {
        const row = dayMap.get(w.day);
        if (row) {
          row.withdrawalsCompleted = w.count;
          row.withdrawalVolume = w.volume;
        }
      }
      for (const r of roiRuns) {
        const row = dayMap.get(r.day);
        if (row) row.roiGenerated = r.roi;
      }
      for (const c of commissions) {
        const row = dayMap.get(c.day);
        if (row) row.referralCommissions = c.total;
      }

      return ok(Array.from(dayMap.values()).sort((a, b) => b.date.localeCompare(a.date)));
    } catch (error) {
      return fail("REPORT_ERROR", "Failed to generate daily activity report", error);
    }
  }

  async getReferralPerformance(limit = 20): Promise<ServiceResult<ReferralPerformanceReport>> {
    const infra = guardDatabase<ReferralPerformanceReport>();
    if (infra) return infra;

    try {
      const db = getDb();

      const topReferrers = await db
        .select({
          profileId: profiles.id,
          fullName: profiles.fullName,
          email: profiles.email,
          referralCount: sql<number>`COUNT(DISTINCT ${referralCommissions.referredProfileId})`,
          totalCommissions: sql<string>`COALESCE(SUM(${referralCommissions.commissionAmount}), 0)`,
        })
        .from(referralCommissions)
        .innerJoin(profiles, eq(referralCommissions.referrerProfileId, profiles.id))
        .groupBy(profiles.id, profiles.fullName, profiles.email)
        .orderBy(desc(sql`SUM(${referralCommissions.commissionAmount})`))
        .limit(limit);

      const [totals] = await db
        .select({
          total: sql<string>`COALESCE(SUM(${referralCommissions.commissionAmount}), 0)`,
          count: sql<number>`COUNT(DISTINCT ${referralCommissions.referredProfileId})`,
        })
        .from(referralCommissions);

      return ok({
        topReferrers: topReferrers.map((r) => ({
          profileId: r.profileId,
          fullName: r.fullName,
          email: r.email,
          referralCount: Number(r.referralCount),
          totalCommissions: r.totalCommissions,
        })),
        totalCommissions: totals?.total ?? "0.00",
        totalReferrals: Number(totals?.count ?? 0),
      });
    } catch (error) {
      return fail("REFERRAL_REPORT_ERROR", "Failed to generate referral report", error);
    }
  }

  async getInvestmentPerformance(): Promise<
    ServiceResult<{
      activeCount: number;
      maturedCount: number;
      totalPrincipal: string;
      totalRoiCredited: string;
    }>
  > {
    const infra = guardDatabase<{
      activeCount: number;
      maturedCount: number;
      totalPrincipal: string;
      totalRoiCredited: string;
    }>();
    if (infra) return infra;

    try {
      const db = getDb();
      const [[active], [matured], [totals]] = await Promise.all([
        db.select({ count: count() }).from(investments).where(eq(investments.status, "active")),
        db.select({ count: count() }).from(investments).where(eq(investments.status, "matured")),
        db
          .select({
            principal: sql<string>`COALESCE(SUM(${investments.principalAmount}), 0)`,
            roi: sql<string>`COALESCE(SUM(${investments.totalRoiCredited}), 0)`,
          })
          .from(investments),
      ]);

      return ok({
        activeCount: active?.count ?? 0,
        maturedCount: matured?.count ?? 0,
        totalPrincipal: totals?.principal ?? "0.00",
        totalRoiCredited: totals?.roi ?? "0.00",
      });
    } catch (error) {
      return fail("INVESTMENT_REPORT_ERROR", "Failed to generate investment report", error);
    }
  }
}

export const reportingService = new ReportingService();
