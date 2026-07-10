import {
  and,
  count,
  desc,
  eq,
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
  investmentPlans,
  profiles,
} from "@/db/schema";
import type { DepositStatus } from "@/types/domain";
import type { InvestmentPlanView } from "./investment-plan.service";
import type { PaymentMethodView } from "./payment-method.service";
import type { PlatformWalletView } from "./platform-wallet.service";
import { FEATURE_FLAGS } from "@/lib/constants/feature-flags";
import { SYSTEM_SETTINGS } from "@/lib/constants/system-settings";
import { auditService } from "./audit.service";
import { featureFlagService } from "./feature-flags.service";
import { guardDatabase } from "./infrastructure-guard";
import { investmentEngine } from "./investment-engine.service";
import { investmentPlanService } from "./investment-plan.service";
import { ledgerService } from "./ledger.service";
import { notificationService } from "./notification.service";
import { paymentMethodService } from "./payment-method.service";
import { platformWalletService } from "./platform-wallet.service";
import { settingsService } from "./settings.service";
import { fail, ok } from "./base";
import type { ActorContext, PaginatedResult, ServiceResult } from "./types";

type Db = PostgresJsDatabase<typeof schema>;

export type DepositView = {
  id: string;
  profileId: string;
  planId: string | null;
  planName: string | null;
  paymentMethodId: string | null;
  paymentMethodSlug: string;
  paymentMethodName: string | null;
  amount: string;
  currency: string;
  externalTransactionRef: string;
  status: DepositStatus;
  proofStoragePath: string | null;
  infoRequestMessage: string | null;
  investmentId: string | null;
  rejectionReason: string | null;
  platformWalletId: string | null;
  walletAddressSnapshot: string | null;
  assetSymbolSnapshot: string | null;
  assetNameSnapshot: string | null;
  networkSnapshot: string | null;
  qrCodePathSnapshot: string | null;
  walletInstructionsSnapshot: string | null;
  submittedAt: Date | null;
  reviewedAt: Date | null;
  approvedAt: Date | null;
  createdAt: Date;
  customerName?: string;
  customerEmail?: string;
  internalNotes?: string | null;
};

export type SubmitDepositInput = {
  profileId: string;
  planId: string;
  paymentMethodSlug?: string;
  platformWalletId?: string;
  amount: string;
  externalTransactionRef: string;
  currency?: string;
  idempotencyKey: string;
  proofStoragePath?: string;
  actor?: ActorContext;
};

export type DepositFilters = {
  page?: number;
  pageSize?: number;
  status?: DepositStatus | DepositStatus[];
  search?: string;
};

function parseAmount(value: string | number | null | undefined): number | null {
  if (value === null || value === undefined) return null;
  const n = typeof value === "string" ? parseFloat(value) : value;
  return Number.isNaN(n) ? null : n;
}

type DepositRow = typeof depositRequests.$inferSelect;

function mapDepositRow(
  deposit: DepositRow,
  extras: {
    planName?: string | null;
    customerName?: string | null;
    customerEmail?: string | null;
    paymentMethodName?: string | null;
  } = {},
): DepositView {
  return {
    id: deposit.id,
    profileId: deposit.profileId,
    planId: deposit.planId,
    planName: extras.planName ?? null,
    paymentMethodId: deposit.paymentMethodId,
    paymentMethodSlug: deposit.paymentMethod,
    paymentMethodName: extras.paymentMethodName ?? null,
    amount: deposit.amount,
    currency: deposit.currency,
    externalTransactionRef: deposit.externalTransactionRef,
    status: deposit.status as DepositStatus,
    proofStoragePath: deposit.proofStoragePath,
    infoRequestMessage: deposit.infoRequestMessage,
    investmentId: deposit.investmentId,
    rejectionReason: deposit.rejectionReason,
    platformWalletId: deposit.platformWalletId,
    walletAddressSnapshot: deposit.walletAddressSnapshot,
    assetSymbolSnapshot: deposit.assetSymbolSnapshot,
    assetNameSnapshot: deposit.assetNameSnapshot,
    networkSnapshot: deposit.networkSnapshot,
    qrCodePathSnapshot: deposit.qrCodePathSnapshot,
    walletInstructionsSnapshot: deposit.walletInstructionsSnapshot,
    submittedAt: deposit.submittedAt,
    reviewedAt: deposit.reviewedAt,
    approvedAt: deposit.approvedAt,
    createdAt: deposit.createdAt,
    customerName: extras.customerName ?? undefined,
    customerEmail: extras.customerEmail ?? undefined,
    internalNotes: deposit.internalNotes,
  };
}

