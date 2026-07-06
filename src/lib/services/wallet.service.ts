import { and, count, desc, eq, gte, ilike, inArray, lte, or, sql } from "drizzle-orm";
import { getDb } from "@/db";
import {
  depositRequests,
  ledgerAccounts,
  ledgerEntries,
  withdrawalRequests,
} from "@/db/schema";
import type { LedgerAccountType, LedgerEntryType } from "@/types/domain";
import { sumMoney } from "@/lib/utils/money";
import { fail, ok } from "./base";
import type { PaginatedResult, ServiceResult } from "./types";

import { guardDatabase } from "./infrastructure-guard";

export type WalletSummary = {
  currency: string;
  totalPortfolioValue: string;
  availableBalance: string;
  reservedBalance: string;
  withdrawableBalance: string;
  lockedBalance: string;
  pendingBalance: string;
  pendingDeposits: string;
  pendingWithdrawals: string;
  referralEarnings: string;
  totalCredits: string;
  totalDebits: string;
  totalDeposits: string;
  totalWithdrawals: string;
  totalRoiEarned: string;
  pendingDepositCount: number;
  pendingWithdrawalCount: number;
  pendingTransactionCount: number;
};

export type LedgerEntryView = {
  id: string;
  referenceId: string;
  accountType: LedgerAccountType;
  direction: "credit" | "debit";
  amount: string;
  currency: string;
  entryType: LedgerEntryType;
  status: "completed";
  description: string | null;
  referenceType: string | null;
  relatedReferenceId: string | null;
  createdAt: Date;
};

export type LedgerFilters = {
  page?: number;
  pageSize?: number;
  entryType?: LedgerEntryType;
  direction?: "credit" | "debit";
  status?: "all" | "completed" | "pending";
  search?: string;
  referenceId?: string;
  from?: Date;
  to?: Date;
};

/**
 * Wallet service — all balances derived from immutable ledger entries.
 */
export class WalletService {
  async getAccountBalance(
    profileId: string,
    accountType: LedgerAccountType,
    currency = "USD",
  ): Promise<ServiceResult<string>> {
    try {
      const db = getDb();

      const [account] = await db
        .select({ id: ledgerAccounts.id })
        .from(ledgerAccounts)
        .where(
          and(
            eq(ledgerAccounts.profileId, profileId),
            eq(ledgerAccounts.accountType, accountType),
            eq(ledgerAccounts.currency, currency),
          ),
        )
        .limit(1);

      if (!account) return ok("0.00");

      const [result] = await db
        .select({
          balance: sql<string>`COALESCE(
            SUM(CASE WHEN ${ledgerEntries.direction} = 'credit' THEN ${ledgerEntries.amount} ELSE -${ledgerEntries.amount} END),
            0
          )`,
        })
        .from(ledgerEntries)
        .where(eq(ledgerEntries.accountId, account.id));

      return ok(result?.balance ?? "0.00");
    } catch (error) {
      return fail("WALLET_BALANCE_ERROR", "Failed to calculate balance", error);
    }
  }

  async getAvailableBalance(profileId: string): Promise<ServiceResult<string>> {
    return this.getAccountBalance(profileId, "available");
  }

  async getReservedBalance(profileId: string): Promise<ServiceResult<string>> {
    return this.getAccountBalance(profileId, "pending_withdrawal");
  }

  async getLockedInvestments(profileId: string): Promise<ServiceResult<string>> {
    return this.getAccountBalance(profileId, "invested");
  }

  async getWithdrawableBalance(profileId: string): Promise<ServiceResult<string>> {
    return this.getAvailableBalance(profileId);
  }

