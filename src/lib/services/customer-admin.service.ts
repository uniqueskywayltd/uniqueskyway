import {
  and,
  count,
  desc,
  eq,
  ilike,
  isNull,
  or,
  sql,
} from "drizzle-orm";
import { getDb } from "@/db";
import {
  customerNotes,
  investments,
  loginHistory,
  profiles,
  referralCommissions,
  referralRelationships,
  riskEvents,
  userSessions,
} from "@/db/schema";
import { createAdminClient } from "@/lib/supabase/admin";
import { auditService } from "./audit.service";
import { authLockoutService } from "./auth-lockout.service";
import { guardDatabase } from "./infrastructure-guard";
import { portfolioService, type PortfolioData } from "./portfolio.service";
import { walletService, type WalletSummary } from "./wallet.service";
import { fail, ok } from "./base";
import type { ActorContext, PaginatedResult, ServiceResult } from "./types";

export type CustomerFilters = {
  page?: number;
  pageSize?: number;
  search?: string;
  status?: string;
};

export type CustomerListItem = {
  id: string;
  fullName: string;
  email: string;
  username: string;
  status: string;
  emailVerified: boolean;
  loginDisabled: boolean;
  createdAt: Date;
  activeInvestments: number;
};

export type CustomerDetail = CustomerListItem & {
  phone: string | null;
  country: string | null;
  referralCode: string;
  referredByProfileId: string | null;
  wallet: WalletSummary;
  portfolio: PortfolioData;
  referrals: Array<{ profileId: string; fullName: string; email: string; createdAt: Date }>;
  referredBy: { fullName: string; email: string } | null;
  loginHistory: Array<{
    id: string;
    ipAddress: string | null;
    userAgent: string | null;
    success: boolean;
    createdAt: Date;
  }>;
  devices: Array<{
    id: string;
    deviceLabel: string | null;
    browser: string | null;
    os: string | null;
    ipAddress: string | null;
    lastActiveAt: Date | null;
  }>;
  riskEvents: Array<{
    id: string;
    eventType: string;
    severity: string;
    title: string;
    createdAt: Date;
  }>;
  notes: Array<{ id: string; content: string; adminUserId: string; createdAt: Date }>;
  referralEarnings: string;
};

export class CustomerAdminService {
  async listForAdmin(
    filters: CustomerFilters = {},
  ): Promise<ServiceResult<PaginatedResult<CustomerListItem>>> {
    const infra = guardDatabase<PaginatedResult<CustomerListItem>>();
    if (infra) return infra;

    try {
      const db = getDb();
      const page = filters.page ?? 1;
      const pageSize = Math.min(filters.pageSize ?? 20, 100);
      const offset = (page - 1) * pageSize;

      const conditions = [isNull(profiles.deletedAt)];

      if (filters.status) {
        conditions.push(eq(profiles.status, filters.status as never));
      }

      if (filters.search) {
        conditions.push(
          or(
            ilike(profiles.fullName, `%${filters.search}%`),
            ilike(profiles.email, `%${filters.search}%`),
            ilike(profiles.username, `%${filters.search}%`),
          )!,
        );
      }

      const whereClause = and(...conditions);

      const [totalRow] = await db
        .select({ count: count() })
        .from(profiles)
        .where(whereClause);

      const rows = await db
        .select()
        .from(profiles)
        .where(whereClause)
        .orderBy(desc(profiles.createdAt))
        .limit(pageSize)
        .offset(offset);

      const items: CustomerListItem[] = await Promise.all(
        rows.map(async (p) => {
          const [invCount] = await db
            .select({ count: count() })
            .from(investments)
            .where(and(eq(investments.profileId, p.id), eq(investments.status, "active")));

          return {
            id: p.id,
            fullName: p.fullName,
            email: p.email,
            username: p.username,
            status: p.status,
            emailVerified: p.emailVerified,
            loginDisabled: p.loginDisabled,
            createdAt: p.createdAt,
            activeInvestments: invCount?.count ?? 0,
          };
        }),
      );

      const total = totalRow?.count ?? 0;

      return ok({
        items,
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      });
    } catch (error) {
      return fail("CUSTOMER_LIST_ERROR", "Failed to list customers", error);
    }
  }

