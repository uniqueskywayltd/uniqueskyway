import { and, count, desc, eq, gte, ilike, lte, or } from "drizzle-orm";
import { getDb } from "@/db";
import { auditLogs, adminUsers, profiles } from "@/db/schema";
import type { AuditAction } from "@/types/domain";
import { guardDatabase } from "./infrastructure-guard";
import { fail, ok } from "./base";
import type { PaginatedResult, ServiceResult } from "./types";

export type AuditLogView = {
  id: string;
  action: AuditAction;
  entityType: string;
  entityId: string | null;
  actorProfileId: string | null;
  actorAdminId: string | null;
  actorName: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  beforeState: Record<string, unknown> | null;
  afterState: Record<string, unknown> | null;
  metadata: Record<string, unknown> | null;
  createdAt: Date;
};

export type AuditFilters = {
  page?: number;
  pageSize?: number;
  search?: string;
  action?: AuditAction;
  entityType?: string;
  actorProfileId?: string;
  actorAdminId?: string;
  from?: Date;
  to?: Date;
};

export class AdminAuditService {
  async list(filters: AuditFilters = {}): Promise<ServiceResult<PaginatedResult<AuditLogView>>> {
    const infra = guardDatabase<PaginatedResult<AuditLogView>>();
    if (infra) return infra;

    try {
      const db = getDb();
      const page = filters.page ?? 1;
      const pageSize = Math.min(filters.pageSize ?? 30, 100);
      const offset = (page - 1) * pageSize;

      const conditions = [];

      if (filters.action) conditions.push(eq(auditLogs.action, filters.action));
      if (filters.entityType) conditions.push(eq(auditLogs.entityType, filters.entityType));
      if (filters.actorProfileId) conditions.push(eq(auditLogs.actorProfileId, filters.actorProfileId));
      if (filters.actorAdminId) conditions.push(eq(auditLogs.actorAdminId, filters.actorAdminId));
      if (filters.from) conditions.push(gte(auditLogs.createdAt, filters.from));
      if (filters.to) conditions.push(lte(auditLogs.createdAt, filters.to));

      if (filters.search) {
        conditions.push(
          or(
            ilike(auditLogs.entityType, `%${filters.search}%`),
            ilike(auditLogs.entityId, `%${filters.search}%`),
          )!,
        );
      }

      const whereClause = conditions.length ? and(...conditions) : undefined;

      const [totalRow] = await db
        .select({ count: count() })
        .from(auditLogs)
        .where(whereClause);

      const rows = await db
        .select({
          log: auditLogs,
          adminName: adminUsers.fullName,
          profileName: profiles.fullName,
        })
        .from(auditLogs)
        .leftJoin(adminUsers, eq(auditLogs.actorAdminId, adminUsers.id))
        .leftJoin(profiles, eq(auditLogs.actorProfileId, profiles.id))
        .where(whereClause)
        .orderBy(desc(auditLogs.createdAt))
        .limit(pageSize)
        .offset(offset);

      const items: AuditLogView[] = rows.map((r) => ({
        id: r.log.id,
        action: r.log.action as AuditAction,
        entityType: r.log.entityType,
        entityId: r.log.entityId,
        actorProfileId: r.log.actorProfileId,
        actorAdminId: r.log.actorAdminId,
        actorName: r.adminName ?? r.profileName ?? null,
        ipAddress: r.log.ipAddress,
        userAgent: r.log.userAgent,
        beforeState: (r.log.beforeState as Record<string, unknown>) ?? null,
        afterState: (r.log.afterState as Record<string, unknown>) ?? null,
        metadata: (r.log.metadata as Record<string, unknown>) ?? null,
        createdAt: r.log.createdAt,
      }));

      const total = totalRow?.count ?? 0;

      return ok({ items, page, pageSize, total, totalPages: Math.ceil(total / pageSize) });
    } catch (error) {
      return fail("AUDIT_LIST_ERROR", "Failed to load audit logs", error);
    }
  }
}

export const adminAuditService = new AdminAuditService();
