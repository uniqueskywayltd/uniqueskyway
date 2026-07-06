import { and, count, desc, eq, gte, sql } from "drizzle-orm";
import { getDb } from "@/db";
import { loginHistory, riskEvents, withdrawalRequests } from "@/db/schema";
import type { RiskEventType, RiskSeverity } from "@/types/domain";
import { guardDatabase } from "./infrastructure-guard";
import { fail, ok } from "./base";
import type { PaginatedResult, ServiceResult } from "./types";
export type RiskEventView = {
  id: string;
  profileId: string;
  withdrawalRequestId: string | null;
  eventType: RiskEventType;
  severity: RiskSeverity;
  title: string;
  description: string | null;
  metadata: Record<string, unknown>;
  createdAt: Date;
};

const LARGE_WITHDRAWAL_THRESHOLD = 5000;
const MULTIPLE_WITHDRAWALS_WINDOW_HOURS = 24;
const MULTIPLE_WITHDRAWALS_COUNT = 3;

export class RiskService {
  async recordEvent(input: {
    profileId: string;
    withdrawalRequestId?: string;
    eventType: RiskEventType;
    severity: RiskSeverity;
    title: string;
    description?: string;
    metadata?: Record<string, unknown>;
  }): Promise<ServiceResult<{ id: string }>> {
    try {
      const db = getDb();
      const [event] = await db
        .insert(riskEvents)
        .values({
          profileId: input.profileId,
          withdrawalRequestId: input.withdrawalRequestId,
          eventType: input.eventType,
          severity: input.severity,
          title: input.title,
          description: input.description,
          metadata: input.metadata ?? {},
        })
        .returning({ id: riskEvents.id });

      return ok({ id: event.id });
    } catch (error) {
      return fail("RISK_EVENT_ERROR", "Failed to record risk event", error);
    }
  }

  async evaluateWithdrawal(input: {
    profileId: string;
    withdrawalId: string;
    amount: number;
    availableBalance: number;
    ipAddress?: string;
    userAgent?: string;
  }): Promise<ServiceResult<RiskEventView[]>> {
    const infra = guardDatabase<RiskEventView[]>();
    if (infra) return infra;

    const recorded: RiskEventView[] = [];

    try {
      const db = getDb();

      if (input.amount >= LARGE_WITHDRAWAL_THRESHOLD) {
        const result = await this.recordEvent({
          profileId: input.profileId,
          withdrawalRequestId: input.withdrawalId,
          eventType: "large_withdrawal",
          severity: input.amount >= LARGE_WITHDRAWAL_THRESHOLD * 2 ? "high" : "medium",
          title: "Large withdrawal request",
          description: `Withdrawal of ${input.amount.toFixed(2)} exceeds monitoring threshold`,
          metadata: { amount: input.amount, threshold: LARGE_WITHDRAWAL_THRESHOLD },
        });
        if (result.success) recorded.push(await this.toView(result.data.id));
      }

      if (input.amount > input.availableBalance * 0.9 && input.availableBalance > 0) {
        const result = await this.recordEvent({
          profileId: input.profileId,
          withdrawalRequestId: input.withdrawalId,
          eventType: "high_risk_pattern",
          severity: "medium",
          title: "Near-maximum balance withdrawal",
          description: "Customer is withdrawing more than 90% of available balance",
          metadata: {
            amount: input.amount,
            availableBalance: input.availableBalance,
          },
        });
        if (result.success) recorded.push(await this.toView(result.data.id));
      }

      const since = new Date();
      since.setHours(since.getHours() - MULTIPLE_WITHDRAWALS_WINDOW_HOURS);

      const [recentCount] = await db
        .select({ count: count() })
        .from(withdrawalRequests)
        .where(
          and(
            eq(withdrawalRequests.profileId, input.profileId),
            gte(withdrawalRequests.submittedAt, since),
            sql`${withdrawalRequests.status} NOT IN ('rejected', 'cancelled')`,
          ),
        );

      if ((recentCount?.count ?? 0) >= MULTIPLE_WITHDRAWALS_COUNT) {
        const result = await this.recordEvent({
          profileId: input.profileId,
          withdrawalRequestId: input.withdrawalId,
          eventType: "multiple_withdrawals",
          severity: "medium",
          title: "Multiple withdrawals in 24 hours",
          description: `${recentCount?.count} withdrawal requests in the last ${MULTIPLE_WITHDRAWALS_WINDOW_HOURS} hours`,
          metadata: { count: recentCount?.count, windowHours: MULTIPLE_WITHDRAWALS_WINDOW_HOURS },
        });
        if (result.success) recorded.push(await this.toView(result.data.id));
      }

      if (input.ipAddress) {
        const [recentLogin] = await db
          .select()
          .from(loginHistory)
          .where(
            and(
              eq(loginHistory.profileId, input.profileId),
              eq(loginHistory.success, true),
            ),
          )
          .orderBy(desc(loginHistory.createdAt))
          .limit(2);

        if (recentLogin?.ipAddress && recentLogin.ipAddress !== input.ipAddress) {
          const result = await this.recordEvent({
            profileId: input.profileId,
            withdrawalRequestId: input.withdrawalId,
            eventType: "new_login_location",
            severity: "low",
            title: "Withdrawal from new IP address",
            description: `Request IP ${input.ipAddress} differs from last login ${recentLogin.ipAddress}`,
            metadata: { requestIp: input.ipAddress, lastLoginIp: recentLogin.ipAddress },
          });
          if (result.success) recorded.push(await this.toView(result.data.id));
        }
      }

      if (input.userAgent) {
        const [lastSession] = await db
          .select()
          .from(loginHistory)
          .where(
            and(eq(loginHistory.profileId, input.profileId), eq(loginHistory.success, true)),
          )
          .orderBy(desc(loginHistory.createdAt))
          .limit(1);

        if (
          lastSession?.userAgent &&
          lastSession.userAgent !== input.userAgent &&
          lastSession.userAgent.slice(0, 20) !== input.userAgent.slice(0, 20)
        ) {
          const result = await this.recordEvent({
            profileId: input.profileId,
            withdrawalRequestId: input.withdrawalId,
            eventType: "device_change",
            severity: "low",
            title: "Withdrawal from different device",
            description: "User agent differs from most recent login session",
            metadata: { userAgent: input.userAgent },
          });
          if (result.success) recorded.push(await this.toView(result.data.id));
        }
      }

      return ok(recorded.filter(Boolean) as RiskEventView[]);
    } catch (error) {
      return fail("RISK_EVALUATION_ERROR", "Failed to evaluate withdrawal risk", error);
    }
  }

