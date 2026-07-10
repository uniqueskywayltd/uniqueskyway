import { and, desc, eq, gte, isNull, lte, or } from "drizzle-orm";
import { getDb } from "@/db";
import {
  activityFeed,
  depositRequests,
  investmentPlans,
  investments,
  profiles,
  withdrawalRequests,
} from "@/db/schema";
import {
  ACTIVITY_FEED_CONFIG_DEFAULT,
  type ActivityFeedConfig,
  type ActivityFeedItem,
  type ActivityFeedType,
} from "@/lib/constants/trust-components";
import { FEATURE_FLAGS } from "@/lib/constants/feature-flags";
import { SYSTEM_SETTINGS } from "@/lib/constants/system-settings";
import { maskCustomerName, filterPublicActivityItems, isExcludedActivityName } from "@/lib/utils/activity-feed";
import { featureFlagService } from "./feature-flags.service";
import { settingsService } from "./settings.service";
import { auditService } from "./audit.service";
import { fail, ok } from "./base";
import type { ServiceResult } from "./types";

export type ActivityFeedInput = {
  type: ActivityFeedType;
  title?: string | null;
  customerNameMasked?: string | null;
  city?: string | null;
  country?: string | null;
  amount?: string | null;
  currency?: string;
  investmentPlan?: string | null;
  isVisible?: boolean;
  priority?: number;
  startsAt?: Date | null;
  expiresAt?: Date | null;
};

function toItem(row: {
  id: string;
  type: ActivityFeedType;
  title: string | null;
  customerNameMasked: string | null;
  city: string | null;
  country: string | null;
  amount: string | null;
  currency: string;
  investmentPlan: string | null;
  isSeed: boolean;
  priority: number;
  createdAt: Date;
}): ActivityFeedItem {
  return {
    id: row.id,
    type: row.type,
    title: row.title,
    customerNameMasked: row.customerNameMasked,
    subjectKey: row.customerNameMasked ? `seed:${row.id}` : null,
    city: row.city,
    country: row.country,
    amount: row.amount,
    currency: row.currency,
    investmentPlan: row.investmentPlan,
    isSeed: row.isSeed,
    isPinned: row.priority >= 100,
    occurredAt: row.createdAt.toISOString(),
  };
}

function shuffleNoConsecutive(items: ActivityFeedItem[]): ActivityFeedItem[] {
  if (items.length <= 1) return items;
  const pinned = items.filter((i) => i.isPinned);
  const rest = items.filter((i) => !i.isPinned);
  const pool = [...rest];
  const result: ActivityFeedItem[] = [...pinned];

  while (pool.length > 0) {
    const lastType = result[result.length - 1]?.type;
    let pickIndex = pool.findIndex((item) => item.type !== lastType);
    if (pickIndex === -1) pickIndex = 0;
    result.push(pool.splice(pickIndex, 1)[0]!);
  }

  return result;
}

export class ActivityFeedService {
  async getConfig(): Promise<ActivityFeedConfig> {
    const stored = await settingsService.get<ActivityFeedConfig>(
      SYSTEM_SETTINGS.ACTIVITY_FEED_CONFIG,
    );
    return { ...ACTIVITY_FEED_CONFIG_DEFAULT, ...stored };
  }

  async updateConfig(
    config: Partial<ActivityFeedConfig>,
    adminUserId: string,
  ): Promise<ServiceResult<ActivityFeedConfig>> {
    const current = await this.getConfig();
    const next = { ...current, ...config };
    const result = await settingsService.update(
      SYSTEM_SETTINGS.ACTIVITY_FEED_CONFIG,
      next,
      adminUserId,
    );
    if (!result.success) return result;
    return ok(next);
  }

  async listAdmin(): Promise<ServiceResult<ActivityFeedItem[]>> {
    try {
      const db = getDb();
      const rows = await db
        .select()
        .from(activityFeed)
        .orderBy(desc(activityFeed.priority), desc(activityFeed.createdAt))
        .limit(200);
      return ok(rows.map((r) => toItem({ ...r, type: r.type as ActivityFeedType })));
    } catch (error) {
      return fail("ACTIVITY_FEED_LIST_ERROR", "Failed to load activity feed", error);
    }
  }

  async create(
    input: ActivityFeedInput,
    adminUserId: string,
  ): Promise<ServiceResult<{ id: string }>> {
    try {
      const db = getDb();
      const [row] = await db
        .insert(activityFeed)
        .values({
          type: input.type,
          title: input.title ?? null,
          customerNameMasked: input.customerNameMasked ?? null,
          city: input.city ?? null,
          country: input.country ?? null,
          amount: input.amount ?? null,
          currency: input.currency ?? "USD",
          investmentPlan: input.investmentPlan ?? null,
          isSeed: false,
          isVisible: input.isVisible ?? true,
          priority: input.priority ?? 0,
          startsAt: input.startsAt ?? null,
          expiresAt: input.expiresAt ?? null,
        })
        .returning({ id: activityFeed.id });

      await auditService.log({
        action: "create",
        entityType: "activity_feed",
        entityId: row!.id,
        actor: { adminUserId },
        afterState: input,
      });

      return ok({ id: row!.id });
    } catch (error) {
      return fail("ACTIVITY_FEED_CREATE_ERROR", "Failed to create activity item", error);
    }
  }