async function validatePlanAmount(
  planId: string,
  amount: number,
  minOverride?: number | null,
  maxOverride?: number | null,
): Promise<ServiceResult<{ plan: InvestmentPlanView }>> {
  const planResult = await investmentPlanService.getById(planId);
  if (!planResult.success) return planResult;
  if (!planResult.data) {
    return fail("PLAN_NOT_FOUND", "Investment plan not found or inactive");
  }

  const plan = planResult.data;
  const minPlan = parseAmount(plan.minDeposit) ?? 0;
  const maxPlan = parseAmount(plan.maxDeposit);
  const minSystem = parseAmount(await settingsService.get(SYSTEM_SETTINGS.MINIMUM_DEPOSIT));
  const maxSystem = parseAmount(await settingsService.get(SYSTEM_SETTINGS.MAXIMUM_DEPOSIT));

  const minAmount = Math.max(minPlan, minSystem ?? 0, minOverride ?? 0);
  let maxAmount = maxPlan ?? maxSystem ?? maxOverride ?? null;
  if (maxPlan && maxSystem) maxAmount = Math.min(maxPlan, maxSystem);
  if (maxAmount && maxOverride) maxAmount = Math.min(maxAmount, maxOverride);

  if (amount < minAmount) {
    return fail("AMOUNT_TOO_LOW", `Minimum deposit is ${minAmount.toFixed(2)}`);
  }
  if (maxAmount !== null && amount > maxAmount) {
    return fail("AMOUNT_TOO_HIGH", `Maximum deposit is ${maxAmount.toFixed(2)}`);
  }

  return ok({ plan });
}

export class DepositService {
  private async validateSubmission(
    input: SubmitDepositInput,
  ): Promise<
    ServiceResult<{
      plan: InvestmentPlanView;
      method?: PaymentMethodView;
      wallet?: PlatformWalletView;
    }>
  > {
    const maintenance = await featureFlagService.isMaintenanceMode();
    if (maintenance) {
      return fail("MAINTENANCE_MODE", "Platform is in maintenance mode");
    }

    const [depositsEnabled, investmentsEnabled, activeWallets, activePlans] =
      await Promise.all([
        featureFlagService.isEnabled(FEATURE_FLAGS.DEPOSITS_ENABLED),
        featureFlagService.isEnabled(FEATURE_FLAGS.INVESTMENTS_ENABLED),
        platformWalletService.listActiveForCustomers(),
        investmentPlanService.listActive(),
      ]);

    const hasWallets = activeWallets.success && activeWallets.data.length > 0;
    const hasPlans = activePlans.success && activePlans.data.length > 0;

    if (!depositsEnabled && !hasWallets) {
      return fail("FEATURE_DISABLED", "Deposits are not open yet");
    }

    if (!investmentsEnabled && !hasPlans) {
      return fail("FEATURE_DISABLED", "New investments are not available yet");
    }

    if (!input.platformWalletId && !input.paymentMethodSlug) {
      return fail("PAYMENT_REQUIRED", "A payment method or platform wallet is required");
    }

    const amount = parseAmount(input.amount);
    if (!amount || amount <= 0) {
      return fail("INVALID_AMOUNT", "Amount must be greater than zero");
    }

    if (!input.externalTransactionRef.trim()) {
      return fail("INVALID_REFERENCE", "Transaction reference is required");
    }

    const db = getDb();

    const [duplicateKey] = await db
      .select({ id: depositRequests.id })
      .from(depositRequests)
      .where(eq(depositRequests.idempotencyKey, input.idempotencyKey))
      .limit(1);
    if (duplicateKey) {
      return fail("DUPLICATE_REQUEST", "This deposit request was already submitted");
    }

    const [duplicateRef] = await db
      .select({ id: depositRequests.id })
      .from(depositRequests)
      .where(
        and(
          eq(depositRequests.externalTransactionRef, input.externalTransactionRef.trim()),
          ne(depositRequests.status, "rejected"),
          ne(depositRequests.status, "cancelled"),
          ne(depositRequests.status, "draft"),
        ),
      )
      .limit(1);
    if (duplicateRef) {
      return fail("DUPLICATE_REFERENCE", "This transaction reference is already in use");
    }

    if (input.platformWalletId) {
      const walletResult = await platformWalletService.getActiveById(input.platformWalletId);
      if (!walletResult.success) return walletResult;

      const planResult = await validatePlanAmount(input.planId, amount);
      if (!planResult.success) return planResult;

      return ok({ plan: planResult.data.plan, wallet: walletResult.data });
    }

    const methodResult = await paymentMethodService.getBySlug(input.paymentMethodSlug!);
    if (!methodResult.success) return methodResult;

    const minMethod = parseAmount(methodResult.data.minAmount);
    const maxMethod = parseAmount(methodResult.data.maxAmount);
    const planResult = await validatePlanAmount(input.planId, amount, minMethod, maxMethod);
    if (!planResult.success) return planResult;

    return ok({ plan: planResult.data.plan, method: methodResult.data });
  }