  async listForAdmin(filters: {
    page?: number;
    pageSize?: number;
    severity?: RiskSeverity;
    profileId?: string;
  } = {}): Promise<ServiceResult<PaginatedResult<RiskEventView>>> {
    const infra = guardDatabase<PaginatedResult<RiskEventView>>();
    if (infra) return infra;

    try {
      const db = getDb();
      const page = filters.page ?? 1;
      const pageSize = Math.min(filters.pageSize ?? 30, 100);
      const offset = (page - 1) * pageSize;

      const conditions = [];
      if (filters.severity) conditions.push(eq(riskEvents.severity, filters.severity));
      if (filters.profileId) conditions.push(eq(riskEvents.profileId, filters.profileId));

      const whereClause = conditions.length ? and(...conditions) : undefined;

      const [totalRow] = await db
        .select({ count: count() })
        .from(riskEvents)
        .where(whereClause);

      const rows = await db
        .select()
        .from(riskEvents)
        .where(whereClause)
        .orderBy(desc(riskEvents.createdAt))
        .limit(pageSize)
        .offset(offset);

      const items = rows.map((r) => this.rowToView(r));
      const total = totalRow?.count ?? 0;

      return ok({ items, page, pageSize, total, totalPages: Math.ceil(total / pageSize) });
    } catch (error) {
      return fail("RISK_LIST_ERROR", "Failed to load risk events", error);
    }
  }

  async getInsights(): Promise<
    ServiceResult<{
      highSeverityCount: number;
      failedLogins24h: number;
      largeWithdrawals: number;
      rapidDeposits: number;
    }>
  > {
    const infra = guardDatabase<{
      highSeverityCount: number;
      failedLogins24h: number;
      largeWithdrawals: number;
      rapidDeposits: number;
    }>();
    if (infra) return infra;

    try {
      const db = getDb();
      const since = new Date();
      since.setHours(since.getHours() - 24);

      const [[high], [largeWd]] = await Promise.all([
        db
          .select({ count: count() })
          .from(riskEvents)
          .where(eq(riskEvents.severity, "high")),
        db
          .select({ count: count() })
          .from(riskEvents)
          .where(
            and(eq(riskEvents.eventType, "large_withdrawal"), gte(riskEvents.createdAt, since)),
          ),
        db
          .select({ count: count() })
          .from(riskEvents)
          .where(
            and(eq(riskEvents.eventType, "multiple_withdrawals"), gte(riskEvents.createdAt, since)),
          ),
      ]);

      const [failedLogins] = await db
        .select({ count: count() })
        .from(loginHistory)
        .where(and(eq(loginHistory.success, false), gte(loginHistory.createdAt, since)));

      return ok({
        highSeverityCount: high?.count ?? 0,
        failedLogins24h: failedLogins?.count ?? 0,
        largeWithdrawals: largeWd?.count ?? 0,
        rapidDeposits: 0,
      });
    } catch (error) {
      return fail("RISK_INSIGHTS_ERROR", "Failed to load risk insights", error);
    }
  }

  async listForWithdrawal(withdrawalId: string): Promise<ServiceResult<RiskEventView[]>> {
    const infra = guardDatabase<RiskEventView[]>();
    if (infra) return infra;

    try {
      const db = getDb();
      const rows = await db
        .select()
        .from(riskEvents)
        .where(eq(riskEvents.withdrawalRequestId, withdrawalId))
        .orderBy(desc(riskEvents.createdAt));

      return ok(rows.map((r) => this.rowToView(r)));
    } catch (error) {
      return fail("RISK_LIST_ERROR", "Failed to load risk events", error);
    }
  }

  private async toView(id: string): Promise<RiskEventView> {
    const db = getDb();
    const [row] = await db.select().from(riskEvents).where(eq(riskEvents.id, id)).limit(1);
    return this.rowToView(row);
  }

  private rowToView(row: typeof riskEvents.$inferSelect): RiskEventView {
    return {
      id: row.id,
      profileId: row.profileId,
      withdrawalRequestId: row.withdrawalRequestId,
      eventType: row.eventType as RiskEventType,
      severity: row.severity as RiskSeverity,
      title: row.title,
      description: row.description,
      metadata: (row.metadata as Record<string, unknown>) ?? {},
      createdAt: row.createdAt,
    };
  }
}

export const riskService = new RiskService();