  async getWalletSummary(
    profileId: string,
    currency = "USD",
  ): Promise<ServiceResult<WalletSummary>> {
    const infra = guardDatabase<WalletSummary>();
    if (infra) return infra;

    try {
      const db = getDb();

      const accountTypes: LedgerAccountType[] = [
        "available",
        "invested",
        "pending_deposit",
        "pending_withdrawal",
        "referral",
      ];

      const balances: Record<LedgerAccountType, string> = {
        available: "0.00",
        invested: "0.00",
        pending_deposit: "0.00",
        pending_withdrawal: "0.00",
        referral: "0.00",
      };

      for (const type of accountTypes) {
        const result = await this.getAccountBalance(profileId, type, currency);
        balances[type] = result.success ? result.data : "0.00";
      }

      const accounts = await db
        .select({ id: ledgerAccounts.id })
        .from(ledgerAccounts)
        .where(
          and(eq(ledgerAccounts.profileId, profileId), eq(ledgerAccounts.currency, currency)),
        );

      const accountIds = accounts.map((a) => a.id);

      let totalCredits = "0.00";
      let totalDebits = "0.00";
      let totalDeposits = "0.00";
      let totalWithdrawals = "0.00";
      let totalRoiEarned = "0.00";

      if (accountIds.length) {
        const [totals] = await db
          .select({
            credits: sql<string>`COALESCE(SUM(CASE WHEN ${ledgerEntries.direction} = 'credit' THEN ${ledgerEntries.amount} ELSE 0 END), 0)`,
            debits: sql<string>`COALESCE(SUM(CASE WHEN ${ledgerEntries.direction} = 'debit' THEN ${ledgerEntries.amount} ELSE 0 END), 0)`,
            deposits: sql<string>`COALESCE(SUM(CASE WHEN ${ledgerEntries.entryType} = 'deposit' AND ${ledgerEntries.direction} = 'credit' THEN ${ledgerEntries.amount} ELSE 0 END), 0)`,
            withdrawals: sql<string>`COALESCE(SUM(CASE WHEN ${ledgerEntries.entryType} = 'withdrawal' AND ${ledgerEntries.direction} = 'debit' THEN ${ledgerEntries.amount} ELSE 0 END), 0)`,
            roi: sql<string>`COALESCE(SUM(CASE WHEN ${ledgerEntries.entryType} = 'investment_interest' AND ${ledgerEntries.direction} = 'credit' THEN ${ledgerEntries.amount} ELSE 0 END), 0)`,
          })
          .from(ledgerEntries)
          .where(inArray(ledgerEntries.accountId, accountIds));

        totalCredits = totals?.credits ?? "0.00";
        totalDebits = totals?.debits ?? "0.00";
        totalDeposits = totals?.deposits ?? "0.00";
        totalWithdrawals = totals?.withdrawals ?? "0.00";
        totalRoiEarned = totals?.roi ?? "0.00";
      }

      const [[depositCount], [withdrawalCount]] = await Promise.all([
        db
          .select({ count: count() })
          .from(depositRequests)
          .where(
            and(
              eq(depositRequests.profileId, profileId),
              inArray(depositRequests.status, ["submitted", "under_review", "processing"]),
            ),
          ),
        db
          .select({ count: count() })
          .from(withdrawalRequests)
          .where(
            and(
              eq(withdrawalRequests.profileId, profileId),
              inArray(withdrawalRequests.status, [
                "submitted",
                "under_review",
                "approved",
                "processing",
              ]),
            ),
          ),
      ]);

      const totalPortfolioValue = sumMoney(
        balances.available,
        balances.invested,
        balances.pending_deposit,
        balances.referral,
      );

      const pendingBalance = sumMoney(balances.pending_deposit, balances.pending_withdrawal);
      const pendingTransactionCount =
        (depositCount?.count ?? 0) + (withdrawalCount?.count ?? 0);

      const withdrawableResult = await this.getWithdrawableBalance(profileId);
      const withdrawableBalance = withdrawableResult.success ? withdrawableResult.data : "0.00";

      return ok({
        currency,
        totalPortfolioValue,
        availableBalance: balances.available,
        reservedBalance: balances.pending_withdrawal,
        withdrawableBalance,
        lockedBalance: balances.invested,
        pendingBalance,
        pendingDeposits: balances.pending_deposit,
        pendingWithdrawals: balances.pending_withdrawal,
        referralEarnings: balances.referral,
        totalCredits,
        totalDebits,
        totalDeposits,
        totalWithdrawals,
        totalRoiEarned,
        pendingDepositCount: depositCount?.count ?? 0,
        pendingWithdrawalCount: withdrawalCount?.count ?? 0,
        pendingTransactionCount,
      });
    } catch (error) {
      return fail("WALLET_SUMMARY_ERROR", "Failed to load wallet summary", error);
    }
  }