  async submitDeposit(input: SubmitDepositInput): Promise<ServiceResult<{ id: string }>> {
    const infra = guardDatabase<{ id: string }>();
    if (infra) return infra;

    const validation = await this.validateSubmission(input);
    if (!validation.success) return validation;

    const { method, wallet } = validation.data;

    try {
      const db = getDb();
      const paymentMethodSlug = wallet
        ? `platform:${wallet.assetSymbol}:${wallet.network}`
        : method!.slug;

      const [deposit] = await db
        .insert(depositRequests)
        .values({
          profileId: input.profileId,
          planId: input.planId,
          paymentMethodId: method?.id ?? null,
          paymentMethod: paymentMethodSlug,
          platformWalletId: wallet?.id ?? null,
          walletAddressSnapshot: wallet?.walletAddress ?? null,
          assetSymbolSnapshot: wallet?.assetSymbol ?? null,
          assetNameSnapshot: wallet?.assetName ?? null,
          networkSnapshot: wallet?.network ?? null,
          qrCodePathSnapshot: wallet?.qrCodePath ?? null,
          walletInstructionsSnapshot: wallet?.instructions ?? null,
          amount: input.amount,
          currency: input.currency ?? "USD",
          externalTransactionRef: input.externalTransactionRef.trim(),
          proofStoragePath: input.proofStoragePath,
          status: "submitted",
          idempotencyKey: input.idempotencyKey,
          submittedAt: new Date(),
        })
        .returning({ id: depositRequests.id });

      await auditService.log({
        action: "create",
        entityType: "deposit",
        entityId: deposit.id,
        actor: input.actor ?? { profileId: input.profileId },
        metadata: {
          amount: input.amount,
          planId: input.planId,
          paymentMethod: paymentMethodSlug,
          platformWalletId: wallet?.id,
        },
      });

      await notificationService.createNotification({
        profileId: input.profileId,
        channel: "in_app",
        eventType: "deposit.submitted",
        title: "Deposit submitted",
        body: `Your deposit of ${input.amount} ${input.currency ?? "USD"} is awaiting verification.`,
        payload: { depositId: deposit.id },
      });

      await notificationService.emitEvent({
        eventType: "deposit.submitted",
        payload: { depositId: deposit.id, profileId: input.profileId },
        idempotencyKey: `deposit-submitted-${deposit.id}`,
      });

      return ok({ id: deposit.id });
    } catch (error) {
      return fail("DEPOSIT_SUBMIT_ERROR", "Failed to submit deposit", error);
    }
  }