  async getDetail(profileId: string): Promise<ServiceResult<CustomerDetail>> {
    const infra = guardDatabase<CustomerDetail>();
    if (infra) return infra;

    try {
      const db = getDb();
      const [profile] = await db
        .select()
        .from(profiles)
        .where(and(eq(profiles.id, profileId), isNull(profiles.deletedAt)))
        .limit(1);

      if (!profile) return fail("CUSTOMER_NOT_FOUND", "Customer not found");

      const [walletResult, portfolioResult, referrals, logins, sessions, risks, notes, earnings] =
        await Promise.all([
          walletService.getWalletSummary(profileId),
          portfolioService.getPortfolioData(profileId),
          db
            .select({
              profileId: profiles.id,
              fullName: profiles.fullName,
              email: profiles.email,
              createdAt: referralRelationships.createdAt,
            })
            .from(referralRelationships)
            .innerJoin(profiles, eq(referralRelationships.referredProfileId, profiles.id))
            .where(eq(referralRelationships.referrerProfileId, profileId))
            .orderBy(desc(referralRelationships.createdAt))
            .limit(50),
          db
            .select()
            .from(loginHistory)
            .where(eq(loginHistory.profileId, profileId))
            .orderBy(desc(loginHistory.createdAt))
            .limit(20),
          db
            .select()
            .from(userSessions)
            .where(and(eq(userSessions.profileId, profileId), isNull(userSessions.revokedAt)))
            .orderBy(desc(userSessions.lastActiveAt))
            .limit(20),
          db
            .select()
            .from(riskEvents)
            .where(eq(riskEvents.profileId, profileId))
            .orderBy(desc(riskEvents.createdAt))
            .limit(20),
          db
            .select()
            .from(customerNotes)
            .where(eq(customerNotes.profileId, profileId))
            .orderBy(desc(customerNotes.createdAt))
            .limit(50),
          db
            .select({
              total: sql<string>`COALESCE(SUM(${referralCommissions.commissionAmount}), 0)`,
            })
            .from(referralCommissions)
            .where(eq(referralCommissions.referrerProfileId, profileId)),
        ]);

      let referredBy: { fullName: string; email: string } | null = null;
      if (profile.referredByProfileId) {
        const [ref] = await db
          .select({ fullName: profiles.fullName, email: profiles.email })
          .from(profiles)
          .where(eq(profiles.id, profile.referredByProfileId))
          .limit(1);
        referredBy = ref ?? null;
      }

      const [invCount] = await db
        .select({ count: count() })
        .from(investments)
        .where(and(eq(investments.profileId, profileId), eq(investments.status, "active")));

      const emptyWallet: WalletSummary = {
        currency: "USD",
        totalPortfolioValue: "0.00",
        availableBalance: "0.00",
        reservedBalance: "0.00",
        withdrawableBalance: "0.00",
        lockedBalance: "0.00",
        pendingBalance: "0.00",
        pendingDeposits: "0.00",
        pendingWithdrawals: "0.00",
        referralEarnings: "0.00",
        totalCredits: "0.00",
        totalDebits: "0.00",
        totalDeposits: "0.00",
        totalWithdrawals: "0.00",
        totalRoiEarned: "0.00",
        pendingDepositCount: 0,
        pendingWithdrawalCount: 0,
        pendingTransactionCount: 0,
      };

      const wallet = walletResult.success ? walletResult.data : emptyWallet;

      const portfolio = portfolioResult.success
        ? portfolioResult.data
        : {
            activeInvestments: 0,
            maturedInvestments: 0,
            pendingInvestments: 0,
            totalInvestments: 0,
            totalPrincipal: "0.00",
            totalRoiEarned: "0.00",
            totalAccruedInterest: "0.00",
            allocation: [],
            positions: [],
            currency: "USD",
          };

      return ok({
        id: profile.id,
        fullName: profile.fullName,
        email: profile.email,
        username: profile.username,
        status: profile.status,
        emailVerified: profile.emailVerified,
        loginDisabled: profile.loginDisabled,
        createdAt: profile.createdAt,
        activeInvestments: invCount?.count ?? 0,
        phone: profile.phone,
        country: profile.country,
        referralCode: profile.referralCode,
        referredByProfileId: profile.referredByProfileId,
        wallet,
        portfolio,
        referrals,
        referredBy,
        loginHistory: logins.map((l) => ({
          id: l.id,
          ipAddress: l.ipAddress,
          userAgent: l.userAgent,
          success: l.success,
          createdAt: l.createdAt,
        })),
        devices: sessions.map((s) => ({
          id: s.id,
          deviceLabel: s.deviceLabel,
          browser: s.browser,
          os: s.os,
          ipAddress: s.ipAddress,
          lastActiveAt: s.lastActiveAt,
        })),
        riskEvents: risks.map((r) => ({
          id: r.id,
          eventType: r.eventType,
          severity: r.severity,
          title: r.title,
          createdAt: r.createdAt,
        })),
        notes: notes.map((n) => ({
          id: n.id,
          content: n.content,
          adminUserId: n.adminUserId,
          createdAt: n.createdAt,
        })),
        referralEarnings: earnings[0]?.total ?? "0.00",
      });
    } catch (error) {
      return fail("CUSTOMER_DETAIL_ERROR", "Failed to load customer", error);
    }
  }