  async getLedgerHistory(
    profileId: string,
    filters: LedgerFilters = {},
  ): Promise<ServiceResult<PaginatedResult<LedgerEntryView>>> {
    const infra = guardDatabase<PaginatedResult<LedgerEntryView>>();
    if (infra) return infra;

    try {
      const db = getDb();
      const page = filters.page ?? 1;
      const pageSize = Math.min(filters.pageSize ?? 20, 100);
      const offset = (page - 1) * pageSize;

      const accounts = await db
        .select({ id: ledgerAccounts.id, accountType: ledgerAccounts.accountType, currency: ledgerAccounts.currency })
        .from(ledgerAccounts)
        .where(eq(ledgerAccounts.profileId, profileId));

      if (!accounts.length) {
        return ok({ items: [], page, pageSize, total: 0, totalPages: 0 });
      }

      const accountIds = accounts.map((a) => a.id);
      const accountMap = new Map(accounts.map((a) => [a.id, a]));

      const conditions = [inArray(ledgerEntries.accountId, accountIds)];

      if (filters.entryType) {
        conditions.push(eq(ledgerEntries.entryType, filters.entryType));
      }
      if (filters.direction) {
        conditions.push(eq(ledgerEntries.direction, filters.direction));
      }
      if (filters.from) {
        conditions.push(gte(ledgerEntries.createdAt, filters.from));
      }
      if (filters.to) {
        conditions.push(lte(ledgerEntries.createdAt, filters.to));
      }
      if (filters.search) {
        conditions.push(
          or(
            ilike(ledgerEntries.description, `%${filters.search}%`),
            ilike(ledgerEntries.idempotencyKey, `%${filters.search}%`),
            ilike(ledgerEntries.referenceType, `%${filters.search}%`),
            ilike(ledgerEntries.referenceId, `%${filters.search}%`),
          )!,
        );
      }
      if (filters.referenceId) {
        conditions.push(
          or(
            ilike(ledgerEntries.idempotencyKey, `%${filters.referenceId}%`),
            ilike(ledgerEntries.referenceId, `%${filters.referenceId}%`),
          )!,
        );
      }
      if (filters.status === "pending") {
        const pendingAccountIds = accounts
          .filter((a) =>
            ["pending_deposit", "pending_withdrawal"].includes(a.accountType),
          )
          .map((a) => a.id);
        if (!pendingAccountIds.length) {
          return ok({ items: [], page, pageSize, total: 0, totalPages: 0 });
        }
        conditions.push(inArray(ledgerEntries.accountId, pendingAccountIds));
      }

      const whereClause = and(...conditions);

      const [totalRow] = await db
        .select({ count: count() })
        .from(ledgerEntries)
        .where(whereClause);

      const rows = await db
        .select()
        .from(ledgerEntries)
        .where(whereClause)
        .orderBy(desc(ledgerEntries.createdAt))
        .limit(pageSize)
        .offset(offset);

      const items: LedgerEntryView[] = rows.map((row) => {
        const account = accountMap.get(row.accountId)!;
        return {
          id: row.id,
          referenceId: row.idempotencyKey,
          accountType: account.accountType,
          direction: row.direction,
          amount: row.amount,
          currency: account.currency,
          entryType: row.entryType,
          status: "completed",
          description: row.description,
          referenceType: row.referenceType,
          relatedReferenceId: row.referenceId,
          createdAt: row.createdAt,
        };
      });

      const total = totalRow?.count ?? 0;

      return ok({
        items,
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      });
    } catch (error) {
      return fail("LEDGER_HISTORY_ERROR", "Failed to load ledger history", error);
    }
  }

  async getBalanceHistory(
    profileId: string,
    days = 30,
  ): Promise<ServiceResult<Array<{ date: string; balance: string }>>> {
    const infra = guardDatabase<Array<{ date: string; balance: string }>>();
    if (infra) return infra;

    try {
      const db = getDb();
      const since = new Date();
      since.setDate(since.getDate() - days);

      const accounts = await db
        .select({ id: ledgerAccounts.id })
        .from(ledgerAccounts)
        .where(eq(ledgerAccounts.profileId, profileId));

      if (!accounts.length) return ok([]);

      const accountIds = accounts.map((a) => a.id);

      const rows = await db
        .select({
          date: sql<string>`DATE(${ledgerEntries.createdAt})`,
          net: sql<string>`SUM(CASE WHEN ${ledgerEntries.direction} = 'credit' THEN ${ledgerEntries.amount} ELSE -${ledgerEntries.amount} END)`,
        })
        .from(ledgerEntries)
        .where(
          and(inArray(ledgerEntries.accountId, accountIds), gte(ledgerEntries.createdAt, since)),
        )
        .groupBy(sql`DATE(${ledgerEntries.createdAt})`)
        .orderBy(sql`DATE(${ledgerEntries.createdAt})`);

      let running = 0;
      const history = rows.map((row) => {
        running += parseFloat(row.net ?? "0");
        return { date: row.date, balance: running.toFixed(2) };
      });

      return ok(history);
    } catch (error) {
      return fail("BALANCE_HISTORY_ERROR", "Failed to load balance history", error);
    }
  }

  async getEarningsHistory(
    profileId: string,
    days = 30,
  ): Promise<ServiceResult<Array<{ date: string; earnings: string }>>> {
    const infra = guardDatabase<Array<{ date: string; earnings: string }>>();
    if (infra) return infra;

    try {
      const db = getDb();
      const since = new Date();
      since.setDate(since.getDate() - days);

      const accounts = await db
        .select({ id: ledgerAccounts.id })
        .from(ledgerAccounts)
        .where(eq(ledgerAccounts.profileId, profileId));

      if (!accounts.length) return ok([]);

      const accountIds = accounts.map((a) => a.id);

      const rows = await db
        .select({
          date: sql<string>`DATE(${ledgerEntries.createdAt})`,
          earnings: sql<string>`COALESCE(SUM(${ledgerEntries.amount}), 0)`,
        })
        .from(ledgerEntries)
        .where(
          and(
            inArray(ledgerEntries.accountId, accountIds),
            eq(ledgerEntries.entryType, "investment_interest"),
            eq(ledgerEntries.direction, "credit"),
            gte(ledgerEntries.createdAt, since),
          ),
        )
        .groupBy(sql`DATE(${ledgerEntries.createdAt})`)
        .orderBy(sql`DATE(${ledgerEntries.createdAt})`);

      return ok(
        rows.map((row) => ({
          date: row.date,
          earnings: row.earnings ?? "0.00",
        })),
      );
    } catch (error) {
      return fail("EARNINGS_HISTORY_ERROR", "Failed to load earnings history", error);
    }
  }
}

export const walletService = new WalletService();
