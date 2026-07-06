import { and, desc, ilike, isNull, or, sql } from "drizzle-orm";
import { getDb } from "@/db";
import {
  auditLogs,
  depositRequests,
  investments,
  ledgerEntries,
  profiles,
  referralRelationships,
  withdrawalRequests,
} from "@/db/schema";
import { guardDatabase } from "./infrastructure-guard";
import { fail, ok } from "./base";
import type { ServiceResult } from "./types";

export type SearchResultGroup = {
  type: string;
  label: string;
  items: Array<{ id: string; title: string; subtitle: string; href: string }>;
};

export type GlobalSearchResults = {
  query: string;
  groups: SearchResultGroup[];
  totalResults: number;
};

export class AdminSearchService {
  async search(query: string, limit = 5): Promise<ServiceResult<GlobalSearchResults>> {
    const infra = guardDatabase<GlobalSearchResults>();
    if (infra) return infra;

    if (!query.trim() || query.trim().length < 2) {
      return ok({ query, groups: [], totalResults: 0 });
    }

    const q = `%${query.trim()}%`;

    try {
      const db = getDb();
      const groups: SearchResultGroup[] = [];

      const [users, deposits, withdrawals, invs, ledger, audits, referrals] =
        await Promise.all([
          db
            .select({ id: profiles.id, fullName: profiles.fullName, email: profiles.email })
            .from(profiles)
            .where(
              and(
                isNull(profiles.deletedAt),
                or(
                  ilike(profiles.fullName, q),
                  ilike(profiles.email, q),
                  ilike(profiles.username, q),
                )!,
              ),
            )
            .limit(limit),
          db
            .select({
              id: depositRequests.id,
              ref: depositRequests.externalTransactionRef,
              amount: depositRequests.amount,
            })
            .from(depositRequests)
            .where(ilike(depositRequests.externalTransactionRef, q))
            .limit(limit),
          db
            .select({
              id: withdrawalRequests.id,
              wallet: withdrawalRequests.walletAddress,
              amount: withdrawalRequests.amount,
            })
            .from(withdrawalRequests)
            .where(ilike(withdrawalRequests.walletAddress, q))
            .limit(limit),
          db
            .select({ id: investments.id, amount: investments.principalAmount })
            .from(investments)
            .where(sql`${investments.id}::text ILIKE ${q}`)
            .limit(limit),
          db
            .select({
              id: ledgerEntries.id,
              ref: ledgerEntries.referenceId,
              description: ledgerEntries.description,
            })
            .from(ledgerEntries)
            .where(
              or(
                ilike(ledgerEntries.referenceId, q),
                ilike(ledgerEntries.idempotencyKey, q),
                ilike(ledgerEntries.description, q),
              )!,
            )
            .limit(limit),
          db
            .select({ id: auditLogs.id, entityType: auditLogs.entityType, entityId: auditLogs.entityId })
            .from(auditLogs)
            .where(or(ilike(auditLogs.entityId, q), ilike(auditLogs.entityType, q))!)
            .orderBy(desc(auditLogs.createdAt))
            .limit(limit),
          db
            .select({ id: referralRelationships.id, code: referralRelationships.referralCodeUsed })
            .from(referralRelationships)
            .where(ilike(referralRelationships.referralCodeUsed, q))
            .limit(limit),
        ]);

      if (users.length) {
        groups.push({
          type: "users",
          label: "Customers",
          items: users.map((u) => ({
            id: u.id,
            title: u.fullName,
            subtitle: u.email,
            href: `/hard/auth/customers/${u.id}`,
          })),
        });
      }

      if (deposits.length) {
        groups.push({
          type: "deposits",
          label: "Deposits",
          items: deposits.map((d) => ({
            id: d.id,
            title: d.ref,
            subtitle: d.amount,
            href: `/hard/auth/deposits/${d.id}`,
          })),
        });
      }

      if (withdrawals.length) {
        groups.push({
          type: "withdrawals",
          label: "Withdrawals",
          items: withdrawals.map((w) => ({
            id: w.id,
            title: w.wallet ?? w.id.slice(0, 8),
            subtitle: w.amount,
            href: `/hard/auth/withdrawals/${w.id}`,
          })),
        });
      }

      if (invs.length) {
        groups.push({
          type: "investments",
          label: "Investments",
          items: invs.map((i) => ({
            id: i.id,
            title: i.id.slice(0, 8),
            subtitle: i.amount,
            href: `/hard/auth/investments/${i.id}`,
          })),
        });
      }

      if (ledger.length) {
        groups.push({
          type: "ledger",
          label: "Ledger",
          items: ledger.map((l) => ({
            id: l.id,
            title: l.description ?? l.id.slice(0, 8),
            subtitle: l.ref ?? "",
            href: `/hard/auth/ledger?entry=${l.id}`,
          })),
        });
      }

      if (audits.length) {
        groups.push({
          type: "audit",
          label: "Audit",
          items: audits.map((a) => ({
            id: a.id,
            title: `${a.entityType}`,
            subtitle: a.entityId ?? "",
            href: `/hard/auth/audit?id=${a.id}`,
          })),
        });
      }

      if (referrals.length) {
        groups.push({
          type: "referrals",
          label: "Referrals",
          items: referrals.map((r) => ({
            id: r.id,
            title: r.code,
            subtitle: "Referral relationship",
            href: `/hard/auth/referrals`,
          })),
        });
      }

      const totalResults = groups.reduce((sum, g) => sum + g.items.length, 0);

      return ok({ query, groups, totalResults });
    } catch (error) {
      return fail("SEARCH_ERROR", "Search failed", error);
    }
  }
}

export const adminSearchService = new AdminSearchService();