  async addNote(input: {
    profileId: string;
    adminUserId: string;
    content: string;
    actor?: ActorContext;
  }): Promise<ServiceResult<{ id: string }>> {
    if (!input.content.trim()) return fail("NOTE_REQUIRED", "Note content is required");

    try {
      const db = getDb();
      const [note] = await db
        .insert(customerNotes)
        .values({
          profileId: input.profileId,
          adminUserId: input.adminUserId,
          content: input.content.trim(),
        })
        .returning({ id: customerNotes.id });

      await auditService.log({
        action: "create",
        entityType: "customer_note",
        entityId: note.id,
        actor: { adminUserId: input.adminUserId, ...input.actor },
        metadata: { profileId: input.profileId },
      });

      return ok({ id: note.id });
    } catch (error) {
      return fail("NOTE_ERROR", "Failed to add note", error);
    }
  }

  async updateStatus(input: {
    profileId: string;
    status: "active" | "suspended" | "pending_verification";
    adminUserId: string;
    reason: string;
    actor?: ActorContext;
  }): Promise<ServiceResult<void>> {
    try {
      const db = getDb();
      const [before] = await db
        .select({ status: profiles.status })
        .from(profiles)
        .where(eq(profiles.id, input.profileId))
        .limit(1);

      if (!before) return fail("CUSTOMER_NOT_FOUND", "Customer not found");

      await db
        .update(profiles)
        .set({ status: input.status })
        .where(eq(profiles.id, input.profileId));

      await auditService.log({
        action: "update",
        entityType: "profile",
        entityId: input.profileId,
        actor: { adminUserId: input.adminUserId, ...input.actor },
        beforeState: { status: before.status },
        afterState: { status: input.status },
        metadata: { reason: input.reason, action: "status_change" },
      });

      return ok(undefined);
    } catch (error) {
      return fail("STATUS_UPDATE_ERROR", "Failed to update status", error);
    }
  }

  async setLoginDisabled(input: {
    profileId: string;
    disabled: boolean;
    adminUserId: string;
    reason: string;
    actor?: ActorContext;
  }): Promise<ServiceResult<void>> {
    try {
      const db = getDb();
      const [profile] = await db
        .select({ email: profiles.email, loginDisabled: profiles.loginDisabled })
        .from(profiles)
        .where(eq(profiles.id, input.profileId))
        .limit(1);

      if (!profile) return fail("CUSTOMER_NOT_FOUND", "Customer not found");

      await db
        .update(profiles)
        .set({ loginDisabled: input.disabled })
        .where(eq(profiles.id, input.profileId));

      if (input.disabled) {
        const lockUntil = new Date();
        lockUntil.setFullYear(lockUntil.getFullYear() + 10);
        await authLockoutService.lock(profile.email, lockUntil);
      } else {
        await authLockoutService.clear(profile.email);
      }

      await auditService.log({
        action: "update",
        entityType: "profile",
        entityId: input.profileId,
        actor: { adminUserId: input.adminUserId, ...input.actor },
        beforeState: { loginDisabled: profile.loginDisabled },
        afterState: { loginDisabled: input.disabled },
        metadata: { reason: input.reason, action: input.disabled ? "disable_login" : "enable_login" },
      });

      return ok(undefined);
    } catch (error) {
      return fail("LOGIN_TOGGLE_ERROR", "Failed to toggle login", error);
    }
  }

