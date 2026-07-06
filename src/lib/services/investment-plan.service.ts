import { and, asc, eq, isNull } from "drizzle-orm";
import { getDb } from "@/db";
import { investmentPlans } from "@/db/schema";
import { auditService } from "./audit.service";
import { guardDatabase } from "./infrastructure-guard";
import { fail, ok } from "./base";
import type { ServiceResult } from "./types";
export type InvestmentPlanView = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  dailyRoiPercent: string;
  maxRoiPercent: string | null;
  minDeposit: string;
  maxDeposit: string | null;
  durationDays: number;
  lockPeriodDays: number;
  referralCommissionPercent?: string;
  currency?: string;
  compounding?: boolean;
  reinvestEnabled?: boolean;
};

export type PublicPlanView = InvestmentPlanView & {
  referralCommissionPercent: string;
  currency: string;
  isVisible: boolean;
  sortOrder: number;
};

export type AdminPlanView = PublicPlanView & {
  isActive: boolean;
  maxReinvestCycles: number;
  gracePeriodDays: number;
  updatedAt: Date;
};

export type PlanInput = {
  slug: string;
  name: string;
  description?: string;
  dailyRoiPercent: string;
  maxRoiPercent?: string;
  minDeposit: string;
  maxDeposit?: string;
  durationDays: number;
  lockPeriodDays?: number;
  referralCommissionPercent?: string;
  currency?: string;
  compounding?: boolean;
  reinvestEnabled?: boolean;
  maxReinvestCycles?: number;
  gracePeriodDays?: number;
  isVisible?: boolean;
  isActive?: boolean;
  sortOrder?: number;
};

export class InvestmentPlanService {
  async listActive(): Promise<ServiceResult<InvestmentPlanView[]>> {
    const infra = guardDatabase<InvestmentPlanView[]>();
    if (infra) return infra;

    try {
      const db = getDb();
      const rows = await db
        .select()
        .from(investmentPlans)
        .where(and(eq(investmentPlans.isActive, true), isNull(investmentPlans.deletedAt)))
        .orderBy(asc(investmentPlans.sortOrder));

      return ok(
        rows.map((p) => ({
          id: p.id,
          slug: p.slug,
          name: p.name,
          description: p.description,
          dailyRoiPercent: p.dailyRoiPercent,
          maxRoiPercent: p.maxRoiPercent,
          minDeposit: p.minDeposit,
          maxDeposit: p.maxDeposit,
          durationDays: p.durationDays,
          lockPeriodDays: p.lockPeriodDays,
        })),
      );
    } catch (error) {
      return fail("PLANS_ERROR", "Failed to load investment plans", error);
    }
  }

  async listVisible(): Promise<ServiceResult<PublicPlanView[]>> {
    const infra = guardDatabase<PublicPlanView[]>();
    if (infra) return infra;

    try {
      const db = getDb();
      const rows = await db
        .select()
        .from(investmentPlans)
        .where(
          and(
            eq(investmentPlans.isActive, true),
            eq(investmentPlans.isVisible, true),
            isNull(investmentPlans.deletedAt),
          ),
        )
        .orderBy(asc(investmentPlans.sortOrder));

      return ok(
        rows.map((p) => ({
          id: p.id,
          slug: p.slug,
          name: p.name,
          description: p.description,
          dailyRoiPercent: p.dailyRoiPercent,
          maxRoiPercent: p.maxRoiPercent,
          minDeposit: p.minDeposit,
          maxDeposit: p.maxDeposit,
          durationDays: p.durationDays,
          lockPeriodDays: p.lockPeriodDays,
          referralCommissionPercent: p.referralCommissionPercent,
          currency: p.currency,
          compounding: p.compounding,
          reinvestEnabled: p.reinvestEnabled,
          isVisible: p.isVisible,
          sortOrder: p.sortOrder,
        })),
      );
    } catch (error) {
      return fail("PLANS_ERROR", "Failed to load investment plans", error);
    }
  }

