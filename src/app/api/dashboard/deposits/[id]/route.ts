import { NextResponse, type NextRequest } from "next/server";
import { requireCustomer } from "@/lib/auth/api-guard";
import { depositService } from "@/lib/services/deposit.service";
import { isStorageConfigured } from "@/lib/env";
import { createAdminClient } from "@/lib/supabase/admin";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
const MAX_SIZE = 10 * 1024 * 1024;

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireCustomer();
  if (!auth.ok) return auth.response;

  const { id } = await params;
  const result = await depositService.getByIdForProfile(auth.ctx.profile.id, id);

  if (!result.success) {
    return NextResponse.json({ error: result.error.message }, { status: 404 });
  }

  return NextResponse.json(result.data);
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireCustomer();
  if (!auth.ok) return auth.response;

  if (!isStorageConfigured()) {
    return NextResponse.json(
      { error: "Storage not configured", code: "INFRASTRUCTURE_NOT_CONFIGURED" },
      { status: 503 },
    );
  }

  const { id } = await params;
  const formData = await request.formData();
  const file = formData.get("proof") as File | null;

  if (!file) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json({ error: "Invalid file type" }, { status: 400 });
  }

  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: "File too large (max 10MB)" }, { status: 400 });
  }

  const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
  const safeName = `proof-${Date.now()}.${ext}`;
  const path = `${auth.ctx.authUserId}/deposits/${id}/${safeName}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  const supabase = createAdminClient();
  const { error } = await supabase.storage.from("payment-proofs").upload(path, buffer, {
    upsert: true,
    contentType: file.type,
  });

  if (error) {
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }

  const attach = await depositService.attachProof(auth.ctx.profile.id, id, path);
  if (!attach.success) {
    return NextResponse.json({ error: attach.error.message }, { status: 400 });
  }

  return NextResponse.json({ path });
}
