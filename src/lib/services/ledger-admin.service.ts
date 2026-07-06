import { and, count, desc, eq, gte, ilike, inArray, lte, or } from "drizzle-orm";
import { getDb } from "@/db";
import { ledgerAccounts, ledgerEntries, profiles } from "@/db/schema";
import { auditService } from "./audit.service";
import { guardDatabase } from "./infrastructure-guard";
import { ledgerService } from "./ledger.service";
import { fail, ok } from "./base";
import type { ActorContext, PaginatedResult, ServiceResult } from "./types";
import type { LedgerEntryType } from "@/types/domain";

export type LedgerEntryView = {
  id: string;
  profileId: string;
  customerName: string;
  accountType: string;
  direction: string;
  amount: string;
  entryType: string;
  idempotencyKey: string;
  referenceType: string | null;
  referenceId: string | null;
  description: string | null;
  createdAt: Date;
};

export type LedgerFilters = {
  page?: number;
  pageSize?: number;
  profileId?: string;
  entryType?: LedgerEntryType;
  referenceId?: string;
  search?: string;
  from?: Date;
  to?: Date;
};

export class LedgerAdminService {
  async listEntries(
    filters: LedgerFilters = {},
  ): Promise<ServiceResult<PaginatedResult<LedgerEntryView>>> {
    const infra = guardDatabase<PaginatedResult<LedgerEntryView>>();
    if (infra) return infra;

    try {
      const db = getDb();
      const page = filters.page ?? 1;
      const pageSize = Math.min(filters.pageSize ?? 30, 100);
      const offset = (page - 1) * pageSize;

      const conditions = [];

      if (filters.profileId) {
        const accounts = await db
          .select({ id: ledgerAccounts.id })
          .from(ledgerAccounts)
          .where(eq(ledgerAccounts.profileId, filters.profileId));
        const accountIds = accounts.map((a) => a.id);
        if (accountIds.length) {
          conditions.push(inArray(ledgerEntries.accountId, accountIds));
        } else {
          return ok({ items: [], page, pageSize, total: 0, totalPages: 0 });
        }
      }

      if (filters.entryType) conditions.push(eq(ledgerEntries.entryType, filters.entryType));
      if (filters.referenceId) conditions.push(eq(ledgerEntries.referenceId, filters.referenceId));
      if (filters.from) conditions.push(gte(ledgerEntries.createdAt, filters.from));
      if (filters.to) conditions.push(lte(ledgerEntries.createdAt, filters.to));

      if (filters.search) {
        conditions.push(
          or(
            ilike(ledgerEntries.description, `%${filters.search}%`),
            ilike(ledgerEntries.idempotencyKey, `%${filters.search}%`),
            ilike(ledgerEntries.referenceId, `%${filters.search}%`),
          )!,
        );
      }

      const whereClause = conditions.length ? and(...conditions) : undefined;

      const [totalRow] = await db
        .select({ count: count() })
        .from(ledgerEntries)
        .where(whereClause);

      const rows = await db
        .select({
          entry: ledgerEntries,
          profileId: ledgerAccounts.profileId,
          customerName: profiles.fullName,
          accountType: ledgerAccounts.accountType,
        })
        .from(ledgerEntries)
        .innerJoin(ledgerAccounts, eq(ledgerEntries.accountId, ledgerAccounts.id))
        .innerJoin(profiles, eq(ledgerAccounts.profileId, profiles.id))
        .where(whereClause)
        .orderBy(desc(ledgerEntries.createdAt))
        .limit(pageSize)
        .offset(offset);

      const items: LedgerEntryView[] = rows.map((r) => ({
        id: r.entry.id,
        profileId: r.profileId,
        customerName: r.customerName,
        accountType: r.accountType,
        direction: r.entry.direction,
        amount: r.entry.amount,
        entryType: r.entry.entryType,
        idempotencyKey: r.entry.idempotencyKey,
        referenceType: r.entry.referenceType,
        referenceId: r.entry.referenceId,
        description: r.entry.description,
        createdAt: r.entry.createdAt,
      }));

      const total = totalRow?.count ?? 0;

      return ok({ items, page, pageSize, total, totalPages: Math.ceil(total / pageSize) });
    } catch (error) {
      return fail("LEDGER_LIST_ERROR", "Failed to list ledger entries", error);
    }
  }

  async postCorrection(input: {
    profileId: string;
    accountType: "available" | "invested" | "referral" | "pending_withdrawal";
    direction: "credit" | "debit";
    amount: string;
    reason: string;
    adminUserId: string;
    actor?: ActorContext;
  }): Promise<ServiceResult<{ entryId: string }>> {
    if (!input.reason.trim()) {
      return fail("REASON_REQUIRED", "Correction reason is required");
    }

    const actor: ActorContext = { adminUserId: input.adminUserId, ...input.actor };
    const idempotencyKey = `admin-correction-${input.profileId}-${Date.now()}`;

    const result = await ledgerService.postEntry({
      profileId: input.profileId,
      accountType: input.accountType,
      direction: input.direction,
      amount: input.amount,
      entryType: "admin_adjustment",
      idempotencyKey,
      referenceType: "admin_correction",
      description: `Manual correction: ${input.reason}`,
      actor,
      allowNegative: true,
    });

    if (!result.success) return result;

    await auditService.log({
      action: "adjustment",
      entityType: "ledger",
      entityId: result.data.id,
      actor,
      metadata: {
        reason: input.reason,
        profileId: input.profileId,
        amount: input.amount,
        direction: input.direction,
        accountType: input.accountType,
      },
    });

    return ok({ entryId: result.data.id });
  }
}

export const ledgerAdminService = new LedgerAdminService();