  async listForProfile(
    profileId: string,
    filters: DepositFilters = {},
  ): Promise<ServiceResult<PaginatedResult<DepositView>>> {
    const infra = guardDatabase<PaginatedResult<DepositView>>();
    if (infra) return infra;

    try {
      const db = getDb();
      const page = filters.page ?? 1;
      const pageSize = Math.min(filters.pageSize ?? 20, 50);
      const offset = (page - 1) * pageSize;

      const conditions = [eq(depositRequests.profileId, profileId)];

      if (filters.status) {
        const statuses = Array.isArray(filters.status) ? filters.status : [filters.status];
        conditions.push(inArray(depositRequests.status, statuses));
      }

      if (filters.search) {
        conditions.push(
          or(
            ilike(depositRequests.externalTransactionRef, `%${filters.search}%`),
            ilike(depositRequests.paymentMethod, `%${filters.search}%`),
          )!,
        );
      }

      const whereClause = and(...conditions);

      const [totalRow] = await db
        .select({ count: count() })
        .from(depositRequests)
        .where(whereClause);

      const rows = await db
        .select({
          deposit: depositRequests,
          planName: investmentPlans.name,
        })
        .from(depositRequests)
        .leftJoin(investmentPlans, eq(depositRequests.planId, investmentPlans.id))
        .where(whereClause)
        .orderBy(desc(depositRequests.createdAt))
        .limit(pageSize)
        .offset(offset);

      const items: DepositView[] = rows.map((r) =>
        mapDepositRow(r.deposit, { planName: r.planName }),
      );

      const total = totalRow?.count ?? 0;
      return ok({ items, page, pageSize, total, totalPages: Math.ceil(total / pageSize) });
    } catch (error) {
      return fail("DEPOSIT_LIST_ERROR", "Failed to load deposits", error);
    }
  }

  async getByIdForProfile(
    profileId: string,
    depositId: string,
  ): Promise<ServiceResult<DepositView>> {
    const infra = guardDatabase<DepositView>();
    if (infra) return infra;

    try {
      const db = getDb();
      const [row] = await db
        .select({
          deposit: depositRequests,
          planName: investmentPlans.name,
        })
        .from(depositRequests)
        .leftJoin(investmentPlans, eq(depositRequests.planId, investmentPlans.id))
        .where(and(eq(depositRequests.id, depositId), eq(depositRequests.profileId, profileId)))
        .limit(1);

      if (!row) return fail("DEPOSIT_NOT_FOUND", "Deposit not found");

      return ok(
        mapDepositRow(row.deposit, {
          planName: row.planName,
        }),
      );
    } catch (error) {
      return fail("DEPOSIT_GET_ERROR", "Failed to load deposit", error);
    }
  }

