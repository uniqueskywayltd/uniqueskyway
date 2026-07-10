import { and, asc, desc, eq, isNull, ne, sql } from "drizzle-orm";
import { randomUUID } from "crypto";
import { getDb } from "@/db";
import { platformWallets } from "@/db/schema";
import { auditService } from "./audit.service";
import { guardDatabase } from "./infrastructure-guard";
import { fail, ok } from "./base";
import type { ServiceResult } from "./types";

export type PlatformWalletStatus = "active" | "inactive" | "archived";

export type PlatformWalletView = {
  id: string;
  assetSymbol: string;
  assetName: string;
  network: string;
  walletAddress: string;
  qrCodePath: string | null;
  instructions: string | null;
  displayOrder: number;
  isPrimary: boolean;
  isActive: boolean;
  status: PlatformWalletStatus;
  autoDetectionEnabled: boolean;
  requiredConfirmations: number;
  icon: string | null;
  color: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type PlatformWalletAdminView = PlatformWalletView & {
  createdByAdminId: string | null;
  updatedByAdminId: string | null;
};

export type PlatformWalletInput = {
  assetSymbol: string;
  assetName: string;
  network: string;
  walletAddress: string;
  qrCodePath?: string | null;
  instructions?: string | null;
  displayOrder?: number;
  isPrimary?: boolean;
  isActive?: boolean;
  status?: PlatformWalletStatus;
  icon?: string | null;
  color?: string | null;
};

const QR_MAX_BYTES = 5 * 1024 * 1024;
const QR_ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

function notDeleted() {
  return isNull(platformWallets.deletedAt);
}

function syncActiveFields(status: PlatformWalletStatus, isActive?: boolean) {
  if (isActive !== undefined) {
    return {
      isActive,
      status: isActive ? ("active" as const) : ("inactive" as const),
    };
  }
  if (status === "active") return { isActive: true, status: "active" as const };
  if (status === "archived") return { isActive: false, status: "archived" as const };
  return { isActive: false, status: "inactive" as const };
}

function toView(row: typeof platformWallets.$inferSelect): PlatformWalletView {
  return {
    id: row.id,
    assetSymbol: row.assetSymbol,
    assetName: row.assetName,
    network: row.network,
    walletAddress: row.walletAddress,
    qrCodePath: row.qrCodePath,
    instructions: row.instructions,
    displayOrder: row.displayOrder,
    isPrimary: row.isPrimary,
    isActive: row.isActive,
    status: row.status as PlatformWalletStatus,
    autoDetectionEnabled: row.autoDetectionEnabled,
    requiredConfirmations: row.requiredConfirmations,
    icon: row.icon,
    color: row.color,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

function toAdminView(row: typeof platformWallets.$inferSelect): PlatformWalletAdminView {
  return {
    ...toView(row),
    createdByAdminId: row.createdByAdminId,
    updatedByAdminId: row.updatedByAdminId,
  };
}

function validateInput(input: PlatformWalletInput): ServiceResult<true> {
  if (!input.assetSymbol.trim()) {
    return fail("VALIDATION_ERROR", "Asset symbol is required");
  }
  if (!input.assetName.trim()) {
    return fail("VALIDATION_ERROR", "Asset name is required");
  }
  if (!input.network.trim()) {
    return fail("VALIDATION_ERROR", "Network is required");
  }
  if (!input.walletAddress.trim()) {
    return fail("VALIDATION_ERROR", "Wallet address is required");
  }
  return ok(true);
}

export class PlatformWalletService {
  async listActiveForCustomers(): Promise<ServiceResult<PlatformWalletView[]>> {
    const infra = guardDatabase<PlatformWalletView[]>();
    if (infra) return infra;

    try {
      const db = getDb();
      const rows = await db
        .select()
        .from(platformWallets)
        .where(
          and(
            notDeleted(),
            eq(platformWallets.status, "active"),
            eq(platformWallets.isActive, true),
          ),
        )
        .orderBy(asc(platformWallets.displayOrder), asc(platformWallets.assetName));

      return ok(rows.map(toView));
    } catch (error) {
      return fail("PLATFORM_WALLETS_ERROR", "Failed to load platform wallets", error);
    }
  }

  async listAllAdmin(): Promise<ServiceResult<PlatformWalletAdminView[]>> {
    const infra = guardDatabase<PlatformWalletAdminView[]>();
    if (infra) return infra;

    try {
      const db = getDb();
      const rows = await db
        .select()
        .from(platformWallets)
        .where(notDeleted())
        .orderBy(asc(platformWallets.displayOrder), desc(platformWallets.createdAt));

      return ok(rows.map(toAdminView));
    } catch (error) {
      return fail("PLATFORM_WALLETS_ERROR", "Failed to load platform wallets", error);
    }
  }

  async getById(id: string): Promise<ServiceResult<PlatformWalletView>> {
    const infra = guardDatabase<PlatformWalletView>();
    if (infra) return infra;

    try {
      const db = getDb();
      const [row] = await db
        .select()
        .from(platformWallets)
        .where(and(eq(platformWallets.id, id), notDeleted()))
        .limit(1);

      if (!row) return fail("WALLET_NOT_FOUND", "Platform wallet not found");
      return ok(toView(row));
    } catch (error) {
      return fail("PLATFORM_WALLET_ERROR", "Failed to load platform wallet", error);
    }
  }

  async getActiveById(id: string): Promise<ServiceResult<PlatformWalletView>> {
    const result = await this.getById(id);
    if (!result.success) return result;
    if (result.data.status !== "active" || !result.data.isActive) {
      return fail("WALLET_INACTIVE", "Platform wallet is not available for deposits");
    }
    return result;
  }

  async createAdmin(
    input: PlatformWalletInput,
    adminUserId: string,
  ): Promise<ServiceResult<{ id: string }>> {
    const validation = validateInput(input);
    if (!validation.success) return validation;

    try {
      const db = getDb();
      const activeFields = syncActiveFields(input.status ?? "active", input.isActive);

      const [maxOrder] = await db
        .select({ max: sql<number>`coalesce(max(${platformWallets.displayOrder}), -1)` })
        .from(platformWallets)
        .where(notDeleted());

      const displayOrder = input.displayOrder ?? (maxOrder?.max ?? -1) + 1;

      const [row] = await db
        .insert(platformWallets)
        .values({
          assetSymbol: input.assetSymbol.trim(),
          assetName: input.assetName.trim(),
          network: input.network.trim(),
          walletAddress: input.walletAddress.trim(),
          qrCodePath: input.qrCodePath ?? null,
          instructions: input.instructions?.trim() || null,
          displayOrder,
          isPrimary: input.isPrimary ?? false,
          ...activeFields,
          icon: input.icon?.trim() || null,
          color: input.color?.trim() || null,
          createdByAdminId: adminUserId,
          updatedByAdminId: adminUserId,
        })
        .returning({ id: platformWallets.id });

      if (input.isPrimary) {
        await this.clearOtherPrimaries(row.id, input.assetSymbol, input.network);
        await db
          .update(platformWallets)
          .set({ isPrimary: true, updatedByAdminId: adminUserId, updatedAt: new Date() })
          .where(eq(platformWallets.id, row.id));
      }

      await auditService.log({
        action: "create",
        entityType: "platform_wallet",
        entityId: row.id,
        actor: { adminUserId },
        metadata: {
          assetSymbol: input.assetSymbol,
          network: input.network,
        },
      });

      return ok({ id: row.id });
    } catch (error) {
      return fail("PLATFORM_WALLET_CREATE_ERROR", "Failed to create platform wallet", error);
    }
  }

  async updateAdmin(
    id: string,
    input: Partial<PlatformWalletInput>,
    adminUserId: string,
  ): Promise<ServiceResult<true>> {
    try {
      const existing = await this.getById(id);
      if (!existing.success) return existing;

      const merged: PlatformWalletInput = {
        assetSymbol: input.assetSymbol ?? existing.data.assetSymbol,
        assetName: input.assetName ?? existing.data.assetName,
        network: input.network ?? existing.data.network,
        walletAddress: input.walletAddress ?? existing.data.walletAddress,
        qrCodePath: input.qrCodePath !== undefined ? input.qrCodePath : existing.data.qrCodePath,
        instructions: input.instructions !== undefined ? input.instructions : existing.data.instructions,
        displayOrder: input.displayOrder ?? existing.data.displayOrder,
        isPrimary: input.isPrimary ?? existing.data.isPrimary,
        isActive: input.isActive ?? existing.data.isActive,
        status: input.status ?? existing.data.status,
        icon: input.icon !== undefined ? input.icon : existing.data.icon,
        color: input.color !== undefined ? input.color : existing.data.color,
      };

      const validation = validateInput(merged);
      if (!validation.success) return validation;

      const db = getDb();
      const activeFields = syncActiveFields(merged.status ?? "active", input.isActive);

      await db
        .update(platformWallets)
        .set({
          assetSymbol: merged.assetSymbol.trim(),
          assetName: merged.assetName.trim(),
          network: merged.network.trim(),
          walletAddress: merged.walletAddress.trim(),
          qrCodePath: merged.qrCodePath ?? null,
          instructions: merged.instructions?.trim() || null,
          displayOrder: merged.displayOrder,
          isPrimary: merged.isPrimary ?? false,
          ...activeFields,
          icon: merged.icon?.trim() || null,
          color: merged.color?.trim() || null,
          updatedByAdminId: adminUserId,
          updatedAt: new Date(),
        })
        .where(eq(platformWallets.id, id));

      if (merged.isPrimary) {
        await this.clearOtherPrimaries(id, merged.assetSymbol, merged.network);
        await db
          .update(platformWallets)
          .set({ isPrimary: true })
          .where(eq(platformWallets.id, id));
      }

      await auditService.log({
        action: "update",
        entityType: "platform_wallet",
        entityId: id,
        actor: { adminUserId },
      });

      return ok(true);
    } catch (error) {
      return fail("PLATFORM_WALLET_UPDATE_ERROR", "Failed to update platform wallet", error);
    }
  }

  async setStatus(
    id: string,
    status: PlatformWalletStatus,
    adminUserId: string,
  ): Promise<ServiceResult<true>> {
    const activeFields = syncActiveFields(status);
    return this.updateAdmin(id, activeFields, adminUserId);
  }

  async softDelete(id: string, adminUserId: string): Promise<ServiceResult<true>> {
    try {
      const db = getDb();
      const [row] = await db
        .update(platformWallets)
        .set({
          deletedAt: new Date(),
          isActive: false,
          status: "archived",
          isPrimary: false,
          updatedByAdminId: adminUserId,
          updatedAt: new Date(),
        })
        .where(and(eq(platformWallets.id, id), notDeleted()))
        .returning({ id: platformWallets.id });

      if (!row) return fail("WALLET_NOT_FOUND", "Platform wallet not found");

      await auditService.log({
        action: "delete",
        entityType: "platform_wallet",
        entityId: id,
        actor: { adminUserId },
      });

      return ok(true);
    } catch (error) {
      return fail("PLATFORM_WALLET_DELETE_ERROR", "Failed to delete platform wallet", error);
    }
  }

  async duplicate(id: string, adminUserId: string): Promise<ServiceResult<{ id: string }>> {
    const existing = await this.getById(id);
    if (!existing.success) return existing;

    return this.createAdmin(
      {
        assetSymbol: existing.data.assetSymbol,
        assetName: `${existing.data.assetName} (copy)`,
        network: existing.data.network,
        walletAddress: existing.data.walletAddress,
        instructions: existing.data.instructions ?? undefined,
        isPrimary: false,
        isActive: false,
        status: "inactive",
        icon: existing.data.icon,
        color: existing.data.color,
      },
      adminUserId,
    );
  }

  async markPrimary(id: string, adminUserId: string): Promise<ServiceResult<true>> {
    const existing = await this.getById(id);
    if (!existing.success) return existing;

    await this.clearOtherPrimaries(id, existing.data.assetSymbol, existing.data.network);

    const db = getDb();
    await db
      .update(platformWallets)
      .set({
        isPrimary: true,
        updatedByAdminId: adminUserId,
        updatedAt: new Date(),
      })
      .where(eq(platformWallets.id, id));

    await auditService.log({
      action: "update",
      entityType: "platform_wallet",
      entityId: id,
      actor: { adminUserId },
      metadata: { action: "mark_primary" },
    });

    return ok(true);
  }

  async moveOrder(id: string, direction: "up" | "down", adminUserId: string): Promise<ServiceResult<true>> {
    const db = getDb();
    const rows = await db
      .select()
      .from(platformWallets)
      .where(notDeleted())
      .orderBy(asc(platformWallets.displayOrder), asc(platformWallets.createdAt));

    const index = rows.findIndex((r) => r.id === id);
    if (index === -1) return fail("WALLET_NOT_FOUND", "Platform wallet not found");

    const swapIndex = direction === "up" ? index - 1 : index + 1;
    if (swapIndex < 0 || swapIndex >= rows.length) return ok(true);

    const current = rows[index]!;
    const neighbor = rows[swapIndex]!;

    await db.transaction(async (tx) => {
      await tx
        .update(platformWallets)
        .set({ displayOrder: neighbor.displayOrder, updatedByAdminId: adminUserId })
        .where(eq(platformWallets.id, current.id));
      await tx
        .update(platformWallets)
        .set({ displayOrder: current.displayOrder, updatedByAdminId: adminUserId })
        .where(eq(platformWallets.id, neighbor.id));
    });

    return ok(true);
  }

  async updateQrPath(
    id: string,
    qrCodePath: string | null,
    adminUserId: string,
  ): Promise<ServiceResult<true>> {
    return this.updateAdmin(id, { qrCodePath }, adminUserId);
  }

  validateQrFile(file: { type: string; size: number }): ServiceResult<true> {
    if (!QR_ALLOWED_TYPES.has(file.type)) {
      return fail("INVALID_FILE_TYPE", "QR code must be PNG, JPG, or WEBP");
    }
    if (file.size > QR_MAX_BYTES) {
      return fail("FILE_TOO_LARGE", "QR code must be 5MB or smaller");
    }
    return ok(true);
  }

  buildSecureFilename(originalName: string): string {
    const ext = originalName.split(".").pop()?.toLowerCase() ?? "png";
    const safeExt = ["jpg", "jpeg", "png", "webp"].includes(ext) ? ext : "png";
    return `${Date.now()}-${randomUUID().slice(0, 8)}.${safeExt}`;
  }

  private async clearOtherPrimaries(
    walletId: string,
    assetSymbol: string,
    network: string,
  ): Promise<void> {
    const db = getDb();
    await db
      .update(platformWallets)
      .set({ isPrimary: false })
      .where(
        and(
          notDeleted(),
          eq(platformWallets.assetSymbol, assetSymbol.trim()),
          eq(platformWallets.network, network.trim()),
          ne(platformWallets.id, walletId),
        ),
      );
  }
}

export const platformWalletService = new PlatformWalletService();
