import { and, count, desc, eq, or } from "drizzle-orm";
import { getDb } from "@/db";
import { auditLogs } from "@/db/schema";
import type { AuditAction } from "@/types/domain";
import { guardDatabase } from "./infrastructure-guard";
import { fail, ok } from "./base";
import type { ActorContext, PaginatedResult, ServiceResult } from "./types";

export type AuditLogInput = {
  action: AuditAction;
  entityType: string;
  entityId?: string;
  beforeState?: Record<string, unknown>;
  afterState?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
  actor?: ActorContext;
};

/**
 * Centralized audit logging — every sensitive action should pass through here.
 */
export class AuditService {
  async log(input: AuditLogInput): Promise<ServiceResult<{ id: string }>> {
    try {
      const db = getDb();

      const [record] = await db
        .insert(auditLogs)
        .values({
          action: input.action,
          entityType: input.entityType,
          entityId: input.entityId,
          actorProfileId: input.actor?.profileId,
          actorAdminId: input.actor?.adminUserId,
          ipAddress: input.actor?.ipAddress,
          userAgent: input.actor?.userAgent,
          beforeState: input.beforeState,
          afterState: input.afterState,
          metadata: input.metadata,
        })
        .returning({ id: auditLogs.id });

      return ok({ id: record.id });
    } catch (error) {
      return fail("AUDIT_LOG_ERROR", "Failed to write audit log", error);
    }
  }

  async getTimelineForProfile(
    profileId: string,
    page = 1,
    pageSize = 20,
    category?: string,
  ): Promise<
    ServiceResult<
      PaginatedResult<{
        id: string;
        type: string;
        category: string;
        title: string;
        description: string | null;
        timestamp: Date;
        metadata?: Record<string, unknown>;
      }>
    >
  > {
    const infra = guardDatabase<
      PaginatedResult<{
        id: string;
        type: string;
        category: string;
        title: string;
        description: string | null;
        timestamp: Date;
        metadata?: Record<string, unknown>;
      }>
    >();
    if (infra) return infra;

    try {
      const db = getDb();
      const offset = (page - 1) * pageSize;

      const conditions = [
        or(
          eq(auditLogs.actorProfileId, profileId),
          eq(auditLogs.entityId, profileId),
        )!,
      ];

      if (category && category !== "all") {
        conditions.push(eq(auditLogs.entityType, category));
      }

      const whereClause = and(...conditions);

      const [totalRow] = await db
        .select({ count: count() })
        .from(auditLogs)
        .where(whereClause);

      const rows = await db
        .select()
        .from(auditLogs)
        .where(whereClause)
        .orderBy(desc(auditLogs.createdAt))
        .limit(pageSize)
        .offset(offset);

      const items = rows.map((row) => ({
        id: row.id,
        type: `${row.action}.${row.entityType}`,
        category: row.entityType,
        title: formatAuditTitle(row.action, row.entityType),
        description: row.entityId,
        timestamp: row.createdAt,
        metadata: (row.metadata as Record<string, unknown>) ?? undefined,
      }));

      const total = totalRow?.count ?? 0;

      return ok({
        items,
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      });
    } catch (error) {
      return fail("AUDIT_TIMELINE_ERROR", "Failed to load activity timeline", error);
    }
  }
}

function formatAuditTitle(action: AuditAction, entityType: string): string {
  const labels: Record<string, string> = {
    profile: "Profile",
    session: "Session",
    deposit: "Deposit",
    withdrawal: "Withdrawal",
    investment: "Investment",
    referral: "Referral",
    password: "Password",
    auth: "Authentication",
  };
  const entity = labels[entityType] ?? entityType;
  const actionLabels: Record<AuditAction, string> = {
    create: "Created",
    update: "Updated",
    delete: "Deleted",
    approve: "Approved",
    reject: "Rejected",
    login: "Signed in",
    logout: "Signed out",
    export: "Exported",
    adjustment: "Adjusted",
  };
  return `${actionLabels[action] ?? action} ${entity}`;
}

export const auditService = new AuditService();
