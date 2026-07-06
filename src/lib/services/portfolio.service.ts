import { and, count, desc, eq, inArray, isNull, sql } from "drizzle-orm";
import { getDb } from "@/db";
import { depositRequests, investmentPlans, investments, ledgerAccounts, ledgerEntries } from "@/db/schema";
import { investmentEngine } from "./investment-engine.service";
import type { RoiPreview } from "./investment-engine.service";
import { investmentEventService } from "./investment-event.service";
import type { InvestmentEventView } from "./investment-event.service";
import { walletService } from "./wallet.service";
import { guardDatabase } from "./infrastructure-guard";
import { fail, ok } from "./base";
import type { ServiceResult } from "./types";

export type InvestmentPosition = {
  id: string;
  planName: string;
  principalAmount: string;
  accruedInterest: string;
  status: string;
  startedAt: Date | null;
  maturesAt: Date | null;
  maturedAt: Date | null;
};

export type PortfolioData = {
  activeInvestments: number;
  maturedInvestments: number;
  pendingInvestments: number;
  totalInvestments: number;
  totalPrincipal: string;
  totalRoiEarned: string;
  totalAccruedInterest: string;
  allocation: Array<{ name: string; value: number }>;
  positions: InvestmentPosition[];
  currency: string;
};

export type InvestmentDetail = InvestmentPosition & {
  dailyRoiPercent: string;
  maxRoiPercent: string | null;
  durationDays: number;
  expectedRoi: string;
  remainingDays: number | null;
  depositRequestId: string | null;
  depositReference: string | null;
  ledgerEntryCount: number;
  roiPreview: RoiPreview;
  timeline: InvestmentEventView[];
};

export class PortfolioService {
  async getPortfolioData(profileId: string): Promise<ServiceResult<PortfolioData>> {
    const infra = guardDatabase<PortfolioData>();
    if (infra) return infra;

    try {
      const walletResult = await walletService.getWalletSummary(profileId);
      const currency = walletResult.success ? walletResult.data.currency : "USD";

      const db = getDb();

      const [[total], [active], [matured], [pending]] = await Promise.all([
        db
          .select({ count: count() })
          .from(investments)
          .where(and(eq(investments.profileId, profileId), isNull(investments.deletedAt))),
        db
          .select({ count: count() })
          .from(investments)
          .where(and(eq(investments.profileId, profileId), eq(investments.status, "active"))),
        db
          .select({ count: count() })
          .from(investments)
          .where(and(eq(investments.profileId, profileId), eq(investments.status, "matured"))),
        db
          .select({ count: count() })
          .from(investments)
          .where(and(eq(investments.profileId, profileId), eq(investments.status, "pending"))),
      ]);

      const [principal] = await db
        .select({
          total: sql<string>`COALESCE(SUM(${investments.principalAmount}), 0)`,
          accrued: sql<string>`COALESCE(SUM(${investments.accruedInterest}), 0)`,
        })
        .from(investments)
        .where(and(eq(investments.profileId, profileId), isNull(investments.deletedAt)));

      const positions = await db
        .select({
          id: investments.id,
          planName: investmentPlans.name,
          principalAmount: investments.principalAmount,
          accruedInterest: investments.accruedInterest,
          status: investments.status,
          startedAt: investments.startedAt,
          maturesAt: investments.maturesAt,
          maturedAt: investments.maturedAt,
        })
        .from(investments)
        .innerJoin(investmentPlans, eq(investments.planId, investmentPlans.id))
        .where(and(eq(investments.profileId, profileId), isNull(investments.deletedAt)))
        .orderBy(desc(investments.createdAt))
        .limit(50);

      const accounts = await db
        .select({ id: ledgerAccounts.id })
        .from(ledgerAccounts)
        .where(eq(ledgerAccounts.profileId, profileId));

      const accountIds = accounts.map((a) => a.id);
      let totalRoiEarned = "0.00";

      if (accountIds.length) {
        const [roi] = await db
          .select({
            total: sql<string>`COALESCE(SUM(${ledgerEntries.amount}), 0)`,
          })
          .from(ledgerEntries)
          .where(
            and(
              inArray(ledgerEntries.accountId, accountIds),
              eq(ledgerEntries.entryType, "investment_interest"),
              eq(ledgerEntries.direction, "credit"),
            ),
          );
        totalRoiEarned = roi?.total ?? "0.00";
      }

      const w = walletResult.success ? walletResult.data : null;
      const allocation = [
        { name: "Available", value: parseFloat(w?.availableBalance ?? "0") || 0 },
        { name: "Invested", value: parseFloat(w?.lockedBalance ?? "0") || 0 },
        { name: "Referral", value: parseFloat(w?.referralEarnings ?? "0") || 0 },
        {
          name: "Pending",
          value: parseFloat(w?.pendingBalance ?? "0") || 0,
        },
      ].filter((a) => a.value > 0);

      return ok({
        activeInvestments: active?.count ?? 0,
        maturedInvestments: matured?.count ?? 0,
        pendingInvestments: pending?.count ?? 0,
        totalInvestments: total?.count ?? 0,
        totalPrincipal: principal?.total ?? "0.00",
        totalRoiEarned,
        totalAccruedInterest: principal?.accrued ?? "0.00",
        allocation,
        positions,
        currency,
      });
    } catch (error) {
      return fail("PORTFOLIO_DATA_ERROR", "Failed to load portfolio data", error);
    }
  }