  async getById(planId: string): Promise<ServiceResult<InvestmentPlanView | null>> {
    const infra = guardDatabase<InvestmentPlanView>();
    if (infra) return infra;

    try {
      const db = getDb();
      const [plan] = await db
        .select()
        .from(investmentPlans)
        .where(
          and(
            eq(investmentPlans.id, planId),
            eq(investmentPlans.isActive, true),
            isNull(investmentPlans.deletedAt),
          ),
        )
        .limit(1);

      if (!plan) {
        return ok(null);
      }

      return ok({
        id: plan.id,
        slug: plan.slug,
        name: plan.name,
        description: plan.description,
        dailyRoiPercent: plan.dailyRoiPercent,
        maxRoiPercent: plan.maxRoiPercent,
        minDeposit: plan.minDeposit,
        maxDeposit: plan.maxDeposit,
        durationDays: plan.durationDays,
        lockPeriodDays: plan.lockPeriodDays,
      });
    } catch (error) {
      return fail("PLAN_ERROR", "Failed to load investment plan", error);
    }
  }

  async listAllAdmin(): Promise<ServiceResult<AdminPlanView[]>> {
    const infra = guardDatabase<AdminPlanView[]>();
    if (infra) return infra;

    try {
      const db = getDb();
      const rows = await db
        .select()
        .from(investmentPlans)
        .where(isNull(investmentPlans.deletedAt))
        .orderBy(asc(investmentPlans.sortOrder));

      return ok(rows.map((p) => this.toAdminView(p)));
    } catch (error) {
      return fail("PLANS_ERROR", "Failed to load plans", error);
    }
  }

  async getAdminById(planId: string): Promise<ServiceResult<AdminPlanView | null>> {
    const infra = guardDatabase<AdminPlanView | null>();
    if (infra) return infra;

    try {
      const db = getDb();
      const [plan] = await db
        .select()
        .from(investmentPlans)
        .where(and(eq(investmentPlans.id, planId), isNull(investmentPlans.deletedAt)))
        .limit(1);

      return ok(plan ? this.toAdminView(plan) : null);
    } catch (error) {
      return fail("PLAN_ERROR", "Failed to load plan", error);
    }
  }

  async createPlan(input: PlanInput & { adminUserId: string }): Promise<ServiceResult<{ id: string }>> {
    try {
      const db = getDb();
      const { adminUserId, ...plan } = input;

      const [row] = await db
        .insert(investmentPlans)
        .values({
          slug: plan.slug,
          name: plan.name,
          description: plan.description,
          dailyRoiPercent: plan.dailyRoiPercent,
          maxRoiPercent: plan.maxRoiPercent,
          minDeposit: plan.minDeposit,
          maxDeposit: plan.maxDeposit,
          durationDays: plan.durationDays,
          lockPeriodDays: plan.lockPeriodDays ?? 5,
          referralCommissionPercent: plan.referralCommissionPercent ?? "10",
          currency: plan.currency ?? "USD",
          compounding: plan.compounding ?? false,
          reinvestEnabled: plan.reinvestEnabled ?? true,
          maxReinvestCycles: plan.maxReinvestCycles ?? 2,
          gracePeriodDays: plan.gracePeriodDays ?? 0,
          isVisible: plan.isVisible ?? true,
          isActive: plan.isActive ?? true,
          sortOrder: plan.sortOrder ?? 0,
        })
        .returning({ id: investmentPlans.id });

      await auditService.log({
        action: "create",
        entityType: "investment_plan",
        entityId: row.id,
        actor: { adminUserId },
        metadata: { slug: plan.slug, name: plan.name },
      });

      return ok({ id: row.id });
    } catch (error) {
      return fail("PLAN_CREATE_ERROR", "Failed to create plan", error);
    }
  }