  async lockAccount(input: {
    profileId: string;
    adminUserId: string;
    reason: string;
    actor?: ActorContext;
  }): Promise<ServiceResult<void>> {
    const db = getDb();
    const [profile] = await db
      .select({ email: profiles.email })
      .from(profiles)
      .where(eq(profiles.id, input.profileId))
      .limit(1);

    if (!profile) return fail("CUSTOMER_NOT_FOUND", "Customer not found");

    const lockUntil = new Date();
    lockUntil.setDate(lockUntil.getDate() + 30);

    await authLockoutService.lock(profile.email, lockUntil);

    await auditService.log({
      action: "update",
      entityType: "profile",
      entityId: input.profileId,
      actor: { adminUserId: input.adminUserId, ...input.actor },
      metadata: { reason: input.reason, action: "lock_account" },
    });

    return ok(undefined);
  }

  async unlockAccount(input: {
    profileId: string;
    adminUserId: string;
    reason: string;
    actor?: ActorContext;
  }): Promise<ServiceResult<void>> {
    const db = getDb();
    const [profile] = await db
      .select({ email: profiles.email })
      .from(profiles)
      .where(eq(profiles.id, input.profileId))
      .limit(1);

    if (!profile) return fail("CUSTOMER_NOT_FOUND", "Customer not found");

    await authLockoutService.clear(profile.email);

    await auditService.log({
      action: "update",
      entityType: "profile",
      entityId: input.profileId,
      actor: { adminUserId: input.adminUserId, ...input.actor },
      metadata: { reason: input.reason, action: "unlock_account" },
    });

    return ok(undefined);
  }

  async forceEmailVerification(input: {
    profileId: string;
    adminUserId: string;
    actor?: ActorContext;
  }): Promise<ServiceResult<void>> {
    try {
      const db = getDb();
      const [profile] = await db
        .select({ authUserId: profiles.authUserId })
        .from(profiles)
        .where(eq(profiles.id, input.profileId))
        .limit(1);

      if (!profile) return fail("CUSTOMER_NOT_FOUND", "Customer not found");

      const admin = createAdminClient();
      await admin.auth.admin.updateUserById(profile.authUserId, { email_confirm: true });

      await db
        .update(profiles)
        .set({ emailVerified: true, status: "active" })
        .where(eq(profiles.id, input.profileId));

      await auditService.log({
        action: "update",
        entityType: "profile",
        entityId: input.profileId,
        actor: { adminUserId: input.adminUserId, ...input.actor },
        metadata: { action: "force_email_verification" },
      });

      return ok(undefined);
    } catch (error) {
      return fail("VERIFY_ERROR", "Failed to verify email", error);
    }
  }

  async initiatePasswordReset(input: {
    profileId: string;
    adminUserId: string;
    actor?: ActorContext;
  }): Promise<ServiceResult<{ resetLink: string | null }>> {
    try {
      const db = getDb();
      const [profile] = await db
        .select({ email: profiles.email, authUserId: profiles.authUserId })
        .from(profiles)
        .where(eq(profiles.id, input.profileId))
        .limit(1);

      if (!profile) return fail("CUSTOMER_NOT_FOUND", "Customer not found");

      const admin = createAdminClient();
      const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
      const { data, error } = await admin.auth.admin.generateLink({
        type: "recovery",
        email: profile.email,
        options: { redirectTo: `${appUrl}/reset-password` },
      });

      if (error) return fail("RESET_ERROR", "Failed to generate reset link", error);

      await auditService.log({
        action: "update",
        entityType: "password",
        entityId: input.profileId,
        actor: { adminUserId: input.adminUserId, ...input.actor },
        metadata: { action: "admin_password_reset_initiated" },
      });

      return ok({ resetLink: data.properties?.action_link ?? null });
    } catch (error) {
      return fail("RESET_ERROR", "Failed to initiate password reset", error);
    }
  }
}

export const customerAdminService = new CustomerAdminService();
