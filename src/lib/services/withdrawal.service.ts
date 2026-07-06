import {
  and,
  count,
  desc,
  eq,
  gte,
  ilike,
  inArray,
  ne,
  or,
  sql,
} from "drizzle-orm";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import { getDb } from "@/db";
import { schema } from "@/db/schema";
import {
  depositRequests,
  investments,
  profiles,
  withdrawalRequests,
} from "@/db/schema";
import type { WithdrawalStatus } from "@/types/domain";
import { FEATURE_FLAGS } from "@/lib/constants/feature-flags";
import { SYSTEM_SETTINGS } from "@/lib/constants/system-settings";
import { auditService } from "./audit.service";
import { featureFlagService } from "./feature-flags.service";
import { guardDatabase } from "./infrastructure-guard";
import { ledgerService } from "./ledger.service";
import { notificationService } from "./notification.service";
import { riskService } from "./risk.service";
import { settingsService } from "./settings.service";
import { treasuryService } from "./treasury.service";
import { walletService } from "./wallet.service";
import { withdrawalMethodService } from "./withdrawal-method.service";
import { fail, ok } from "./base";
import type { ActorContext, PaginatedResult, ServiceResult } from "./types";

type Db = PostgresJsDatabase<typeof schema>;

const CANCELLABLE_STATUSES: WithdrawalStatus[] = ["draft", "submitted", "under_review"];
const RESERVABLE_STATUSES: WithdrawalStatus[] = ["submitted", "under_review"];

export type WithdrawalView = {
  id: string;
  profileId: string;
  withdrawalMethodId: string | null;
  methodSlug: string;
  methodName: string | null;
  amount: string;
  currency: string;
  walletAddress: string;
  network: string;
  destinationDetails: Record<string, unknown>;
  status: WithdrawalStatus;
  infoRequestMessage: string | null;
  rejectionReason: string | null;
  payoutReference: string | null;
  treasuryPayoutId: string | null;
  submittedAt: Date | null;
  reviewedAt: Date | null;
  approvedAt: Date | null;
  processingAt: Date | null;
  completedAt: Date | null;
  createdAt: Date;
  customerName?: string;
  customerEmail?: string;
  internalNotes?: string | null;
};

export type WithdrawalReviewContext = WithdrawalView & {
  availableBalance: string;
  reservedBalance: string;
  withdrawableBalance: string;
  lockedInvestments: string;
  recentDeposits: Array<{ id: string; amount: string; status: string; createdAt: Date }>;
  recentWithdrawals: Array<{ id: string; amount: string; status: string; createdAt: Date }>;
  investmentSummary: { activeCount: number; totalPrincipal: string };
  riskEvents: Awaited<ReturnType<typeof riskService.listForWithdrawal>> extends ServiceResult<
    infer T
  >
    ? T
    : never;
};

export type SubmitWithdrawalInput = {
  profileId: string;
  methodSlug: string;
  amount: string;
  destination: Record<string, unknown>;
  currency?: string;
  idempotencyKey: string;
  actor?: ActorContext;
};

export type WithdrawalFilters = {
  page?: number;
  pageSize?: number;
  status?: WithdrawalStatus | WithdrawalStatus[];
  search?: string;
};

function parseAmount(value: string | number | null | undefined): number | null {
  if (value === null || value === undefined) return null;
  const n = typeof value === "string" ? parseFloat(value) : value;
  return Number.isNaN(n) ? null : n;
}

function extractDestination(methodSlug: string, destination: Record<string, unknown>) {
  const walletAddress =
    (destination.walletAddress as string) ??
    (destination.account_number as string) ??
    (destination.address as string) ??
    "";
  const network =
    (destination.network as string) ??
    (methodSlug.includes("trc") ? "TRC20" : methodSlug.includes("bitcoin") ? "BTC" : methodSlug.includes("ethereum") ? "ETH" : "bank");
  return { walletAddress: walletAddress.trim(), network };
}

export class WithdrawalService {
  private mapRow(
    row: typeof withdrawalRequests.$inferSelect,
    extras?: { methodName?: string | null; customerName?: string; customerEmail?: string },
  ): WithdrawalView {
    return {
      id: row.id,
      profileId: row.profileId,
      withdrawalMethodId: row.withdrawalMethodId,
      methodSlug: row.paymentMethod,
      methodName: extras?.methodName ?? null,
      amount: row.amount,
      currency: row.currency,
      walletAddress: row.walletAddress,
      network: row.network,
      destinationDetails: (row.destinationDetails as Record<string, unknown>) ?? {},
      status: row.status as WithdrawalStatus,
      infoRequestMessage: row.infoRequestMessage,
      rejectionReason: row.rejectionReason,
      payoutReference: row.payoutReference,
      treasuryPayoutId: row.treasuryPayoutId,
      submittedAt: row.submittedAt,
      reviewedAt: row.reviewedAt,
      approvedAt: row.approvedAt,
      processingAt: row.processingAt,
      completedAt: row.completedAt,
      createdAt: row.createdAt,
      customerName: extras?.customerName,
      customerEmail: extras?.customerEmail,
      internalNotes: row.internalNotes,
    };
  }