  async update(
    id: string,
    input: Partial<ActivityFeedInput>,
    adminUserId: string,
  ): Promise<ServiceResult<void>> {
    try {
      const db = getDb();
      await db
        .update(activityFeed)
        .set({
          ...input,
          updatedAt: new Date(),
        })
        .where(eq(activityFeed.id, id));

      await auditService.log({
        action: "update",
        entityType: "activity_feed",
        entityId: id,
        actor: { adminUserId },
        afterState: input,
      });

      return ok(undefined);
    } catch (error) {
      return fail("ACTIVITY_FEED_UPDATE_ERROR", "Failed to update activity item", error);
    }
  }

  async delete(id: string, adminUserId: string): Promise<ServiceResult<void>> {
    try {
      const db = getDb();
      await db.delete(activityFeed).where(eq(activityFeed.id, id));
      await auditService.log({
        action: "delete",
        entityType: "activity_feed",
        entityId: id,
        actor: { adminUserId },
      });
      return ok(undefined);
    } catch (error) {
      return fail("ACTIVITY_FEED_DELETE_ERROR", "Failed to delete activity item", error);
    }
  }

  async getPublicFeed(): Promise<
    ServiceResult<{
      enabled: boolean;
      items: ActivityFeedItem[];
      config: Pick<
        ActivityFeedConfig,
        "displayDurationMs" | "animationSpeedMs" | "nameCooldownMs" | "initialDelayMs"
      >;
    }>
  > {
    const enabled = await featureFlagService.isEnabled(FEATURE_FLAGS.ACTIVITY_FEED_ENABLED);
    const config = await this.getConfig();

    if (!enabled) {
      return ok({
        enabled: false,
        items: [],
        config: {
          displayDurationMs: config.displayDurationMs,
          animationSpeedMs: config.animationSpeedMs,
          nameCooldownMs: config.nameCooldownMs,
          initialDelayMs: config.initialDelayMs,
        },
      });
    }

    try {
      const real = await this.loadRealActivities(
        config.maxVisibleHistory,
        config.registrationDisplayWindowMs,
      );
      const seedFlag = await featureFlagService.isEnabled(FEATURE_FLAGS.SEED_ACTIVITY_ENABLED);
      const useSeed =
        seedFlag &&
        config.seedEnabled &&
        real.length < config.minimumRealActivityBeforeDisablingSeedData;

      const manualAndSeed = await this.loadStoredActivities(useSeed, config.maxVisibleHistory);
      const merged = filterPublicActivityItems(
        shuffleNoConsecutive([
          ...manualAndSeed.filter((i) => i.isPinned),
          ...real,
          ...manualAndSeed.filter((i) => !i.isPinned),
        ]),
      );

      return ok({
        enabled: true,
        items: merged.slice(0, config.maxVisibleHistory),
        config: {
          displayDurationMs: config.displayDurationMs,
          animationSpeedMs: config.animationSpeedMs,
          nameCooldownMs: config.nameCooldownMs,
          initialDelayMs: config.initialDelayMs,
        },
      });
    } catch (error) {
      return fail("ACTIVITY_FEED_PUBLIC_ERROR", "Failed to load activity feed", error);
    }
  }

  private async loadStoredActivities(
    includeSeed: boolean,
    limit: number,
  ): Promise<ActivityFeedItem[]> {
    const db = getDb();
    const now = new Date();

    const conditions = [
      eq(activityFeed.isVisible, true),
      or(isNull(activityFeed.startsAt), lte(activityFeed.startsAt, now)),
      or(isNull(activityFeed.expiresAt), gte(activityFeed.expiresAt, now)),
    ];
    if (!includeSeed) conditions.push(eq(activityFeed.isSeed, false));

    const rows = await db
      .select()
      .from(activityFeed)
      .where(and(...conditions))
      .orderBy(desc(activityFeed.priority), desc(activityFeed.createdAt))
      .limit(limit);

    return rows.map((r) => toItem({ ...r, type: r.type as ActivityFeedType }));
  }