  async listForAdmin(
    filters: DepositFilters = {},
  ): Promise<ServiceResult<PaginatedResult<DepositView>>> {
    const infra = guardDatabase<PaginatedResult<DepositView>>();
    if (infra) return infra;

    try {
      const db = getDb();
      const page = filters.page ?? 1;
      const pageSize = Math.min(filters.pageSize ?? 20, 100);
      const offset = (page - 1) * pageSize;

      const conditions = [
        inArray(depositRequests.status, ["submitted", "under_review", "processing"]),
      ];

      if (filters.status) {
        const statuses = Array.isArray(filters.status) ? filters.status : [filters.status];
        conditions.push(inArray(depositRequests.status, statuses));
      }

      if (filters.search) {
        conditions.push(
          or(
            ilike(depositRequests.externalTransactionRef, `%${filters.search}%`),
            ilike(profiles.fullName, `%${filters.search}%`),
            ilike(profiles.email, `%${filters.search}%`),
          )!,
        );
      }

      const whereClause = and(...conditions);

      const [totalRow] = await db
        .select({ count: count() })
        .from(depositRequests)
        .innerJoin(profiles, eq(depositRequests.profileId, profiles.id))
        .where(whereClause);

      const rows = await db
        .select({
          deposit: depositRequests,
          planName: investmentPlans.name,
          customerName: profiles.fullName,
          customerEmail: profiles.email,
        })
        .from(depositRequests)
        .innerJoin(profiles, eq(depositRequests.profileId, profiles.id))
        .leftJoin(investmentPlans, eq(depositRequests.planId, investmentPlans.id))
        .where(whereClause)
        .orderBy(desc(depositRequests.submittedAt))
        .limit(pageSize)
        .offset(offset);

      const items: DepositView[] = rows.map((r) =>
        mapDepositRow(r.deposit, {
          planName: r.planName,
          customerName: r.customerName,
          customerEmail: r.customerEmail,
        }),
      );

      const total = totalRow?.count ?? 0;
      return ok({ items, page, pageSize, total, totalPages: Math.ceil(total / pageSize) });
    } catch (error) {
      return fail("ADMIN_DEPOSIT_LIST_ERROR", "Failed to load deposit queue", error);
    }
  }

  async getByIdForAdmin(depositId: string): Promise<ServiceResult<DepositView>> {
    const infra = guardDatabase<DepositView>();
    if (infra) return infra;

    try {
      const db = getDb();
      const [row] = await db
        .select({
          deposit: depositRequests,
          planName: investmentPlans.name,
          customerName: profiles.fullName,
          customerEmail: profiles.email,
        })
        .from(depositRequests)
        .innerJoin(profiles, eq(depositRequests.profileId, profiles.id))
        .leftJoin(investmentPlans, eq(depositRequests.planId, investmentPlans.id))
        .where(eq(depositRequests.id, depositId))
        .limit(1);

      if (!row) return fail("DEPOSIT_NOT_FOUND", "Deposit not found");

      return ok(
        mapDepositRow(row.deposit, {
          planName: row.planName,
          customerName: row.customerName,
          customerEmail: row.customerEmail,
        }),
      );
    } catch (error) {
      return fail("ADMIN_DEPOSIT_GET_ERROR", "Failed to load deposit", error);
    }
  }

