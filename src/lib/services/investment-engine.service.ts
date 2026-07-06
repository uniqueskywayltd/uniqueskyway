import { and, eq, isNull, lte } from "drizzle-orm";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import { getDb } from "@/db";
import { schema } from "@/db/schema";
import {
  investmentPlans,
  investments,
  ledgerEntries,
  referralRelationships,
  referralCommissions,
} from "@/db/schema";
import { auditService } from "./audit.service";
import { guardDatabase } from "./infrastructure-guard";
import { investmentEventService } from "./investment-event.service";
import { ledgerService } from "./ledger.service";
import { notificationService } from "./notification.service";
import { fail, ok } from "./base";
import type { ActorContext, ServiceResult } from "./types";

type Db = PostgresJsDatabase<typeof schema>;

export type RoiPreview = {
  investmentId: string;
  currentRoiEarned: string;
  dailyEarnings: string;
  nextAccrualDate: string | null;
  remainingDays: number;
  estimatedMaturityValue: string;
  progressPercent: number;
  principalAmount: string;
  status: string;
};

export type ActivateInvestmentInput = {
  profileId: string;
  planId: string;
  principalAmount: string;
  currency?: string;
  depositRequestId?: string;
  paymentMethod?: string;
  externalTransactionRef?: string;
  approvedByAdminId?: string;
  parentInvestmentId?: string;
  reinvestCycle?: number;
  actor?: ActorContext;
};

function parseNum(v: string | number | null | undefined): number {
  if (v === null || v === undefined) return 0;
  const n = typeof v === "string" ? parseFloat(v) : v;
  return Number.isNaN(n) ? 0 : n;
}

function formatMoney(n: number): string {
  return n.toFixed(2);
}

