import { and, eq, sql } from "drizzle-orm";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import { getDb } from "@/db";
import { schema } from "@/db/schema";
import { ledgerAccounts, ledgerEntries } from "@/db/schema";
import type { LedgerAccountType, LedgerEntryType } from "@/types/domain";
import { fail, ok } from "./base";
import type { ActorContext, ServiceResult } from "./types";

type Db = PostgresJsDatabase<typeof schema>;

export type LedgerPostInput = {
  profileId: string;
  accountType: LedgerAccountType;
  direction: "credit" | "debit";
  amount: string;
  entryType: LedgerEntryType;
  idempotencyKey: string;
  referenceType?: string;
  referenceId?: string;
  description?: string;
  metadata?: Record<string, unknown>;
  actor?: ActorContext;
  currency?: string;
  /** Allow negative balance (admin adjustments only) */
  allowNegative?: boolean;
};

/**
 * Ledger service — the ONLY path for financial movements.
 * All operations run inside database transactions.
 * Balances are NEVER stored directly; always derived from entries.
 */
export class LedgerService {
  private async getOrCreateAccount(
    tx: Db,
    profileId: string,
    accountType: LedgerAccountType,
    currency: string,
  ) {
    const [existing] = await tx
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

    if (existing) return existing.id;

    const [created] = await tx
      .insert(ledgerAccounts)
      .values({ profileId, accountType, currency })
      .returning({ id: ledgerAccounts.id });

    return created.id;
  }

  async getAccountBalance(
    accountId: string,
  ): Promise<ServiceResult<string>> {
    try {
      const db = getDb();
      const [result] = await db
        .select({
          balance: sql<string>`COALESCE(
            SUM(CASE WHEN ${ledgerEntries.direction} = 'credit' THEN ${ledgerEntries.amount} ELSE -${ledgerEntries.amount} END),
            0
          )`,
        })
        .from(ledgerEntries)
        .where(eq(ledgerEntries.accountId, accountId));

      return ok(result?.balance ?? "0.00");
    } catch (error) {
      return fail("LEDGER_BALANCE_ERROR", "Failed to calculate balance", error);
    }
  }

  async postEntry(input: LedgerPostInput): Promise<ServiceResult<{ id: string }>> {
    const amount = parseFloat(input.amount);
    if (Number.isNaN(amount) || amount <= 0) {
      return fail("INVALID_AMOUNT", "Amount must be a positive number");
    }

    try {
      const db = getDb();
      const result = await db.transaction(async (tx) => {
        return this.postEntryInTransaction(tx as Db, input);
      });
      return ok(result);
    } catch (error) {
      if (error instanceof Error && error.message === "INSUFFICIENT_FUNDS") {
        return fail("INSUFFICIENT_FUNDS", "Insufficient account balance");
      }
      return fail("LEDGER_POST_ERROR", "Failed to post ledger entry", error);
    }
  }

  async postEntryInTransaction(
    tx: Db,
    input: LedgerPostInput,
  ): Promise<{ id: string }> {
    const amount = parseFloat(input.amount);
    if (Number.isNaN(amount) || amount <= 0) {
      throw new Error("INVALID_AMOUNT");
    }

    const accountId = await this.getOrCreateAccount(
      tx,
      input.profileId,
      input.accountType,
      input.currency ?? "USD",
    );

    if (input.direction === "debit" && !input.allowNegative) {
      const [balanceRow] = await tx
        .select({
          balance: sql<string>`COALESCE(
            SUM(CASE WHEN ${ledgerEntries.direction} = 'credit' THEN ${ledgerEntries.amount} ELSE -${ledgerEntries.amount} END),
            0
          )`,
        })
        .from(ledgerEntries)
        .where(eq(ledgerEntries.accountId, accountId));

      const balance = parseFloat(balanceRow?.balance ?? "0");
      if (balance < amount) {
        throw new Error("INSUFFICIENT_FUNDS");
      }
    }

    const [entry] = await tx
      .insert(ledgerEntries)
      .values({
        accountId,
        direction: input.direction,
        amount: input.amount,
        entryType: input.entryType,
        idempotencyKey: input.idempotencyKey,
        referenceType: input.referenceType,
        referenceId: input.referenceId,
        description: input.description,
        metadata: input.metadata ? JSON.stringify(input.metadata) : null,
        createdByProfileId: input.actor?.profileId,
        createdByAdminId: input.actor?.adminUserId,
      })
      .returning({ id: ledgerEntries.id });

    return entry;
  }
}

export const ledgerService = new LedgerService();