  async updatePlan(
    planId: string,
    input: Partial<PlanInput> & { adminUserId: string },
  ): Promise<ServiceResult<void>> {
    try {
      const db = getDb();
      const { adminUserId, ...updates } = input;
      delete (updates as Partial<PlanInput>).slug;

      await db
        .update(investmentPlans)
        .set({ ...updates, updatedAt: new Date() })
        .where(eq(investmentPlans.id, planId));

      await auditService.log({
        action: "update",
        entityType: "investment_plan",
        entityId: planId,
        actor: { adminUserId },
        metadata: updates,
      });

      return ok(undefined);
    } catch (error) {
      return fail("PLAN_UPDATE_ERROR", "Failed to update plan", error);
    }
  }

  async archivePlan(planId: string, adminUserId: string): Promise<ServiceResult<void>> {
    try {
      const db = getDb();
      await db
        .update(investmentPlans)
        .set({ deletedAt: new Date(), isActive: false, isVisible: false })
        .where(eq(investmentPlans.id, planId));

      await auditService.log({
        action: "delete",
        entityType: "investment_plan",
        entityId: planId,
        actor: { adminUserId },
        metadata: { action: "archive" },
      });

      return ok(undefined);
    } catch (error) {
      return fail("PLAN_ARCHIVE_ERROR", "Failed to archive plan", error);
    }
  }

  async duplicatePlan(planId: string, adminUserId: string): Promise<ServiceResult<{ id: string }>> {
    const planResult = await this.getAdminById(planId);
    if (!planResult.success) return planResult;
    if (!planResult.data) return fail("PLAN_NOT_FOUND", "Plan not found");

    const p = planResult.data;
    const slug = `${p.slug}-copy-${Date.now().toString(36)}`;

    return this.createPlan({
      adminUserId,
      slug,
      name: `${p.name} (Copy)`,
      description: p.description ?? undefined,
      dailyRoiPercent: p.dailyRoiPercent,
      maxRoiPercent: p.maxRoiPercent ?? undefined,
      minDeposit: p.minDeposit,
      maxDeposit: p.maxDeposit ?? undefined,
      durationDays: p.durationDays,
      lockPeriodDays: p.lockPeriodDays,
      referralCommissionPercent: p.referralCommissionPercent,
      currency: p.currency,
      compounding: p.compounding,
      reinvestEnabled: p.reinvestEnabled,
      maxReinvestCycles: p.maxReinvestCycles,
      gracePeriodDays: p.gracePeriodDays,
      isVisible: false,
      isActive: false,
      sortOrder: p.sortOrder + 1,
    });
  }

  async reorderPlans(
    orders: Array<{ id: string; sortOrder: number }>,
    adminUserId: string,
  ): Promise<ServiceResult<void>> {
    try {
      const db = getDb();
      for (const item of orders) {
        await db
          .update(investmentPlans)
          .set({ sortOrder: item.sortOrder })
          .where(eq(investmentPlans.id, item.id));
      }

      await auditService.log({
        action: "update",
        entityType: "investment_plan",
        actor: { adminUserId },
        metadata: { action: "reorder", orders },
      });

      return ok(undefined);
    } catch (error) {
      return fail("PLAN_REORDER_ERROR", "Failed to reorder plans", error);
    }
  }

  private toAdminView(p: typeof investmentPlans.$inferSelect): AdminPlanView {
    return {
      id: p.id,
      slug: p.slug,
      name: p.name,
      description: p.description,
      dailyRoiPercent: p.dailyRoiPercent,
      maxRoiPercent: p.maxRoiPercent,
      minDeposit: p.minDeposit,
      maxDeposit: p.maxDeposit,
      durationDays: p.durationDays,
      lockPeriodDays: p.lockPeriodDays,
      referralCommissionPercent: p.referralCommissionPercent,
      currency: p.currency,
      compounding: p.compounding,
      reinvestEnabled: p.reinvestEnabled,
      isVisible: p.isVisible,
      sortOrder: p.sortOrder,
      isActive: p.isActive,
      maxReinvestCycles: p.maxReinvestCycles,
      gracePeriodDays: p.gracePeriodDays,
      updatedAt: p.updatedAt,
    };
  }
}

export const investmentPlanService = new InvestmentPlanService();
