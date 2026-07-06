import { count, desc, eq, gte, sql } from "drizzle-orm";
import { getDb } from "@/db";
import {
  profiles,
  referralCommissions,
  referralRelationships,
} from "@/db/schema";
import { guardDatabase } from "./infrastructure-guard";
import { fail, ok } from "./base";
import type { PaginatedResult, ServiceResult } from "./types";

export type ReferralGraphNode = {
  profileId: string;
  fullName: string;
  email: string;
  referralCode: string;
  directReferrals: number;
  totalCommissions: string;
};

export type CommissionHistoryItem = {
  id: string;
  referrerName: string;
  referredName: string;
  commissionAmount: string;
  commissionPercent: string;
  investmentId: string | null;
  createdAt: Date;
};

export class ReferralAdminService {
  async getOverview(): Promise<
    ServiceResult<{
      totalRelationships: number;
      totalCommissionsPaid: string;
      commissionsToday: string;
      topReferrers: ReferralGraphNode[];
    }>
  > {
    const infra = guardDatabase<{
      totalRelationships: number;
      totalCommissionsPaid: string;
      commissionsToday: string;
      topReferrers: ReferralGraphNode[];
    }>();
    if (infra) return infra;

    try {
      const db = getDb();
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const [[relCount], [totalPaid], [todayPaid], topReferrers] = await Promise.all([
        db.select({ count: count() }).from(referralRelationships),
        db
          .select({
            total: sql<string>`COALESCE(SUM(${referralCommissions.commissionAmount}), 0)`,
          })
          .from(referralCommissions),
        db
          .select({
            total: sql<string>`COALESCE(SUM(${referralCommissions.commissionAmount}), 0)`,
          })
          .from(referralCommissions)
          .where(gte(referralCommissions.createdAt, today)),
        db
          .select({
            profileId: profiles.id,
            fullName: profiles.fullName,
            email: profiles.email,
            referralCode: profiles.referralCode,
            directReferrals: sql<number>`(
              SELECT COUNT(*) FROM referral_relationships rr
              WHERE rr.referrer_profile_id = ${profiles.id}
            )`,
            totalCommissions: sql<string>`COALESCE((
              SELECT SUM(rc.commission_amount) FROM referral_commissions rc
              WHERE rc.referrer_profile_id = ${profiles.id}
            ), 0)`,
          })
          .from(profiles)
          .where(
            sql`EXISTS (SELECT 1 FROM referral_relationships rr WHERE rr.referrer_profile_id = ${profiles.id})`,
          )
          .orderBy(desc(sql`(
            SELECT COALESCE(SUM(rc.commission_amount), 0) FROM referral_commissions rc
            WHERE rc.referrer_profile_id = ${profiles.id}
          )`))
          .limit(10),
      ]);

      return ok({
        totalRelationships: relCount?.count ?? 0,
        totalCommissionsPaid: totalPaid?.total ?? "0.00",
        commissionsToday: todayPaid?.total ?? "0.00",
        topReferrers: topReferrers.map((r) => ({
          profileId: r.profileId,
          fullName: r.fullName,
          email: r.email,
          referralCode: r.referralCode,
          directReferrals: Number(r.directReferrals),
          totalCommissions: r.totalCommissions,
        })),
      });
    } catch (error) {
      return fail("REFERRAL_OVERVIEW_ERROR", "Failed to load referral overview", error);
    }
  }

  async listCommissions(
    page = 1,
    pageSize = 20,
  ): Promise<ServiceResult<PaginatedResult<CommissionHistoryItem>>> {
    const infra = guardDatabase<PaginatedResult<CommissionHistoryItem>>();
    if (infra) return infra;

    try {
      const db = getDb();
      const offset = (page - 1) * pageSize;

      const [totalRow] = await db.select({ count: count() }).from(referralCommissions);

      const rows = await db
        .select({
          commission: referralCommissions,
          referrerName: sql<string>`(SELECT full_name FROM profiles WHERE id = ${referralCommissions.referrerProfileId})`,
          referredName: sql<string>`(SELECT full_name FROM profiles WHERE id = ${referralCommissions.referredProfileId})`,
        })
        .from(referralCommissions)
        .orderBy(desc(referralCommissions.createdAt))
        .limit(pageSize)
        .offset(offset);

      const items: CommissionHistoryItem[] = rows.map((r) => ({
        id: r.commission.id,
        referrerName: r.referrerName,
        referredName: r.referredName,
        commissionAmount: r.commission.commissionAmount,
        commissionPercent: r.commission.commissionPercent,
        investmentId: r.commission.investmentId,
        createdAt: r.commission.createdAt,
      }));

      const total = totalRow?.count ?? 0;

      return ok({ items, page, pageSize, total, totalPages: Math.ceil(total / pageSize) });
    } catch (error) {
      return fail("COMMISSION_LIST_ERROR", "Failed to list commissions", error);
    }
  }

  async getReferralTree(profileId: string): Promise<
    ServiceResult<{
      referrer: { fullName: string; email: string } | null;
      directReferrals: Array<{ profileId: string; fullName: string; email: string; createdAt: Date }>;
    }>
  > {
    const infra = guardDatabase<{
      referrer: { fullName: string; email: string } | null;
      directReferrals: Array<{ profileId: string; fullName: string; email: string; createdAt: Date }>;
    }>();
    if (infra) return infra;

    try {
      const db = getDb();

      const [profile] = await db
        .select({ referredByProfileId: profiles.referredByProfileId })
        .from(profiles)
        .where(eq(profiles.id, profileId))
        .limit(1);

      let referrer: { fullName: string; email: string } | null = null;
      if (profile?.referredByProfileId) {
        const [ref] = await db
          .select({ fullName: profiles.fullName, email: profiles.email })
          .from(profiles)
          .where(eq(profiles.id, profile.referredByProfileId))
          .limit(1);
        referrer = ref ?? null;
      }

      const directReferrals = await db
        .select({
          profileId: profiles.id,
          fullName: profiles.fullName,
          email: profiles.email,
          createdAt: referralRelationships.createdAt,
        })
        .from(referralRelationships)
        .innerJoin(profiles, eq(referralRelationships.referredProfileId, profiles.id))
        .where(eq(referralRelationships.referrerProfileId, profileId))
        .orderBy(desc(referralRelationships.createdAt));

      return ok({ referrer, directReferrals });
    } catch (error) {
      return fail("REFERRAL_TREE_ERROR", "Failed to load referral tree", error);
    }
  }
}

export const referralAdminService = new ReferralAdminService();
