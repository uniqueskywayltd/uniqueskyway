import { eq, sql } from "drizzle-orm";
import { getDb } from "@/db";
import {
  ledgerAccounts,
  ledgerEntries,
  migrationBalanceExceptions,
  profiles,
} from "@/db/schema";
import { calculateAllLegacyBalances } from "@/lib/migration/legacy-balance-calculator";
import type { LegacyExtract } from "@/lib/migration/types";

export class MigrationVerifyService {
  async verifyAll(
    runId: string,
    extract: LegacyExtract,
  ): Promise<Record<string, unknown>> {
    const db = getDb();
    const legacyBalances = calculateAllLegacyBalances(
      extract.users,
      extract.transactions,
    );

    let exceptions = 0;
    let matched = 0;

    for (const legacy of legacyBalances) {
      const [profile] = await db
        .select({ id: profiles.id })
        .from(profiles)
        .where(eq(profiles.legacyUserId, legacy.legacyUserId))
        .limit(1);

      if (!profile) {
        exceptions += 1;
        await db.insert(migrationBalanceExceptions).values({
          runId,
          legacyUserId: legacy.legacyUserId,
          email: legacy.email,
          legacyAvailable: legacy.withdrawableBalance.toFixed(2),
          newAvailable: "0.00",
          legacyInvested: legacy.totalInvested.toFixed(2),
          newInvested: "0.00",
          legacyTotal: legacy.totalBalance.toFixed(2),
          newTotal: "0.00",
          difference: legacy.totalBalance.toFixed(2),
          details: { reason: "profile_not_found" },
        });
        continue;
      }

      const balances = await this.getProfileLedgerBalances(profile.id);
      const newTotal = Math.round(
        balances.available + balances.invested + balances.pending,
      );
      const diff = Math.abs(newTotal - legacy.totalBalance);

      if (diff > 0.009) {
        exceptions += 1;
        await db.insert(migrationBalanceExceptions).values({
          runId,
          legacyUserId: legacy.legacyUserId,
          profileId: profile.id,
          email: legacy.email,
          legacyAvailable: legacy.withdrawableBalance.toFixed(2),
          newAvailable: balances.available.toFixed(2),
          legacyInvested: legacy.totalInvested.toFixed(2),
          newInvested: balances.invested.toFixed(2),
          legacyTotal: legacy.totalBalance.toFixed(2),
          newTotal: newTotal.toFixed(2),
          difference: diff.toFixed(2),
          details: {
            referralEarnings: legacy.referralEarnings,
            roiInterest: legacy.roiInterest,
            totalWithdrawn: legacy.totalWithdrawn,
          },
        });
      } else {
        matched += 1;
      }
    }

    return {
      matched,
      exceptions,
      parity: exceptions === 0,
      totalUsers: legacyBalances.length,
    };
  }

  private async getProfileLedgerBalances(profileId: string) {
    const db = getDb();
    const accounts = await db
      .select({ id: ledgerAccounts.id, accountType: ledgerAccounts.accountType })
      .from(ledgerAccounts)
      .where(eq(ledgerAccounts.profileId, profileId));

    const result = { available: 0, invested: 0, pending: 0 };

    for (const account of accounts) {
      const [row] = await db
        .select({
          balance: sql<string>`COALESCE(
            SUM(CASE WHEN ${ledgerEntries.direction} = 'credit' THEN ${ledgerEntries.amount}::numeric ELSE -${ledgerEntries.amount}::numeric END),
            0
          )`,
        })
        .from(ledgerEntries)
        .where(eq(ledgerEntries.accountId, account.id));

      const balance = parseFloat(row?.balance ?? "0");
      if (account.accountType === "available") result.available = balance;
      if (account.accountType === "invested") result.invested = balance;
      if (account.accountType === "pending_withdrawal") result.pending = balance;
    }

    return result;
  }
}

export const migrationVerifyService = new MigrationVerifyService();