  async getInvestmentDetail(
    profileId: string,
    investmentId: string,
  ): Promise<ServiceResult<InvestmentDetail>> {
    const infra = guardDatabase<InvestmentDetail>();
    if (infra) return infra;

    try {
      const db = getDb();
      const [row] = await db
        .select({
          investment: investments,
          planName: investmentPlans.name,
          plan: investmentPlans,
          dailyRoiPercent: investmentPlans.dailyRoiPercent,
          maxRoiPercent: investmentPlans.maxRoiPercent,
          durationDays: investmentPlans.durationDays,
          depositRef: depositRequests.externalTransactionRef,
        })
        .from(investments)
        .innerJoin(investmentPlans, eq(investments.planId, investmentPlans.id))
        .leftJoin(depositRequests, eq(investments.depositRequestId, depositRequests.id))
        .where(and(eq(investments.id, investmentId), eq(investments.profileId, profileId)))
        .limit(1);

      if (!row) return fail("INVESTMENT_NOT_FOUND", "Investment not found");

      const [ledgerCount] = await db
        .select({ count: count() })
        .from(ledgerEntries)
        .where(
          and(
            eq(ledgerEntries.referenceType, "investment"),
            eq(ledgerEntries.referenceId, investmentId),
          ),
        );

      const principal = parseFloat(row.investment.principalAmount);
      const dailyRoi = parseFloat(row.dailyRoiPercent);
      const maxRoi = parseFloat(row.maxRoiPercent ?? "0");
      const expectedRoi = maxRoi > 0
        ? ((principal * maxRoi) / 100).toFixed(2)
        : ((principal * dailyRoi * row.durationDays) / 100).toFixed(2);

      let remainingDays: number | null = null;
      if (row.investment.maturesAt) {
        const diff = row.investment.maturesAt.getTime() - Date.now();
        remainingDays = Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
      }

      const roiPreview = investmentEngine.calculateRoiPreview(row.investment, row.plan);
      const timelineResult = await investmentEventService.listForInvestment(investmentId);
      const timeline = timelineResult.success ? timelineResult.data : [];

      return ok({
        id: row.investment.id,
        planName: row.planName,
        principalAmount: row.investment.principalAmount,
        accruedInterest: row.investment.accruedInterest,
        status: row.investment.status,
        startedAt: row.investment.startedAt,
        maturesAt: row.investment.maturesAt,
        maturedAt: row.investment.maturedAt,
        dailyRoiPercent: row.dailyRoiPercent,
        maxRoiPercent: row.maxRoiPercent,
        durationDays: row.durationDays,
        expectedRoi,
        remainingDays,
        depositRequestId: row.investment.depositRequestId,
        depositReference: row.depositRef,
        ledgerEntryCount: ledgerCount?.count ?? 0,
        roiPreview,
        timeline,
      });
    } catch (error) {
      return fail("INVESTMENT_DETAIL_ERROR", "Failed to load investment", error);
    }
  }
}

export const portfolioService = new PortfolioService();
