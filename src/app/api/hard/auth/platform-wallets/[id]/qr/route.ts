import { NextResponse, type NextRequest } from "next/server";
import { requireAdmin } from "@/lib/auth/api-guard";
import { isStorageConfigured } from "@/lib/env";
import { PERMISSIONS } from "@/lib/permissions/constants";
import { createAdminClient } from "@/lib/supabase/admin";
import { platformWalletService } from "@/lib/services/platform-wallet.service";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, context: RouteContext) {
  const auth = await requireAdmin(PERMISSIONS.PLATFORM_WALLETS_MANAGE);
  if (!auth.ok) return auth.response;

  if (!isStorageConfigured()) {
    return NextResponse.json({ error: "Storage not configured" }, { status: 503 });
  }

  const { id } = await context.params;
  const wallet = await platformWalletService.getById(id);
  if (!wallet.success) {
    return NextResponse.json({ error: wallet.error.message }, { status: 404 });
  }

  const formData = await request.formData();
  const file = formData.get("qr") as File | null;
  if (!file) {
    return NextResponse.json({ error: "QR file is required" }, { status: 400 });
  }

  const validation = platformWalletService.validateQrFile({ type: file.type, size: file.size });
  if (!validation.success) {
    return NextResponse.json({ error: validation.error.message }, { status: 400 });
  }

  const filename = platformWalletService.buildSecureFilename(file.name);
  const path = `${id}/${filename}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  const supabase = createAdminClient();
  const { error } = await supabase.storage.from("wallet-qr").upload(path, buffer, {
    contentType: file.type,
    upsert: true,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const update = await platformWalletService.updateQrPath(id, path, auth.ctx.adminId);
  if (!update.success) {
    return NextResponse.json({ error: update.error.message }, { status: 500 });
  }

  return NextResponse.json({ path });
}
