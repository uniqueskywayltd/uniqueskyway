import { asc, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { paymentMethods } from "@/db/schema";
import { auditService } from "./audit.service";
import { guardDatabase } from "./infrastructure-guard";
import { fail, ok } from "./base";
import type { ServiceResult } from "./types";

export type PaymentMethodAdminView = PaymentMethodView & {
  isActive: boolean;
  sortOrder: number;
  updatedAt: Date;
};

export type PaymentMethodView = {
  id: string;
  slug: string;
  name: string;
  methodType: string;
  description: string | null;
  instructions: string | null;
  requiresProof: boolean;
  minAmount: string | null;
  maxAmount: string | null;
  config: Record<string, unknown>;
};

export class PaymentMethodService {
  async listActive(): Promise<ServiceResult<PaymentMethodView[]>> {
    const infra = guardDatabase<PaymentMethodView[]>();
    if (infra) return infra;

    try {
      const db = getDb();
      const rows = await db
        .select()
        .from(paymentMethods)
        .where(eq(paymentMethods.isActive, true))
        .orderBy(asc(paymentMethods.sortOrder));

      return ok(
        rows.map((r) => ({
          id: r.id,
          slug: r.slug,
          name: r.name,
          methodType: r.methodType,
          description: r.description,
          instructions: r.instructions,
          requiresProof: r.requiresProof,
          minAmount: r.minAmount,
          maxAmount: r.maxAmount,
          config: (r.config as Record<string, unknown>) ?? {},
        })),
      );
    } catch (error) {
      return fail("PAYMENT_METHODS_ERROR", "Failed to load payment methods", error);
    }
  }

  async getBySlug(slug: string): Promise<ServiceResult<PaymentMethodView>> {
    const infra = guardDatabase<PaymentMethodView>();
    if (infra) return infra;

    try {
      const db = getDb();
      const [row] = await db
        .select()
        .from(paymentMethods)
        .where(eq(paymentMethods.slug, slug))
        .limit(1);

      if (!row || !row.isActive) {
        return fail("PAYMENT_METHOD_NOT_FOUND", "Payment method not found or inactive");
      }

      return ok({
        id: row.id,
        slug: row.slug,
        name: row.name,
        methodType: row.methodType,
        description: row.description,
        instructions: row.instructions,
        requiresProof: row.requiresProof,
        minAmount: row.minAmount,
        maxAmount: row.maxAmount,
        config: (row.config as Record<string, unknown>) ?? {},
      });
    } catch (error) {
      return fail("PAYMENT_METHOD_ERROR", "Failed to load payment method", error);
    }
  }

  async listAllAdmin(): Promise<ServiceResult<PaymentMethodAdminView[]>> {
    const infra = guardDatabase<PaymentMethodAdminView[]>();
    if (infra) return infra;

    try {
      const db = getDb();
      const rows = await db.select().from(paymentMethods).orderBy(asc(paymentMethods.sortOrder));
      return ok(rows.map((r) => this.toAdminView(r)));
    } catch (error) {
      return fail("PAYMENT_METHODS_ERROR", "Failed to load payment methods", error);
    }
  }

  async createAdmin(input: {
    slug: string;
    name: string;
    methodType: "cryptocurrency" | "bank_transfer" | "manual" | "gateway";
    description?: string;
    instructions?: string;
    requiresProof?: boolean;
    minAmount?: string;
    maxAmount?: string;
    config?: Record<string, unknown>;
    isActive?: boolean;
    sortOrder?: number;
    adminUserId: string;
  }): Promise<ServiceResult<{ id: string }>> {
    try {
      const db = getDb();
      const [row] = await db
        .insert(paymentMethods)
        .values({
          slug: input.slug,
          name: input.name,
          methodType: input.methodType,
          description: input.description,
          instructions: input.instructions,
          requiresProof: input.requiresProof ?? true,
          minAmount: input.minAmount,
          maxAmount: input.maxAmount,
          config: input.config ?? {},
          isActive: input.isActive ?? true,
          sortOrder: input.sortOrder ?? 0,
        })
        .returning({ id: paymentMethods.id });

      await auditService.log({
        action: "create",
        entityType: "payment_method",
        entityId: row.id,
        actor: { adminUserId: input.adminUserId },
        metadata: { slug: input.slug },
      });

      return ok({ id: row.id });
    } catch (error) {
      return fail("PAYMENT_METHOD_CREATE_ERROR", "Failed to create payment method", error);
    }
  }

  async updateAdmin(input: {
    id: string;
    name?: string;
    description?: string;
    instructions?: string;
    requiresProof?: boolean;
    minAmount?: string | null;
    maxAmount?: string | null;
    config?: Record<string, unknown>;
    isActive?: boolean;
    sortOrder?: number;
    adminUserId: string;
  }): Promise<ServiceResult<void>> {
    try {
      const db = getDb();
      const { id, adminUserId, ...updates } = input;
      await db.update(paymentMethods).set(updates).where(eq(paymentMethods.id, id));

      await auditService.log({
        action: "update",
        entityType: "payment_method",
        entityId: id,
        actor: { adminUserId },
        metadata: updates,
      });

      return ok(undefined);
    } catch (error) {
      return fail("PAYMENT_METHOD_UPDATE_ERROR", "Failed to update payment method", error);
    }
  }

  private toAdminView(r: typeof paymentMethods.$inferSelect): PaymentMethodAdminView {
    return {
      id: r.id,
      slug: r.slug,
      name: r.name,
      methodType: r.methodType,
      description: r.description,
      instructions: r.instructions,
      requiresProof: r.requiresProof,
      minAmount: r.minAmount,
      maxAmount: r.maxAmount,
      config: (r.config as Record<string, unknown>) ?? {},
      isActive: r.isActive,
      sortOrder: r.sortOrder,
      updatedAt: r.updatedAt,
    };
  }
}

export const paymentMethodService = new PaymentMethodService();