  private async validateSubmission(
    input: SubmitWithdrawalInput,
  ): Promise<
    ServiceResult<{
      method: Awaited<ReturnType<typeof withdrawalMethodService.getBySlug>> extends ServiceResult<
        infer M
      >
        ? M
        : never;
      availableBalance: number;
    }>
  > {
    const maintenance = await featureFlagService.isMaintenanceMode();
    if (maintenance) {
      return fail("MAINTENANCE_MODE", "Platform is in maintenance mode");
    }

    const withdrawalsEnabled = await featureFlagService.requireEnabled(
      FEATURE_FLAGS.WITHDRAWALS_ENABLED,
    );
    if (!withdrawalsEnabled.success) return withdrawalsEnabled;

    const amount = parseAmount(input.amount);
    if (!amount || amount <= 0) {
      return fail("INVALID_AMOUNT", "Amount must be greater than zero");
    }

    const methodResult = await withdrawalMethodService.getBySlug(input.methodSlug);
    if (!methodResult.success) return methodResult;

    const method = methodResult.data;
    const { walletAddress } = extractDestination(method.slug, input.destination);

    if (method.requiresDestination && !walletAddress) {
      return fail("INVALID_DESTINATION", "Destination address or account is required");
    }

    const minSystem = parseAmount(await settingsService.get(SYSTEM_SETTINGS.MINIMUM_WITHDRAWAL));
    const maxSystem = parseAmount(await settingsService.get(SYSTEM_SETTINGS.MAXIMUM_WITHDRAWAL));
    const minMethod = parseAmount(method.minAmount);
    const maxMethod = parseAmount(method.maxAmount);

    const minAmount = Math.max(minSystem ?? 0, minMethod ?? 0);
    let maxAmount = maxSystem ?? maxMethod ?? null;
    if (maxAmount && maxMethod) maxAmount = Math.min(maxAmount, maxMethod);

    if (amount < minAmount) {
      return fail("AMOUNT_TOO_LOW", `Minimum withdrawal is ${minAmount.toFixed(2)}`);
    }
    if (maxAmount !== null && amount > maxAmount) {
      return fail("AMOUNT_TOO_HIGH", `Maximum withdrawal is ${maxAmount.toFixed(2)}`);
    }

    const balanceResult = await walletService.getWithdrawableBalance(input.profileId);
    if (!balanceResult.success) return balanceResult;
    const availableBalance = parseAmount(balanceResult.data) ?? 0;

    if (amount > availableBalance) {
      return fail("INSUFFICIENT_FUNDS", "Insufficient withdrawable balance");
    }

    const dailyLimit = parseAmount(
      await settingsService.get(SYSTEM_SETTINGS.DAILY_WITHDRAWAL_LIMIT),
    );
    if (dailyLimit !== null) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const db = getDb();
      const [dailyTotal] = await db
        .select({
          total: sql<string>`COALESCE(SUM(${withdrawalRequests.amount}), 0)`,
        })
        .from(withdrawalRequests)
        .where(
          and(
            eq(withdrawalRequests.profileId, input.profileId),
            gte(withdrawalRequests.submittedAt, today),
            inArray(withdrawalRequests.status, [
              "submitted",
              "under_review",
              "approved",
              "processing",
              "completed",
            ]),
          ),
        );
      const usedToday = parseAmount(dailyTotal?.total) ?? 0;
      if (usedToday + amount > dailyLimit) {
        return fail("DAILY_LIMIT_EXCEEDED", `Daily withdrawal limit is ${dailyLimit.toFixed(2)}`);
      }
    }

    const db = getDb();

    const [duplicateKey] = await db
      .select({ id: withdrawalRequests.id })
      .from(withdrawalRequests)
      .where(eq(withdrawalRequests.idempotencyKey, input.idempotencyKey))
      .limit(1);
    if (duplicateKey) {
      return fail("DUPLICATE_REQUEST", "This withdrawal request was already submitted");
    }

    const [openRequest] = await db
      .select({ id: withdrawalRequests.id })
      .from(withdrawalRequests)
      .where(
        and(
          eq(withdrawalRequests.profileId, input.profileId),
          inArray(withdrawalRequests.status, ["submitted", "under_review", "approved", "processing"]),
        ),
      )
      .limit(1);
    if (openRequest) {
      return fail("DUPLICATE_REQUEST", "You already have a withdrawal request in progress");
    }

