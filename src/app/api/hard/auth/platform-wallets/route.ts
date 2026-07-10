import { NextResponse, type NextRequest } from "next/server";
import { requireAdmin } from "@/lib/auth/api-guard";
import { PERMISSIONS } from "@/lib/permissions/constants";
import { platformWalletService } from "@/lib/services/platform-wallet.service";
import type { PlatformWalletStatus } from "@/lib/services/platform-wallet.service";

export async function GET() {
  const auth = await requireAdmin(PERMISSIONS.PLATFORM_WALLETS_READ);
  if (!auth.ok) return auth.response;

  const result = await platformWalletService.listAllAdmin();
  if (!result.success) {
    return NextResponse.json({ error: result.error.message }, { status: 503 });
  }

  return NextResponse.json(result.data);
}

export async function POST(request: NextRequest) {
  const auth = await requireAdmin(PERMISSIONS.PLATFORM_WALLETS_MANAGE);
  if (!auth.ok) return auth.response;

  const body = await request.json();

  if (body.action && body.id) {
    const id = body.id as string;
    switch (body.action) {
      case "duplicate": {
        const result = await platformWalletService.duplicate(id, auth.ctx.adminId);
        if (!result.success) {
          return NextResponse.json({ error: result.error.message }, { status: 400 });
        }
        return NextResponse.json(result.data);
      }
      case "move_up":
      case "move_down": {
        const result = await platformWalletService.moveOrder(
          id,
          body.action === "move_up" ? "up" : "down",
          auth.ctx.adminId,
        );
        if (!result.success) {
          return NextResponse.json({ error: result.error.message }, { status: 400 });
        }
        return NextResponse.json({ success: true });
      }
      case "mark_primary": {
        const result = await platformWalletService.markPrimary(id, auth.ctx.adminId);
        if (!result.success) {
          return NextResponse.json({ error: result.error.message }, { status: 400 });
        }
        return NextResponse.json({ success: true });
      }
      case "enable": {
        const result = await platformWalletService.setStatus(id, "active", auth.ctx.adminId);
        if (!result.success) {
          return NextResponse.json({ error: result.error.message }, { status: 400 });
        }
        return NextResponse.json({ success: true });
      }
      case "disable": {
        const result = await platformWalletService.setStatus(id, "inactive", auth.ctx.adminId);
        if (!result.success) {
          return NextResponse.json({ error: result.error.message }, { status: 400 });
        }
        return NextResponse.json({ success: true });
      }
      case "archive": {
        const result = await platformWalletService.setStatus(id, "archived", auth.ctx.adminId);
        if (!result.success) {
          return NextResponse.json({ error: result.error.message }, { status: 400 });
        }
        return NextResponse.json({ success: true });
      }
      default:
        return NextResponse.json({ error: "Unknown action" }, { status: 400 });
    }
  }

  if (body.id) {
    const result = await platformWalletService.updateAdmin(
      body.id,
      {
        assetSymbol: body.assetSymbol,
        assetName: body.assetName,
        network: body.network,
        walletAddress: body.walletAddress,
        instructions: body.instructions,
        displayOrder: body.displayOrder,
        isPrimary: body.isPrimary,
        isActive: body.isActive,
        status: body.status as PlatformWalletStatus | undefined,
        icon: body.icon,
        color: body.color,
      },
      auth.ctx.adminId,
    );
    if (!result.success) {
      return NextResponse.json({ error: result.error.message }, { status: 400 });
    }
    return NextResponse.json({ success: true });
  }

  const result = await platformWalletService.createAdmin(
    {
      assetSymbol: body.assetSymbol,
      assetName: body.assetName,
      network: body.network,
      walletAddress: body.walletAddress,
      instructions: body.instructions,
      displayOrder: body.displayOrder,
      isPrimary: body.isPrimary,
      isActive: body.isActive,
      status: body.status,
      icon: body.icon,
      color: body.color,
    },
    auth.ctx.adminId,
  );

  if (!result.success) {
    return NextResponse.json({ error: result.error.message }, { status: 400 });
  }

  return NextResponse.json(result.data, { status: 201 });
}