  private async loadRealActivities(
    limit: number,
    registrationWindowMs: number = ACTIVITY_FEED_CONFIG_DEFAULT.registrationDisplayWindowMs,
  ): Promise<ActivityFeedItem[]> {
    const db = getDb();
    const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const registrationSince = new Date(Date.now() - registrationWindowMs);
    const items: ActivityFeedItem[] = [];

    const recentProfiles = await db
      .select({
        id: profiles.id,
        fullName: profiles.fullName,
        createdAt: profiles.createdAt,
      })
      .from(profiles)
      .where(and(gte(profiles.createdAt, registrationSince), isNull(profiles.deletedAt)))
      .orderBy(desc(profiles.createdAt))
      .limit(15);

    for (const p of recentProfiles) {
      if (isExcludedActivityName(maskCustomerName(p.fullName))) continue;
      items.push({
        id: `real-reg-${p.id}`,
        type: "registration",
        title: "New Member",
        customerNameMasked: maskCustomerName(p.fullName),
        subjectKey: p.id,
        city: null,
        country: "USA",
        amount: null,
        currency: "USD",
        investmentPlan: null,
        isSeed: false,
        isPinned: false,
        occurredAt: p.createdAt.toISOString(),
      });
    }

    const recentDeposits = await db
      .select({
        id: depositRequests.id,
        profileId: profiles.id,
        amount: depositRequests.amount,
        fullName: profiles.fullName,
        createdAt: depositRequests.createdAt,
      })
      .from(depositRequests)
      .innerJoin(profiles, eq(depositRequests.profileId, profiles.id))
      .where(
        and(eq(depositRequests.status, "approved"), gte(depositRequests.createdAt, since)),
      )
      .orderBy(desc(depositRequests.createdAt))
      .limit(15);

    for (const d of recentDeposits) {
      if (isExcludedActivityName(maskCustomerName(d.fullName))) continue;
      items.push({
        id: `real-dep-${d.id}`,
        type: "deposit",
        title: "Deposit",
        customerNameMasked: maskCustomerName(d.fullName),
        subjectKey: d.profileId,
        city: null,
        country: null,
        amount: d.amount,
        currency: "USD",
        investmentPlan: null,
        isSeed: false,
        isPinned: false,
        occurredAt: d.createdAt.toISOString(),
      });
    }

    const recentWithdrawals = await db
      .select({
        id: withdrawalRequests.id,
        profileId: profiles.id,
        amount: withdrawalRequests.amount,
        fullName: profiles.fullName,
        createdAt: withdrawalRequests.createdAt,
      })
      .from(withdrawalRequests)
      .innerJoin(profiles, eq(withdrawalRequests.profileId, profiles.id))
      .where(
        and(eq(withdrawalRequests.status, "completed"), gte(withdrawalRequests.createdAt, since)),
      )
      .orderBy(desc(withdrawalRequests.createdAt))
      .limit(15);

    for (const w of recentWithdrawals) {
      if (isExcludedActivityName(maskCustomerName(w.fullName))) continue;
      items.push({
        id: `real-wd-${w.id}`,
        type: "withdrawal",
        title: "Withdrawal",
        customerNameMasked: maskCustomerName(w.fullName),
        subjectKey: w.profileId,
        city: null,
        country: "USA",
        amount: w.amount,
        currency: "USD",
        investmentPlan: null,
        isSeed: false,
        isPinned: false,
        occurredAt: w.createdAt.toISOString(),
      });
    }

    const recentInvestments = await db
      .select({
        id: investments.id,
        profileId: profiles.id,
        principal: investments.principalAmount,
        fullName: profiles.fullName,
        planName: investmentPlans.name,
        createdAt: investments.createdAt,
      })
      .from(investments)
      .innerJoin(profiles, eq(investments.profileId, profiles.id))
      .innerJoin(investmentPlans, eq(investments.planId, investmentPlans.id))
      .where(gte(investments.createdAt, since))
      .orderBy(desc(investments.createdAt))
      .limit(15);

    for (const inv of recentInvestments) {
      if (isExcludedActivityName(maskCustomerName(inv.fullName))) continue;
      items.push({
        id: `real-inv-${inv.id}`,
        type: "investment",
        title: "Investment",
        customerNameMasked: maskCustomerName(inv.fullName),
        subjectKey: inv.profileId,
        city: null,
        country: null,
        amount: inv.principal,
        currency: "USD",
        investmentPlan: inv.planName,
        isSeed: false,
        isPinned: false,
        occurredAt: inv.createdAt.toISOString(),
      });
    }

    return this.dedupeByPersonAndType(items)
      .sort((a, b) => new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime())
      .slice(0, limit);
  }

  /** Prefer investment over registration when both exist for the same person. */
  private dedupeByPersonAndType(items: ActivityFeedItem[]): ActivityFeedItem[] {
    const bySubject = new Map<string, ActivityFeedItem[]>();
    for (const item of items) {
      const key = item.subjectKey ?? item.id;
      const list = bySubject.get(key) ?? [];
      list.push(item);
      bySubject.set(key, list);
    }

    const result: ActivityFeedItem[] = [];
    for (const group of bySubject.values()) {
      if (group.length === 1) {
        result.push(group[0]!);
        continue;
      }
      const investment = group.find((i) => i.type === "investment");
      const registration = group.find((i) => i.type === "registration");
      if (investment && registration) {
        result.push(registration);
        const rest = group.filter((i) => i !== registration && i.type !== "investment");
        result.push(...rest);
      } else {
        result.push(...group);
      }
    }

    return result;
  }

  async countRealActivities(): Promise<number> {
    const items = await this.loadRealActivities(100);
    return items.length;
  }
}

export const activityFeedService = new ActivityFeedService();