function dateKey(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function addDays(d: Date, days: number): Date {
  const r = new Date(d);
  r.setDate(r.getDate() + days);
  return r;
}

export class InvestmentEngine {
  calculateDailyRoi(
    principal: number,
    accrued: number,
    dailyRoiPercent: number,
    compounding: boolean,
  ): number {
    const base = compounding ? principal + accrued : principal;
    return (base * dailyRoiPercent) / 100;
  }

  calculateRoiPreview(
    investment: typeof investments.$inferSelect,
    plan: typeof investmentPlans.$inferSelect,
  ): RoiPreview {
    const principal = parseNum(investment.principalAmount);
    const accrued = parseNum(investment.accruedInterest);
    const daily = this.calculateDailyRoi(
      principal,
      accrued,
      parseNum(plan.dailyRoiPercent),
      plan.compounding,
    );

    let remainingDays = plan.durationDays;
    if (investment.startedAt && investment.maturesAt) {
      remainingDays = Math.max(
        0,
        Math.ceil((investment.maturesAt.getTime() - Date.now()) / (86400000)),
      );
    }

    const maxRoi = parseNum(plan.maxRoiPercent);
    const maxTotal = maxRoi > 0 ? (principal * maxRoi) / 100 : daily * plan.durationDays;
    const estimatedMaturity = principal + Math.min(accrued + daily * remainingDays, maxTotal - accrued);

    const progressPercent =
      plan.durationDays > 0
        ? Math.min(100, Math.round(((plan.durationDays - remainingDays) / plan.durationDays) * 100))
        : 0;

    let nextAccrualDate: string | null = null;
    if (investment.status === "active" && !investment.isPaused) {
      const next = investment.lastAccrualAt
        ? addDays(investment.lastAccrualAt, 1)
        : investment.startedAt
          ? addDays(investment.startedAt, plan.lockPeriodDays + 1)
          : null;
      if (next) nextAccrualDate = dateKey(next);
    }

    return {
      investmentId: investment.id,
      currentRoiEarned: investment.accruedInterest,
      dailyEarnings: formatMoney(daily),
      nextAccrualDate,
      remainingDays,
      estimatedMaturityValue: formatMoney(Math.max(principal, estimatedMaturity)),
      progressPercent,
      principalAmount: investment.principalAmount,
      status: investment.status,
    };
  }

  async getRoiPreviewForProfile(
    profileId: string,
    investmentId: string,
  ): Promise<ServiceResult<RoiPreview>> {
    const infra = guardDatabase<RoiPreview>();
    if (infra) return infra;

    try {
      const db = getDb();
      const [row] = await db
        .select({ investment: investments, plan: investmentPlans })
        .from(investments)
        .innerJoin(investmentPlans, eq(investments.planId, investmentPlans.id))
        .where(and(eq(investments.id, investmentId), eq(investments.profileId, profileId)))
        .limit(1);

      if (!row) return fail("INVESTMENT_NOT_FOUND", "Investment not found");
      return ok(this.calculateRoiPreview(row.investment, row.plan));
    } catch (error) {
      return fail("ROI_PREVIEW_ERROR", "Failed to calculate ROI preview", error);
    }
  }

  async activateInvestmentInTransaction(
    tx: Db,
    input: ActivateInvestmentInput,
  ): Promise<{ investmentId: string }> {
    const [plan] = await tx
      .select()
      .from(investmentPlans)
      .where(eq(investmentPlans.id, input.planId))
      .limit(1);
    if (!plan) throw new Error("PLAN_NOT_FOUND");

    const startedAt = new Date();
    const maturesAt = addDays(startedAt, plan.durationDays);
    const amount = input.principalAmount;
    const currency = input.currency ?? plan.currency ?? "USD";
    const actor = input.actor ?? {};

    const [investment] = await tx
      .insert(investments)
      .values({
        profileId: input.profileId,
        planId: input.planId,
        principalAmount: amount,
        status: "active",
        paymentMethod: input.paymentMethod,
        externalTransactionRef: input.externalTransactionRef,
        startedAt,
        maturesAt,
        activatedAt: startedAt,
        depositRequestId: input.depositRequestId,
        approvedByAdminId: input.approvedByAdminId,
        parentInvestmentId: input.parentInvestmentId,
        reinvestCycle: input.reinvestCycle ?? 0,
      })
      .returning({ id: investments.id });

    await ledgerService.postEntryInTransaction(tx, {
      profileId: input.profileId,
      accountType: "available",
      direction: "debit",
      amount,
      entryType: "investment_principal",
      idempotencyKey: `investment-activate-${investment.id}-debit-available`,
      referenceType: "investment",
      referenceId: investment.id,
      description: `Investment principal — ${plan.name}`,
      actor,
      currency,
    });

    await ledgerService.postEntryInTransaction(tx, {
      profileId: input.profileId,
      accountType: "invested",
      direction: "credit",
      amount,
      entryType: "investment_principal",
      idempotencyKey: `investment-activate-${investment.id}-credit-invested`,
      referenceType: "investment",
      referenceId: investment.id,
      description: `Investment principal locked — ${plan.name}`,
      actor,
      currency,
    });

    await investmentEventService.record({
      investmentId: investment.id,
      profileId: input.profileId,
      eventType: input.parentInvestmentId ? "reinvested" : "activated",
      title: input.parentInvestmentId ? "Investment reinvested" : "Investment activated",
      description: `${plan.name} — ${amount} ${currency}`,
      amount,
    });

    await this.payReferralCommissionInTransaction(tx, investment.id, actor);

    return { investmentId: investment.id };
  }

  async payReferralCommissionInTransaction(
    tx: Db,
    investmentId: string,
    actor?: ActorContext,
  ): Promise<void> {
    const [investment] = await tx
      .select()
      .from(investments)
      .where(eq(investments.id, investmentId))
      .for("update");

    if (!investment || investment.referralCommissionPaid) return;

    const [plan] = await tx
      .select()
      .from(investmentPlans)
      .where(eq(investmentPlans.id, investment.planId))
      .limit(1);
    if (!plan) return;

    const [relationship] = await tx
      .select()
      .from(referralRelationships)
      .where(eq(referralRelationships.referredProfileId, investment.profileId))
      .limit(1);

    if (!relationship) return;

    const commissionPercent = parseNum(plan.referralCommissionPercent);
    if (commissionPercent <= 0) return;

    const principal = parseNum(investment.principalAmount);
    const commissionAmount = formatMoney((principal * commissionPercent) / 100);
    const idempotencyKey = `referral-commission-${investmentId}`;

    const [existing] = await tx
      .select({ id: referralCommissions.id })
      .from(referralCommissions)
      .where(eq(referralCommissions.idempotencyKey, idempotencyKey))
      .limit(1);
    if (existing) return;

    await ledgerService.postEntryInTransaction(tx, {
      profileId: relationship.referrerProfileId,
      accountType: "referral",
      direction: "credit",
      amount: commissionAmount,
      entryType: "referral_commission",
      idempotencyKey,
      referenceType: "investment",
      referenceId: investmentId,
      description: `Referral commission — investment ${investmentId.slice(0, 8)}`,
      actor,
      currency: plan.currency ?? "USD",
    });

    await tx.insert(referralCommissions).values({
      referrerProfileId: relationship.referrerProfileId,
      referredProfileId: investment.profileId,
      investmentId,
      depositRequestId: investment.depositRequestId,
      commissionPercent: plan.referralCommissionPercent,
      commissionAmount,
      idempotencyKey,
      status: "paid",
    });

    await tx
      .update(investments)
      .set({ referralCommissionPaid: true })
      .where(eq(investments.id, investmentId));
  }

  async accrueRoiForInvestment(
    investmentId: string,
    accrualDate: Date,
    options: { dryRun?: boolean; actor?: ActorContext } = {},
  ): Promise<ServiceResult<{ amount: string; matured: boolean }>> {
    const infra = guardDatabase<{ amount: string; matured: boolean }>();
    if (infra) return infra;

    try {
      const db = getDb();
      let resultAmount = "0.00";
      let matured = false;

      await db.transaction(async (tx) => {
        const r = await this.accrueRoiInTransaction(
          tx as Db,
          investmentId,
          accrualDate,
          options,
        );
        resultAmount = r.amount;
        matured = r.matured;
      });

      return ok({ amount: resultAmount, matured });
    } catch (error) {
      if (error instanceof Error && error.message === "ALREADY_ACCRUED") {
        return ok({ amount: "0.00", matured: false });
      }
      return fail("ROI_ACCRUE_ERROR", "Failed to accrue ROI", error);
    }
  }

  async accrueRoiInTransaction(
    tx: Db,
    investmentId: string,
    accrualDate: Date,
    options: { dryRun?: boolean; actor?: ActorContext } = {},
  ): Promise<{ amount: string; matured: boolean }> {
    const [row] = await tx
      .select({ investment: investments, plan: investmentPlans })
      .from(investments)
      .innerJoin(investmentPlans, eq(investments.planId, investmentPlans.id))
      .where(eq(investments.id, investmentId))
      .for("update");

    if (!row) throw new Error("INVESTMENT_NOT_FOUND");
    const { investment, plan } = row;

    if (investment.status !== "active" || investment.isPaused) {
      return { amount: "0.00", matured: false };
    }

    if (!investment.startedAt) return { amount: "0.00", matured: false };

    const accrualKey = dateKey(accrualDate);
    const idempotencyKey = `roi-accrual-${investmentId}-${accrualKey}`;

    const [existing] = await tx
      .select({ id: ledgerEntries.id })
      .from(ledgerEntries)
      .where(eq(ledgerEntries.idempotencyKey, idempotencyKey))
      .limit(1);
    if (existing) throw new Error("ALREADY_ACCRUED");

    const lockEnd = addDays(investment.startedAt, plan.lockPeriodDays);
    if (accrualDate < lockEnd) return { amount: "0.00", matured: false };

    if (investment.maturesAt && accrualDate >= investment.maturesAt) {
      await this.matureInvestmentInTransaction(tx, investmentId, options.actor, false);
      return { amount: "0.00", matured: true };
    }

    const principal = parseNum(investment.principalAmount);
    const accrued = parseNum(investment.accruedInterest);
    const totalCredited = parseNum(investment.totalRoiCredited);
    const maxRoi = parseNum(plan.maxRoiPercent);
    const maxTotal = maxRoi > 0 ? (principal * maxRoi) / 100 : Infinity;

    if (totalCredited >= maxTotal) {
      await this.matureInvestmentInTransaction(tx, investmentId, options.actor, false);
      return { amount: "0.00", matured: true };
    }

    let dailyAmount = this.calculateDailyRoi(
      principal,
      accrued,
      parseNum(plan.dailyRoiPercent),
      plan.compounding,
    );

    if (totalCredited + dailyAmount > maxTotal) {
      dailyAmount = maxTotal - totalCredited;
    }

    if (dailyAmount <= 0) {
      await this.matureInvestmentInTransaction(tx, investmentId, options.actor, false);
      return { amount: "0.00", matured: true };
    }

    const amount = formatMoney(dailyAmount);
    const currency = plan.currency ?? "USD";

    if (!options.dryRun) {
      await ledgerService.postEntryInTransaction(tx, {
        profileId: investment.profileId,
        accountType: "available",
        direction: "credit",
        amount,
        entryType: "investment_interest",
        idempotencyKey,
        referenceType: "investment",
        referenceId: investmentId,
        description: `Daily ROI — ${accrualKey}`,
        actor: options.actor,
        currency,
      });

      const newAccrued = accrued + dailyAmount;
      const newTotal = totalCredited + dailyAmount;

      await tx
        .update(investments)
        .set({
          accruedInterest: formatMoney(newAccrued),
          totalRoiCredited: formatMoney(newTotal),
          lastAccrualAt: accrualDate,
        })
        .where(eq(investments.id, investmentId));

      await investmentEventService.record({
        investmentId,
        profileId: investment.profileId,
        eventType: "roi_accrued",
        title: "ROI accrued",
        description: `Daily return for ${accrualKey}`,
        amount,
      });

      if (newTotal >= maxTotal || (investment.maturesAt && accrualDate >= addDays(investment.maturesAt, -1))) {
        const shouldMature =
          investment.maturesAt && accrualDate >= addDays(investment.maturesAt, -plan.gracePeriodDays);
        if (shouldMature || newTotal >= maxTotal) {
          await this.matureInvestmentInTransaction(tx, investmentId, options.actor, false);
          return { amount, matured: true };
        }
      }
    }

    return { amount, matured: false };
  }

  async matureInvestmentInTransaction(
    tx: Db,
    investmentId: string,
    actor?: ActorContext,
    force = false,
  ): Promise<void> {
    const [investment] = await tx
      .select()
      .from(investments)
      .where(eq(investments.id, investmentId))
      .for("update");

    if (!investment || investment.status !== "active") return;

    const amount = investment.principalAmount;
    const currency = "USD";

    await ledgerService.postEntryInTransaction(tx, {
      profileId: investment.profileId,
      accountType: "invested",
      direction: "debit",
      amount,
      entryType: "investment_principal",
      idempotencyKey: `investment-mature-${investmentId}-debit-invested`,
      referenceType: "investment",
      referenceId: investmentId,
      description: `Principal released on maturity`,
      actor,
      currency,
    });

    await ledgerService.postEntryInTransaction(tx, {
      profileId: investment.profileId,
      accountType: "available",
      direction: "credit",
      amount,
      entryType: "investment_principal",
      idempotencyKey: `investment-mature-${investmentId}-credit-available`,
      referenceType: "investment",
      referenceId: investmentId,
      description: `Principal returned on maturity`,
      actor,
      currency,
    });

    await tx
      .update(investments)
      .set({
        status: "matured",
        maturedAt: new Date(),
      })
      .where(eq(investments.id, investmentId));

    await investmentEventService.record({
      investmentId,
      profileId: investment.profileId,
      eventType: force ? "force_matured" : "matured",
      title: force ? "Investment force-matured" : "Investment matured",
      description: `Principal ${amount} returned to available balance`,
      amount,
    });
  }

  async pauseInvestment(
    investmentId: string,
    adminUserId: string,
  ): Promise<ServiceResult<void>> {
    const infra = guardDatabase<void>();
    if (infra) return infra;

    try {
      const db = getDb();
      const [inv] = await db
        .select()
        .from(investments)
        .where(eq(investments.id, investmentId))
        .limit(1);
      if (!inv) return fail("INVESTMENT_NOT_FOUND", "Investment not found");

      await db
        .update(investments)
        .set({ isPaused: true, pausedAt: new Date() })
        .where(eq(investments.id, investmentId));

      await investmentEventService.record({
        investmentId,
        profileId: inv.profileId,
        eventType: "paused",
        title: "Investment paused",
        description: "ROI accrual suspended by administrator",
      });

      await auditService.log({
        action: "update",
        entityType: "investment",
        entityId: investmentId,
        actor: { adminUserId },
        metadata: { action: "pause" },
      });

      return ok(undefined);
    } catch (error) {
      return fail("INVESTMENT_PAUSE_ERROR", "Failed to pause investment", error);
    }
  }

  async resumeInvestment(
    investmentId: string,
    adminUserId: string,
  ): Promise<ServiceResult<void>> {
    const infra = guardDatabase<void>();
    if (infra) return infra;

    try {
      const db = getDb();
      const [inv] = await db
        .select()
        .from(investments)
        .where(eq(investments.id, investmentId))
        .limit(1);
      if (!inv) return fail("INVESTMENT_NOT_FOUND", "Investment not found");

      await db
        .update(investments)
        .set({ isPaused: false, pausedAt: null })
        .where(eq(investments.id, investmentId));

      await investmentEventService.record({
        investmentId,
        profileId: inv.profileId,
        eventType: "resumed",
        title: "Investment resumed",
        description: "ROI accrual re-enabled by administrator",
      });

      await auditService.log({
        action: "update",
        entityType: "investment",
        entityId: investmentId,
        actor: { adminUserId },
        metadata: { action: "resume" },
      });

      return ok(undefined);
    } catch (error) {
      return fail("INVESTMENT_RESUME_ERROR", "Failed to resume investment", error);
    }
  }

  async forceMaturity(
    investmentId: string,
    adminUserId: string,
  ): Promise<ServiceResult<void>> {
    const infra = guardDatabase<void>();
    if (infra) return infra;

    try {
      const db = getDb();
      await db.transaction(async (tx) => {
        await this.matureInvestmentInTransaction(
          tx as Db,
          investmentId,
          { adminUserId },
          true,
        );
      });

      await auditService.log({
        action: "approve",
        entityType: "investment",
        entityId: investmentId,
        actor: { adminUserId },
        metadata: { action: "force_maturity" },
      });

      const [inv] = await db
        .select()
        .from(investments)
        .where(eq(investments.id, investmentId))
        .limit(1);

      if (inv) {
        await notificationService.createNotification({
          profileId: inv.profileId,
          channel: "in_app",
          eventType: "investment.matured",
          title: "Investment matured",
          body: "Your investment has reached maturity. Principal has been returned to your available balance.",
          payload: { investmentId },
        });
      }

      return ok(undefined);
    } catch (error) {
      return fail("FORCE_MATURITY_ERROR", "Failed to force maturity", error);
    }
  }

  async listEligibleForAccrual(asOf: Date = new Date()): Promise<
    ServiceResult<string[]>
  > {
    const infra = guardDatabase<string[]>();
    if (infra) return infra;

    try {
      const db = getDb();
      const rows = await db
        .select({ id: investments.id })
        .from(investments)
        .where(
          and(
            eq(investments.status, "active"),
            eq(investments.isPaused, false),
            isNull(investments.deletedAt),
            lte(investments.startedAt, asOf),
          ),
        );

      return ok(rows.map((r) => r.id));
    } catch (error) {
      return fail("ELIGIBLE_LIST_ERROR", "Failed to list eligible investments", error);
    }
  }
}

export const investmentEngine = new InvestmentEngine();
