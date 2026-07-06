import { desc, eq, count } from "drizzle-orm";
import { getDb } from "@/db";
import { investments, roiProcessingRuns } from "@/db/schema";
import type { RoiRunMode } from "@/types/domain";
import { guardDatabase } from "./infrastructure-guard";
import { investmentEngine } from "./investment-engine.service";
import { notificationService } from "./notification.service";
import { fail, ok } from "./base";
import type { ServiceResult } from "./types";

export type RoiRunResult = {
  runId: string;
  investmentsProcessed: number;
  investmentsMatured: number;
  roiGenerated: string;
  errors: Array<{ investmentId?: string; message: string }>;
  durationMs: number;
};

export type RoiSchedulerOptions = {
  mode?: RoiRunMode;
  dryRun?: boolean;
  recovery?: boolean;
  investmentId?: string;
  accrualDate?: Date;
};

export class RoiSchedulerService {
  async run(options: RoiSchedulerOptions = {}): Promise<ServiceResult<RoiRunResult>> {
    const infra = guardDatabase<RoiRunResult>();
    if (infra) return infra;

    const mode: RoiRunMode = options.dryRun
      ? "dry_run"
      : options.recovery
        ? "recovery"
        : options.investmentId
          ? "single"
          : options.mode ?? "daily";

    const accrualDate = options.accrualDate ?? new Date();
    accrualDate.setHours(12, 0, 0, 0);

    const startTime = Date.now();
    const errors: Array<{ investmentId?: string; message: string }> = [];
    let investmentsProcessed = 0;
    let investmentsMatured = 0;
    let roiGenerated = 0;

    try {
      const db = getDb();

      const [run] = await db
        .insert(roiProcessingRuns)
        .values({
          mode,
          status: options.dryRun ? "dry_run" : "running",
          targetInvestmentId: options.investmentId,
          metadata: { recovery: options.recovery ?? false },
        })
        .returning({ id: roiProcessingRuns.id });

      let investmentIds: string[] = [];

      if (options.investmentId) {
        investmentIds = [options.investmentId];
      } else {
        const eligible = await investmentEngine.listEligibleForAccrual(accrualDate);
        if (!eligible.success) {
          await db
            .update(roiProcessingRuns)
            .set({
              status: "failed",
              finishedAt: new Date(),
              errors: [{ message: eligible.error.message }],
              durationMs: Date.now() - startTime,
            })
            .where(eq(roiProcessingRuns.id, run.id));
          return eligible;
        }
        investmentIds = eligible.data;
      }

      for (const investmentId of investmentIds) {
        try {
          const result = await investmentEngine.accrueRoiForInvestment(investmentId, accrualDate, {
            dryRun: options.dryRun,
            actor: { adminUserId: undefined },
          });

          if (!result.success) {
            errors.push({ investmentId, message: result.error.message });
            continue;
          }

          investmentsProcessed++;
          const amt = parseFloat(result.data.amount);
          if (amt > 0) roiGenerated += amt;
          if (result.data.matured) investmentsMatured++;

          if (!options.dryRun && amt > 0) {
            const [inv] = await db
              .select({ profileId: investments.profileId })
              .from(investments)
              .where(eq(investments.id, investmentId))
              .limit(1);

            if (inv) {
              await notificationService.createNotification({
                profileId: inv.profileId,
                channel: "in_app",
                eventType: "investment.roi_accrued",
                title: "Daily ROI credited",
                body: `${result.data.amount} USD has been credited to your available balance.`,
                payload: { investmentId, amount: result.data.amount },
              });
            }
          }

          if (!options.dryRun && result.data.matured) {
            const [inv] = await db
              .select({ profileId: investments.profileId })
              .from(investments)
              .where(eq(investments.id, investmentId))
              .limit(1);

            if (inv) {
              await notificationService.createNotification({
                profileId: inv.profileId,
                channel: "in_app",
                eventType: "investment.matured",
                title: "Investment matured",
                body: "Your investment has matured. Principal has been returned to your available balance.",
                payload: { investmentId },
              });
            }
          }
        } catch (err) {
          errors.push({
            investmentId,
            message: err instanceof Error ? err.message : "Unknown error",
          });
        }
      }

      const durationMs = Date.now() - startTime;
      const status = options.dryRun ? "dry_run" : errors.length ? "completed" : "completed";

      await db
        .update(roiProcessingRuns)
        .set({
          status: errors.length && !options.dryRun ? "failed" : status,
          finishedAt: new Date(),
          investmentsProcessed,
          investmentsMatured,
          roiGenerated: roiGenerated.toFixed(2),
          errors,
          durationMs,
        })
        .where(eq(roiProcessingRuns.id, run.id));

      return ok({
        runId: run.id,
        investmentsProcessed,
        investmentsMatured,
        roiGenerated: roiGenerated.toFixed(2),
        errors,
        durationMs,
      });
    } catch (error) {
      return fail("ROI_SCHEDULER_ERROR", "ROI scheduler failed", error);
    }
  }

  async listRuns(page = 1, pageSize = 20): Promise<
    ServiceResult<{
      items: Array<typeof roiProcessingRuns.$inferSelect>;
      page: number;
      pageSize: number;
      total: number;
      totalPages: number;
    }>
  > {
    const infra = guardDatabase<{
      items: Array<typeof roiProcessingRuns.$inferSelect>;
      page: number;
      pageSize: number;
      total: number;
      totalPages: number;
    }>();
    if (infra) return infra;

    try {
      const db = getDb();
      const offset = (page - 1) * pageSize;
      const [totalRow] = await db.select({ count: count() }).from(roiProcessingRuns);
      const items = await db
        .select()
        .from(roiProcessingRuns)
        .orderBy(desc(roiProcessingRuns.startedAt))
        .limit(pageSize)
        .offset(offset);
      const total = totalRow?.count ?? 0;
      return ok({ items, page, pageSize, total, totalPages: Math.ceil(total / pageSize) });
    } catch (error) {
      return fail("ROI_RUN_LIST_ERROR", "Failed to list ROI runs", error);
    }
  }

  async getLatestRun(): Promise<
    ServiceResult<(typeof roiProcessingRuns.$inferSelect) | null>
  > {
    const infra = guardDatabase<(typeof roiProcessingRuns.$inferSelect) | null>();
    if (infra) return infra;

    try {
      const db = getDb();
      const [run] = await db
        .select()
        .from(roiProcessingRuns)
        .orderBy(desc(roiProcessingRuns.startedAt))
        .limit(1);
      return ok(run ?? null);
    } catch (error) {
      return fail("ROI_RUN_GET_ERROR", "Failed to load processing run", error);
    }
  }
}

export const roiSchedulerService = new RoiSchedulerService();
