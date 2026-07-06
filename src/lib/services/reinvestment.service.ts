import { and, eq, max } from "drizzle-orm";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import { getDb } from "@/db";
import { schema } from "@/db/schema";
import { investmentPlans, investments, ledgerEntries } from "@/db/schema";
import { FEATURE_FLAGS } from "@/lib/constants/feature-flags";
import { auditService } from "./audit.service";
import { featureFlagService } from "./feature-flags.service";
import { guardDatabase } from "./infrastructure-guard";
import { investmentEngine } from "./investment-engine.service";
import { investmentPlanService } from "./investment-plan.service";
import { notificationService } from "./notification.service";
import { walletService } from "./wallet.service";
import { fail, ok } from "./base";
import type { ActorContext, ServiceResult } from "./types";

type Db = PostgresJsDatabase<typeof schema>;

export type ReinvestInput = {
  profileId: string;
  planId: string;
  amount: string;
  idempotencyKey: string;
  parentInvestmentId?: string;
  actor?: ActorContext;
};

export class ReinvestmentService {
  async reinvest(input: ReinvestInput): Promise<ServiceResult<{ investmentId: string }>> {
    const infra = guardDatabase<{ investmentId: string }>();
    if (infra) return infra;

    const maintenance = await featureFlagService.isMaintenanceMode();
    if (maintenance) return fail("MAINTENANCE_MODE", "Platform is in maintenance mode");

    const investmentsEnabled = await featureFlagService.requireEnabled(
      FEATURE_FLAGS.INVESTMENTS_ENABLED,
    );
    if (!investmentsEnabled.success) return investmentsEnabled;

    const amount = parseFloat(input.amount);
    if (Number.isNaN(amount) || amount <= 0) {
      return fail("INVALID_AMOUNT", "Amount must be greater than zero");
    }

    const planResult = await investmentPlanService.getById(input.planId);
    if (!planResult.success) return planResult;

    const plan = planResult.data;
    if (!plan) return fail("PLAN_NOT_FOUND", "Plan not found");

    const minAmount = parseFloat(plan.minDeposit);
    const maxAmount = plan.maxDeposit ? parseFloat(plan.maxDeposit) : Infinity;
    if (amount < minAmount) {
      return fail("AMOUNT_TOO_LOW", `Minimum is ${minAmount.toFixed(2)}`);
    }
    if (amount > maxAmount) {
      return fail("AMOUNT_TOO_HIGH", `Maximum is ${maxAmount.toFixed(2)}`);
    }

    const balanceResult = await walletService.getAvailableBalance(input.profileId);
    if (!balanceResult.success) return balanceResult;
    if (amount > parseFloat(balanceResult.data)) {
      return fail("INSUFFICIENT_FUNDS", "Insufficient available balance");
    }

    const db = getDb();

    const [existingLedger] = await db
      .select({ id: ledgerEntries.id })
      .from(ledgerEntries)
      .where(eq(ledgerEntries.idempotencyKey, input.idempotencyKey))
      .limit(1);

    if (existingLedger) {
      return fail("DUPLICATE_REQUEST", "This reinvestment was already processed");
    }

    try {
      const [planRow] = await db
        .select()
        .from(investmentPlans)
        .where(eq(investmentPlans.id, input.planId))
        .limit(1);

      if (!planRow?.reinvestEnabled) {
        return fail("REINVEST_DISABLED", "Reinvestment is not enabled for this plan");
      }

      const [cycleRow] = await db
        .select({ maxCycle: max(investments.reinvestCycle) })
        .from(investments)
        .where(
          and(eq(investments.profileId, input.profileId), eq(investments.planId, input.planId)),
        );

      const maxCycle = cycleRow?.maxCycle ?? 0;
      if (maxCycle >= planRow.maxReinvestCycles) {
        return fail("REINVEST_LIMIT", "Maximum reinvestment cycles reached for this plan");
      }

      let investmentId = "";

      await db.transaction(async (tx) => {
        const result = await investmentEngine.activateInvestmentInTransaction(tx as Db, {
          profileId: input.profileId,
          planId: input.planId,
          principalAmount: input.amount,
          currency: planRow.currency ?? "USD",
          parentInvestmentId: input.parentInvestmentId,
          reinvestCycle: maxCycle + 1,
          actor: input.actor ?? { profileId: input.profileId },
        });
        investmentId = result.investmentId;
      });

      await auditService.log({
        action: "create",
        entityType: "investment",
        entityId: investmentId,
        actor: input.actor ?? { profileId: input.profileId },
        metadata: { type: "reinvestment", amount: input.amount, planId: input.planId },
      });

      await notificationService.createNotification({
        profileId: input.profileId,
        channel: "in_app",
        eventType: "investment.reinvested",
        title: "Reinvestment completed",
        body: `${input.amount} ${planRow.currency ?? "USD"} has been reinvested into ${plan.name}.`,
        payload: { investmentId },
      });

      return ok({ investmentId });
    } catch (error) {
      return fail("REINVEST_ERROR", "Failed to reinvest", error);
    }
  }
}

export const reinvestmentService = new ReinvestmentService();