    return ok({ method, availableBalance });
  }

  async submitWithdrawal(
    input: SubmitWithdrawalInput,
  ): Promise<ServiceResult<{ id: string }>> {
    const infra = guardDatabase<{ id: string }>();
    if (infra) return infra;

    const validation = await this.validateSubmission(input);
    if (!validation.success) return validation;

    const { method, availableBalance } = validation.data;
    const { walletAddress, network } = extractDestination(method.slug, input.destination);

    try {
      const db = getDb();
      const [withdrawal] = await db
        .insert(withdrawalRequests)
        .values({
          profileId: input.profileId,
          withdrawalMethodId: method.id,
          paymentMethod: method.slug,
          amount: input.amount,
          currency: input.currency ?? "USD",
          walletAddress,
          network,
          destinationDetails: input.destination,
          status: "submitted",
          idempotencyKey: input.idempotencyKey,
          submittedAt: new Date(),
        })
        .returning({ id: withdrawalRequests.id });

      await auditService.log({
        action: "create",
        entityType: "withdrawal",
        entityId: withdrawal.id,
        actor: input.actor ?? { profileId: input.profileId },
        metadata: {
          amount: input.amount,
          method: method.slug,
          destination: walletAddress,
        },
      });

      await riskService.evaluateWithdrawal({
        profileId: input.profileId,
        withdrawalId: withdrawal.id,
        amount: parseAmount(input.amount) ?? 0,
        availableBalance,
        ipAddress: input.actor?.ipAddress,
        userAgent: input.actor?.userAgent,
      });

      await notificationService.createNotification({
        profileId: input.profileId,
        channel: "in_app",
        eventType: "withdrawal.submitted",
        title: "Withdrawal submitted",
        body: `Your withdrawal of ${input.amount} ${input.currency ?? "USD"} is under review.`,
        payload: { withdrawalId: withdrawal.id },
      });

      await notificationService.emitEvent({
        eventType: "withdrawal.submitted",
        payload: { withdrawalId: withdrawal.id, profileId: input.profileId },
        idempotencyKey: `withdrawal-submitted-${withdrawal.id}`,
      });

      return ok({ id: withdrawal.id });
    } catch (error) {
      return fail("WITHDRAWAL_SUBMIT_ERROR", "Failed to submit withdrawal", error);
    }
  }

  async cancelWithdrawal(
    profileId: string,
    withdrawalId: string,
    actor?: ActorContext,
  ): Promise<ServiceResult<void>> {
    const infra = guardDatabase<void>();
    if (infra) return infra;

    try {
      const db = getDb();
      const [withdrawal] = await db
        .select()
        .from(withdrawalRequests)
        .where(
          and(eq(withdrawalRequests.id, withdrawalId), eq(withdrawalRequests.profileId, profileId)),
        )
        .limit(1);

      if (!withdrawal) return fail("WITHDRAWAL_NOT_FOUND", "Withdrawal not found");
      if (!CANCELLABLE_STATUSES.includes(withdrawal.status as WithdrawalStatus)) {
        return fail("INVALID_STATUS", "This withdrawal can no longer be cancelled");
      }

      await db
        .update(withdrawalRequests)
        .set({ status: "cancelled" })
        .where(eq(withdrawalRequests.id, withdrawalId));

      await auditService.log({
        action: "update",
        entityType: "withdrawal",
        entityId: withdrawalId,
        actor: actor ?? { profileId },
        metadata: { status: "cancelled" },
      });

      await notificationService.createNotification({
        profileId,
        channel: "in_app",
        eventType: "withdrawal.cancelled",
        title: "Withdrawal cancelled",
        body: `Your withdrawal request of ${withdrawal.amount} ${withdrawal.currency} was cancelled.`,
        payload: { withdrawalId },
      });

      return ok(undefined);
    } catch (error) {
      return fail("WITHDRAWAL_CANCEL_ERROR", "Failed to cancel withdrawal", error);
    }
  }

  async listForProfile(
    profileId: string,
    filters: WithdrawalFilters = {},
  ): Promise<ServiceResult<PaginatedResult<WithdrawalView>>> {
    const infra = guardDatabase<PaginatedResult<WithdrawalView>>();
    if (infra) return infra;

    try {
      const db = getDb();
      const page = filters.page ?? 1;
      const pageSize = Math.min(filters.pageSize ?? 20, 50);
      const offset = (page - 1) * pageSize;

      const conditions = [eq(withdrawalRequests.profileId, profileId)];

      if (filters.status) {
        const statuses = Array.isArray(filters.status) ? filters.status : [filters.status];
        conditions.push(inArray(withdrawalRequests.status, statuses));
      }

      if (filters.search) {
        conditions.push(
          or(
            ilike(withdrawalRequests.walletAddress, `%${filters.search}%`),
            ilike(withdrawalRequests.paymentMethod, `%${filters.search}%`),
            ilike(withdrawalRequests.payoutReference, `%${filters.search}%`),
          )!,
        );
      }

      const whereClause = and(...conditions);

      const [totalRow] = await db
        .select({ count: count() })
        .from(withdrawalRequests)
        .where(whereClause);

      const rows = await db
        .select()
        .from(withdrawalRequests)
        .where(whereClause)
        .orderBy(desc(withdrawalRequests.createdAt))
        .limit(pageSize)
        .offset(offset);

      const items = rows.map((r) => this.mapRow(r));
      const total = totalRow?.count ?? 0;

      return ok({ items, page, pageSize, total, totalPages: Math.ceil(total / pageSize) });
    } catch (error) {
      return fail("WITHDRAWAL_LIST_ERROR", "Failed to load withdrawals", error);
    }
  }

  async getByIdForProfile(
    profileId: string,
    withdrawalId: string,
  ): Promise<ServiceResult<WithdrawalView>> {
    const infra = guardDatabase<WithdrawalView>();
    if (infra) return infra;

    try {
      const db = getDb();
      const [row] = await db
        .select()
        .from(withdrawalRequests)
        .where(
          and(eq(withdrawalRequests.id, withdrawalId), eq(withdrawalRequests.profileId, profileId)),
        )
        .limit(1);

      if (!row) return fail("WITHDRAWAL_NOT_FOUND", "Withdrawal not found");
      return ok(this.mapRow(row));
    } catch (error) {
      return fail("WITHDRAWAL_GET_ERROR", "Failed to load withdrawal", error);
    }
  }

  async listForAdmin(
    filters: WithdrawalFilters = {},
  ): Promise<ServiceResult<PaginatedResult<WithdrawalView>>> {
    const infra = guardDatabase<PaginatedResult<WithdrawalView>>();
    if (infra) return infra;

    try {
      const db = getDb();
      const page = filters.page ?? 1;
      const pageSize = Math.min(filters.pageSize ?? 20, 100);
      const offset = (page - 1) * pageSize;

      const conditions = [
        inArray(withdrawalRequests.status, ["submitted", "under_review", "approved", "processing"]),
      ];

      if (filters.status) {
        const statuses = Array.isArray(filters.status) ? filters.status : [filters.status];
        conditions.push(inArray(withdrawalRequests.status, statuses));
      }

      if (filters.search) {
        conditions.push(
          or(
            ilike(withdrawalRequests.walletAddress, `%${filters.search}%`),
            ilike(profiles.fullName, `%${filters.search}%`),
            ilike(profiles.email, `%${filters.search}%`),
          )!,
        );
      }

      const whereClause = and(...conditions);

      const [totalRow] = await db
        .select({ count: count() })
        .from(withdrawalRequests)
        .innerJoin(profiles, eq(withdrawalRequests.profileId, profiles.id))
        .where(whereClause);

      const rows = await db
        .select({
          withdrawal: withdrawalRequests,
          customerName: profiles.fullName,
          customerEmail: profiles.email,
        })
        .from(withdrawalRequests)
        .innerJoin(profiles, eq(withdrawalRequests.profileId, profiles.id))
        .where(whereClause)
        .orderBy(desc(withdrawalRequests.submittedAt))
        .limit(pageSize)
        .offset(offset);

      const items = rows.map((r) =>
        this.mapRow(r.withdrawal, {
          customerName: r.customerName,
          customerEmail: r.customerEmail,
        }),
      );
      const total = totalRow?.count ?? 0;

      return ok({ items, page, pageSize, total, totalPages: Math.ceil(total / pageSize) });
    } catch (error) {
      return fail("ADMIN_WITHDRAWAL_LIST_ERROR", "Failed to load withdrawal queue", error);
    }
  }

  async getReviewContext(withdrawalId: string): Promise<ServiceResult<WithdrawalReviewContext>> {
    const infra = guardDatabase<WithdrawalReviewContext>();
    if (infra) return infra;

    try {
      const db = getDb();
      const [row] = await db
        .select({
          withdrawal: withdrawalRequests,
          customerName: profiles.fullName,
          customerEmail: profiles.email,
        })
        .from(withdrawalRequests)
        .innerJoin(profiles, eq(withdrawalRequests.profileId, profiles.id))
        .where(eq(withdrawalRequests.id, withdrawalId))
        .limit(1);

      if (!row) return fail("WITHDRAWAL_NOT_FOUND", "Withdrawal not found");

      const profileId = row.withdrawal.profileId;

      const [available, reserved, locked, recentDeposits, recentWithdrawals, investmentsRows, riskResult] =
        await Promise.all([
          walletService.getAvailableBalance(profileId),
          walletService.getReservedBalance(profileId),
          walletService.getLockedInvestments(profileId),
          db
            .select({
              id: depositRequests.id,
              amount: depositRequests.amount,
              status: depositRequests.status,
              createdAt: depositRequests.createdAt,
            })
            .from(depositRequests)
            .where(eq(depositRequests.profileId, profileId))
            .orderBy(desc(depositRequests.createdAt))
            .limit(5),
          db
            .select({
              id: withdrawalRequests.id,
              amount: withdrawalRequests.amount,
              status: withdrawalRequests.status,
              createdAt: withdrawalRequests.createdAt,
            })
            .from(withdrawalRequests)
            .where(
              and(eq(withdrawalRequests.profileId, profileId), ne(withdrawalRequests.id, withdrawalId)),
            )
            .orderBy(desc(withdrawalRequests.createdAt))
            .limit(5),
          db
            .select({
              principal: investments.principalAmount,
              status: investments.status,
            })
            .from(investments)
            .where(and(eq(investments.profileId, profileId), eq(investments.status, "active"))),
          riskService.listForWithdrawal(withdrawalId),
        ]);

      const activeInvestments = investmentsRows.filter((i) => i.status === "active");
      const totalPrincipal = activeInvestments.reduce(
        (sum, i) => sum + (parseAmount(i.principal) ?? 0),
        0,
      );

      const withdrawableResult = await walletService.getWithdrawableBalance(profileId);

      return ok({
        ...this.mapRow(row.withdrawal, {
          customerName: row.customerName,
          customerEmail: row.customerEmail,
        }),
        availableBalance: available.success ? available.data : "0.00",
        reservedBalance: reserved.success ? reserved.data : "0.00",
        withdrawableBalance: withdrawableResult.success ? withdrawableResult.data : "0.00",
        lockedInvestments: locked.success ? locked.data : "0.00",
        recentDeposits: recentDeposits.map((d) => ({
          id: d.id,
          amount: d.amount,
          status: d.status,
          createdAt: d.createdAt,
        })),
        recentWithdrawals: recentWithdrawals.map((w) => ({
          id: w.id,
          amount: w.amount,
          status: w.status,
          createdAt: w.createdAt,
        })),
        investmentSummary: {
          activeCount: activeInvestments.length,
          totalPrincipal: totalPrincipal.toFixed(2),
        },
        riskEvents: riskResult.success ? riskResult.data : [],
      });
    } catch (error) {
      return fail("WITHDRAWAL_REVIEW_ERROR", "Failed to load withdrawal review context", error);
    }
  }

  async approveWithdrawal(
    withdrawalId: string,
    adminUserId: string,
    internalNotes?: string,
  ): Promise<ServiceResult<{ treasuryPayoutId: string }>> {
    const infra = guardDatabase<{ treasuryPayoutId: string }>();
    if (infra) return infra;

    try {
      const db = getDb();
      const actor: ActorContext = { adminUserId };

      const result = await db.transaction(async (tx) => {
        const [withdrawal] = await tx
          .select()
          .from(withdrawalRequests)
          .where(eq(withdrawalRequests.id, withdrawalId))
          .for("update");

        if (!withdrawal) throw new Error("WITHDRAWAL_NOT_FOUND");
        if (withdrawal.status === "approved" || withdrawal.status === "completed") {
          throw new Error("ALREADY_PROCESSED");
        }
        if (!RESERVABLE_STATUSES.includes(withdrawal.status as WithdrawalStatus)) {
          throw new Error("INVALID_STATUS");
        }

        const amount = withdrawal.amount;
        const currency = withdrawal.currency;

        await ledgerService.postEntryInTransaction(tx as Db, {
          profileId: withdrawal.profileId,
          accountType: "available",
          direction: "debit",
          amount,
          entryType: "withdrawal",
          idempotencyKey: `withdrawal-approve-${withdrawalId}-debit-available`,
          referenceType: "withdrawal_request",
          referenceId: withdrawalId,
          description: `Withdrawal reserved — ${withdrawal.walletAddress}`,
          actor,
          currency,
        });

        await ledgerService.postEntryInTransaction(tx as Db, {
          profileId: withdrawal.profileId,
          accountType: "pending_withdrawal",
          direction: "credit",
          amount,
          entryType: "withdrawal",
          idempotencyKey: `withdrawal-approve-${withdrawalId}-credit-pending`,
          referenceType: "withdrawal_request",
          referenceId: withdrawalId,
          description: `Funds reserved for withdrawal`,
          actor,
          currency,
        });

        const [payout] = await tx
          .insert(schema.treasuryPayouts)
          .values({
            withdrawalRequestId: withdrawalId,
            providerType: "manual",
            providerSlug: "manual",
            status: "pending",
            amount,
            currency,
            destinationSnapshot:
              (withdrawal.destinationDetails as Record<string, unknown>) ?? {
                walletAddress: withdrawal.walletAddress,
                network: withdrawal.network,
              },
          })
          .returning({ id: schema.treasuryPayouts.id });

        await tx
          .update(withdrawalRequests)
          .set({
            status: "approved",
            treasuryPayoutId: payout.id,
            reviewedByAdminId: adminUserId,
            reviewedAt: new Date(),
            approvedAt: new Date(),
            internalNotes: internalNotes ?? withdrawal.internalNotes,
          })
          .where(eq(withdrawalRequests.id, withdrawalId));

        return { withdrawal, treasuryPayoutId: payout.id };
      });

      await auditService.log({
        action: "approve",
        entityType: "withdrawal",
        entityId: withdrawalId,
        actor: { adminUserId },
        metadata: { treasuryPayoutId: result.treasuryPayoutId },
      });

      await notificationService.createNotification({
        profileId: result.withdrawal.profileId,
        channel: "in_app",
        eventType: "withdrawal.approved",
        title: "Withdrawal approved",
        body: `Your withdrawal of ${result.withdrawal.amount} ${result.withdrawal.currency} was approved and is queued for payout.`,
        payload: { withdrawalId },
      });

      return ok({ treasuryPayoutId: result.treasuryPayoutId });
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === "WITHDRAWAL_NOT_FOUND") {
          return fail("WITHDRAWAL_NOT_FOUND", "Withdrawal not found");
        }
        if (error.message === "ALREADY_PROCESSED") {
          return fail("ALREADY_PROCESSED", "Withdrawal has already been processed");
        }
        if (error.message === "INVALID_STATUS") {
          return fail("INVALID_STATUS", "Withdrawal cannot be approved in its current status");
        }
        if (error.message === "INSUFFICIENT_FUNDS") {
          return fail("INSUFFICIENT_FUNDS", "Insufficient available balance");
        }
      }
      return fail("WITHDRAWAL_APPROVE_ERROR", "Failed to approve withdrawal", error);
    }
  }

  private async reverseReservation(
    tx: Db,
    withdrawal: typeof withdrawalRequests.$inferSelect,
    adminUserId: string,
    reason: string,
  ) {
    if (!["approved", "processing"].includes(withdrawal.status)) return;

    const actor: ActorContext = { adminUserId };
    const amount = withdrawal.amount;
    const currency = withdrawal.currency;
    const withdrawalId = withdrawal.id;

    await ledgerService.postEntryInTransaction(tx, {
      profileId: withdrawal.profileId,
      accountType: "pending_withdrawal",
      direction: "debit",
      amount,
      entryType: "reversal",
      idempotencyKey: `withdrawal-reverse-${withdrawalId}-debit-pending`,
      referenceType: "withdrawal_request",
      referenceId: withdrawalId,
      description: `Withdrawal reversal — ${reason}`,
      actor,
      currency,
    });

    await ledgerService.postEntryInTransaction(tx, {
      profileId: withdrawal.profileId,
      accountType: "available",
      direction: "credit",
      amount,
      entryType: "reversal",
      idempotencyKey: `withdrawal-reverse-${withdrawalId}-credit-available`,
      referenceType: "withdrawal_request",
      referenceId: withdrawalId,
      description: `Funds returned — ${reason}`,
      actor,
      currency,
    });
  }

  async rejectWithdrawal(
    withdrawalId: string,
    adminUserId: string,
    reason: string,
    internalNotes?: string,
  ): Promise<ServiceResult<void>> {
    const infra = guardDatabase<void>();
    if (infra) return infra;

    try {
      const db = getDb();

      await db.transaction(async (tx) => {
        const [withdrawal] = await tx
          .select()
          .from(withdrawalRequests)
          .where(eq(withdrawalRequests.id, withdrawalId))
          .for("update");

        if (!withdrawal) throw new Error("WITHDRAWAL_NOT_FOUND");
        if (withdrawal.status === "completed") {
          throw new Error("ALREADY_PROCESSED");
        }
        if (withdrawal.status === "rejected") {
          throw new Error("ALREADY_PROCESSED");
        }

        await this.reverseReservation(tx as Db, withdrawal, adminUserId, reason);

        if (withdrawal.treasuryPayoutId) {
          await tx
            .update(schema.treasuryPayouts)
            .set({ status: "failed", failureReason: reason, failedAt: new Date() })
            .where(eq(schema.treasuryPayouts.id, withdrawal.treasuryPayoutId));
        }

        await tx
          .update(withdrawalRequests)
          .set({
            status: "rejected",
            rejectionReason: reason,
            reviewedByAdminId: adminUserId,
            reviewedAt: new Date(),
            internalNotes: internalNotes ?? withdrawal.internalNotes,
          })
          .where(eq(withdrawalRequests.id, withdrawalId));

        return withdrawal;
      });

      const [withdrawal] = await db
        .select()
        .from(withdrawalRequests)
        .where(eq(withdrawalRequests.id, withdrawalId))
        .limit(1);

      await auditService.log({
        action: "reject",
        entityType: "withdrawal",
        entityId: withdrawalId,
        actor: { adminUserId },
        metadata: { reason },
      });

      if (withdrawal) {
        await notificationService.createNotification({
          profileId: withdrawal.profileId,
          channel: "in_app",
          eventType: "withdrawal.rejected",
          title: "Withdrawal rejected",
          body: reason,
          payload: { withdrawalId },
        });
      }

      return ok(undefined);
    } catch (error) {
      if (error instanceof Error && error.message === "WITHDRAWAL_NOT_FOUND") {
        return fail("WITHDRAWAL_NOT_FOUND", "Withdrawal not found");
      }
      return fail("WITHDRAWAL_REJECT_ERROR", "Failed to reject withdrawal", error);
    }
  }

  async requestAdditionalInfo(
    withdrawalId: string,
    adminUserId: string,
    message: string,
  ): Promise<ServiceResult<void>> {
    const infra = guardDatabase<void>();
    if (infra) return infra;

    try {
      const db = getDb();
      const [withdrawal] = await db
        .select()
        .from(withdrawalRequests)
        .where(eq(withdrawalRequests.id, withdrawalId))
        .limit(1);

      if (!withdrawal) return fail("WITHDRAWAL_NOT_FOUND", "Withdrawal not found");

      await db
        .update(withdrawalRequests)
        .set({
          status: "under_review",
          infoRequestMessage: message,
          reviewedByAdminId: adminUserId,
        })
        .where(eq(withdrawalRequests.id, withdrawalId));

      await auditService.log({
        action: "update",
        entityType: "withdrawal",
        entityId: withdrawalId,
        actor: { adminUserId },
        metadata: { infoRequest: message },
      });

      await notificationService.createNotification({
        profileId: withdrawal.profileId,
        channel: "in_app",
        eventType: "withdrawal.info_requested",
        title: "Additional information required",
        body: message,
        payload: { withdrawalId },
      });

      return ok(undefined);
    } catch (error) {
      return fail("WITHDRAWAL_INFO_ERROR", "Failed to request information", error);
    }
  }

  async markProcessing(
    withdrawalId: string,
    adminUserId: string,
  ): Promise<ServiceResult<void>> {
    const infra = guardDatabase<void>();
    if (infra) return infra;

    try {
      const db = getDb();
      const [withdrawal] = await db
        .select()
        .from(withdrawalRequests)
        .where(eq(withdrawalRequests.id, withdrawalId))
        .limit(1);

      if (!withdrawal) return fail("WITHDRAWAL_NOT_FOUND", "Withdrawal not found");
      if (withdrawal.status !== "approved") {
        return fail("INVALID_STATUS", "Only approved withdrawals can be marked processing");
      }

      await db
        .update(withdrawalRequests)
        .set({ status: "processing", processingAt: new Date() })
        .where(eq(withdrawalRequests.id, withdrawalId));

      if (withdrawal.treasuryPayoutId) {
        await treasuryService.markProcessing(withdrawal.treasuryPayoutId, adminUserId);
      }

      await auditService.log({
        action: "update",
        entityType: "withdrawal",
        entityId: withdrawalId,
        actor: { adminUserId },
        metadata: { status: "processing" },
      });

      await notificationService.createNotification({
        profileId: withdrawal.profileId,
        channel: "in_app",
        eventType: "withdrawal.processing",
        title: "Withdrawal processing",
        body: `Your withdrawal of ${withdrawal.amount} ${withdrawal.currency} is being processed.`,
        payload: { withdrawalId },
      });

      return ok(undefined);
    } catch (error) {
      return fail("WITHDRAWAL_PROCESS_ERROR", "Failed to mark withdrawal processing", error);
    }
  }

  async markCompleted(
    withdrawalId: string,
    adminUserId: string,
    payoutReference?: string,
  ): Promise<ServiceResult<void>> {
    const infra = guardDatabase<void>();
    if (infra) return infra;

    try {
      const db = getDb();
      const actor: ActorContext = { adminUserId };

      const result = await db.transaction(async (tx) => {
        const [withdrawal] = await tx
          .select()
          .from(withdrawalRequests)
          .where(eq(withdrawalRequests.id, withdrawalId))
          .for("update");

        if (!withdrawal) throw new Error("WITHDRAWAL_NOT_FOUND");
        if (withdrawal.status === "completed") throw new Error("ALREADY_PROCESSED");
        if (!["approved", "processing"].includes(withdrawal.status)) {
          throw new Error("INVALID_STATUS");
        }

        const amount = withdrawal.amount;
        const currency = withdrawal.currency;

        await ledgerService.postEntryInTransaction(tx as Db, {
          profileId: withdrawal.profileId,
          accountType: "pending_withdrawal",
          direction: "debit",
          amount,
          entryType: "withdrawal",
          idempotencyKey: `withdrawal-complete-${withdrawalId}-debit-pending`,
          referenceType: "withdrawal_request",
          referenceId: withdrawalId,
          description: `Withdrawal completed — ${payoutReference ?? withdrawal.walletAddress}`,
          actor,
          currency,
        });

        if (withdrawal.treasuryPayoutId) {
          await tx
            .update(schema.treasuryPayouts)
            .set({
              status: "completed",
              externalReference: payoutReference ?? null,
              completedAt: new Date(),
            })
            .where(eq(schema.treasuryPayouts.id, withdrawal.treasuryPayoutId));
        }

        await tx
          .update(withdrawalRequests)
          .set({
            status: "completed",
            completedAt: new Date(),
            payoutReference: payoutReference ?? withdrawal.payoutReference,
          })
          .where(eq(withdrawalRequests.id, withdrawalId));

        return withdrawal;
      });

      await auditService.log({
        action: "approve",
        entityType: "withdrawal",
        entityId: withdrawalId,
        actor: { adminUserId },
        metadata: { status: "completed", payoutReference },
      });

      await notificationService.createNotification({
        profileId: result.profileId,
        channel: "in_app",
        eventType: "withdrawal.completed",
        title: "Withdrawal completed",
        body: `Your withdrawal of ${result.amount} ${result.currency} has been completed.`,
        payload: { withdrawalId, payoutReference },
      });

      return ok(undefined);
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === "WITHDRAWAL_NOT_FOUND") {
          return fail("WITHDRAWAL_NOT_FOUND", "Withdrawal not found");
        }
        if (error.message === "ALREADY_PROCESSED") {
          return fail("ALREADY_PROCESSED", "Withdrawal already completed");
        }
        if (error.message === "INVALID_STATUS") {
          return fail("INVALID_STATUS", "Withdrawal cannot be completed in its current status");
        }
      }
      return fail("WITHDRAWAL_COMPLETE_ERROR", "Failed to complete withdrawal", error);
    }
  }

  async getAdminStats(): Promise<
    ServiceResult<{
      pendingCount: number;
      processingCount: number;
      completedToday: number;
      rejectedToday: number;
      volumeToday: string;
    }>
  > {
    const infra = guardDatabase<{
      pendingCount: number;
      processingCount: number;
      completedToday: number;
      rejectedToday: number;
      volumeToday: string;
    }>();
    if (infra) return infra;

    try {
      const db = getDb();
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const [[pending], [processing], [completed], [rejected], [volume]] = await Promise.all([
        db
          .select({ count: count() })
          .from(withdrawalRequests)
          .where(inArray(withdrawalRequests.status, ["submitted", "under_review"])),
        db
          .select({ count: count() })
          .from(withdrawalRequests)
          .where(inArray(withdrawalRequests.status, ["approved", "processing"])),
        db
          .select({ count: count() })
          .from(withdrawalRequests)
          .where(
            and(
              eq(withdrawalRequests.status, "completed"),
              gte(withdrawalRequests.completedAt, today),
            ),
          ),
        db
          .select({ count: count() })
          .from(withdrawalRequests)
          .where(
            and(
              eq(withdrawalRequests.status, "rejected"),
              gte(withdrawalRequests.reviewedAt, today),
            ),
          ),
        db
          .select({
            total: sql<string>`COALESCE(SUM(${withdrawalRequests.amount}), 0)`,
          })
          .from(withdrawalRequests)
          .where(
            and(
              eq(withdrawalRequests.status, "completed"),
              gte(withdrawalRequests.completedAt, today),
            ),
          ),
      ]);

      return ok({
        pendingCount: pending?.count ?? 0,
        processingCount: processing?.count ?? 0,
        completedToday: completed?.count ?? 0,
        rejectedToday: rejected?.count ?? 0,
        volumeToday: volume?.total ?? "0.00",
      });
    } catch (error) {
      return fail("ADMIN_WITHDRAWAL_STATS_ERROR", "Failed to load withdrawal stats", error);
    }
  }
}

export const withdrawalService = new WithdrawalService();