  async approveDeposit(
    depositId: string,
    adminUserId: string,
    _adminAuthUserId: string,
    internalNotes?: string,
  ): Promise<ServiceResult<{ investmentId: string }>> {
    const infra = guardDatabase<{ investmentId: string }>();
    if (infra) return infra;

    try {
      const db = getDb();
      const actor: ActorContext = { adminUserId };

      const result = await db.transaction(async (tx) => {
        const [deposit] = await tx
          .select()
          .from(depositRequests)
          .where(eq(depositRequests.id, depositId))
          .for("update");

        if (!deposit) throw new Error("DEPOSIT_NOT_FOUND");
        if (deposit.status === "approved") throw new Error("ALREADY_APPROVED");
        if (!["submitted", "under_review", "processing"].includes(deposit.status)) {
          throw new Error("INVALID_STATUS");
        }
        if (!deposit.planId) throw new Error("PLAN_REQUIRED");

        const [plan] = await tx
          .select()
          .from(investmentPlans)
          .where(eq(investmentPlans.id, deposit.planId))
          .limit(1);
        if (!plan) throw new Error("PLAN_NOT_FOUND");

        await tx
          .update(depositRequests)
          .set({ status: "processing" })
          .where(eq(depositRequests.id, depositId));

        const amount = deposit.amount;
        const currency = deposit.currency;

        await ledgerService.postEntryInTransaction(tx as Db, {
          profileId: deposit.profileId,
          accountType: "available",
          direction: "credit",
          amount,
          entryType: "deposit",
          idempotencyKey: `deposit-approve-${depositId}-credit-available`,
          referenceType: "deposit_request",
          referenceId: depositId,
          description: `Deposit approved — ${deposit.externalTransactionRef}`,
          actor,
          currency,
        });

        const { investmentId } = await investmentEngine.activateInvestmentInTransaction(
          tx as Db,
          {
            profileId: deposit.profileId,
            planId: deposit.planId,
            principalAmount: amount,
            currency,
            depositRequestId: deposit.id,
            approvedByAdminId: adminUserId,
            paymentMethod: deposit.paymentMethod,
            externalTransactionRef: deposit.externalTransactionRef,
            actor,
          },
        );

        await tx
          .update(depositRequests)
          .set({
            status: "approved",
            investmentId,
            reviewedByAdminId: adminUserId,
            reviewedAt: new Date(),
            approvedAt: new Date(),
            internalNotes: internalNotes ?? deposit.internalNotes,
          })
          .where(eq(depositRequests.id, depositId));

        return { investmentId, deposit, plan };
      });

      await auditService.log({
        action: "approve",
        entityType: "deposit",
        entityId: depositId,
        actor: { adminUserId },
        metadata: { investmentId: result.investmentId },
      });

      await auditService.log({
        action: "create",
        entityType: "investment",
        entityId: result.investmentId,
        actor: { adminUserId },
        metadata: { depositId, amount: result.deposit.amount },
      });

      await notificationService.createNotification({
        profileId: result.deposit.profileId,
        channel: "in_app",
        eventType: "deposit.approved",
        title: "Deposit approved",
        body: `Your deposit of ${result.deposit.amount} ${result.deposit.currency} was approved.`,
        payload: { depositId, investmentId: result.investmentId },
      });

      await notificationService.createNotification({
        profileId: result.deposit.profileId,
        channel: "in_app",
        eventType: "investment.activated",
        title: "Investment activated",
        body: `Your ${result.plan.name} investment is now active and earning ROI.`,
        payload: { investmentId: result.investmentId },
      });

      return ok({ investmentId: result.investmentId });
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === "DEPOSIT_NOT_FOUND") {
          return fail("DEPOSIT_NOT_FOUND", "Deposit not found");
        }
        if (error.message === "ALREADY_APPROVED") {
          return fail("ALREADY_PROCESSED", "Deposit has already been approved");
        }
        if (error.message === "INVALID_STATUS") {
          return fail("INVALID_STATUS", "Deposit cannot be approved in its current status");
        }
      }
      return fail("DEPOSIT_APPROVE_ERROR", "Failed to approve deposit", error);
    }
  }

  async rejectDeposit(
    depositId: string,
    adminUserId: string,
    reason: string,
    internalNotes?: string,
  ): Promise<ServiceResult<void>> {
    const infra = guardDatabase<void>();
    if (infra) return infra;

    try {
      const db = getDb();

      const [deposit] = await db
        .select()
        .from(depositRequests)
        .where(eq(depositRequests.id, depositId))
        .limit(1);

      if (!deposit) return fail("DEPOSIT_NOT_FOUND", "Deposit not found");
      if (deposit.status === "approved") {
        return fail("ALREADY_PROCESSED", "Approved deposits cannot be rejected");
      }
      if (deposit.status === "rejected") {
        return fail("ALREADY_PROCESSED", "Deposit already rejected");
      }

      await db
        .update(depositRequests)
        .set({
          status: "rejected",
          rejectionReason: reason,
          reviewedByAdminId: adminUserId,
          reviewedAt: new Date(),
          internalNotes: internalNotes ?? deposit.internalNotes,
        })
        .where(eq(depositRequests.id, depositId));

      await auditService.log({
        action: "reject",
        entityType: "deposit",
        entityId: depositId,
        actor: { adminUserId },
        metadata: { reason },
      });

      await notificationService.createNotification({
        profileId: deposit.profileId,
        channel: "in_app",
        eventType: "deposit.rejected",
        title: "Deposit rejected",
        body: reason,
        payload: { depositId },
      });

      return ok(undefined);
    } catch (error) {
      return fail("DEPOSIT_REJECT_ERROR", "Failed to reject deposit", error);
    }
  }

  async requestAdditionalInfo(
    depositId: string,
    adminUserId: string,
    message: string,
  ): Promise<ServiceResult<void>> {
    const infra = guardDatabase<void>();
    if (infra) return infra;

    try {
      const db = getDb();
      const [deposit] = await db
        .select()
        .from(depositRequests)
        .where(eq(depositRequests.id, depositId))
        .limit(1);

      if (!deposit) return fail("DEPOSIT_NOT_FOUND", "Deposit not found");

      await db
        .update(depositRequests)
        .set({
          status: "under_review",
          infoRequestMessage: message,
          reviewedByAdminId: adminUserId,
        })
        .where(eq(depositRequests.id, depositId));

      await auditService.log({
        action: "update",
        entityType: "deposit",
        entityId: depositId,
        actor: { adminUserId },
        metadata: { infoRequest: message },
      });

      await notificationService.createNotification({
        profileId: deposit.profileId,
        channel: "in_app",
        eventType: "deposit.info_requested",
        title: "Additional information required",
        body: message,
        payload: { depositId },
      });

      return ok(undefined);
    } catch (error) {
      return fail("DEPOSIT_INFO_ERROR", "Failed to request information", error);
    }
  }

  async attachProof(
    profileId: string,
    depositId: string,
    proofPath: string,
  ): Promise<ServiceResult<void>> {
    const infra = guardDatabase<void>();
    if (infra) return infra;

    try {
      const db = getDb();
      const [deposit] = await db
        .select()
        .from(depositRequests)
        .where(and(eq(depositRequests.id, depositId), eq(depositRequests.profileId, profileId)))
        .limit(1);

      if (!deposit) return fail("DEPOSIT_NOT_FOUND", "Deposit not found");
      if (!["draft", "submitted", "under_review"].includes(deposit.status)) {
        return fail("INVALID_STATUS", "Cannot attach proof to this deposit");
      }

      await db
        .update(depositRequests)
        .set({ proofStoragePath: proofPath })
        .where(eq(depositRequests.id, depositId));

      return ok(undefined);
    } catch (error) {
      return fail("PROOF_ATTACH_ERROR", "Failed to attach proof", error);
    }
  }

  async getAdminStats(): Promise<
    ServiceResult<{
      pendingCount: number;
      approvedToday: number;
      rejectedToday: number;
      volumeToday: string;
    }>
  > {
    const infra = guardDatabase<{
      pendingCount: number;
      approvedToday: number;
      rejectedToday: number;
      volumeToday: string;
    }>();
    if (infra) return infra;

    try {
      const db = getDb();
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const [[pending], [approved], [rejected], [volume]] = await Promise.all([
        db
          .select({ count: count() })
          .from(depositRequests)
          .where(inArray(depositRequests.status, ["submitted", "under_review", "processing"])),
        db
          .select({ count: count() })
          .from(depositRequests)
          .where(
            and(eq(depositRequests.status, "approved"), sql`${depositRequests.approvedAt} >= ${today}`),
          ),
        db
          .select({ count: count() })
          .from(depositRequests)
          .where(
            and(eq(depositRequests.status, "rejected"), sql`${depositRequests.reviewedAt} >= ${today}`),
          ),
        db
          .select({
            total: sql<string>`COALESCE(SUM(${depositRequests.amount}), 0)`,
          })
          .from(depositRequests)
          .where(
            and(eq(depositRequests.status, "approved"), sql`${depositRequests.approvedAt} >= ${today}`),
          ),
      ]);

      return ok({
        pendingCount: pending?.count ?? 0,
        approvedToday: approved?.count ?? 0,
        rejectedToday: rejected?.count ?? 0,
        volumeToday: volume?.total ?? "0.00",
      });
    } catch (error) {
      return fail("ADMIN_STATS_ERROR", "Failed to load admin stats", error);
    }
  }
}

export const depositService = new DepositService();
