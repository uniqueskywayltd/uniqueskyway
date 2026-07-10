import { NextResponse } from "next/server";
import { requireCustomer } from "@/lib/auth/api-guard";
import { isStorageConfigured } from "@/lib/env";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const auth = await requireCustomer();
  if (!auth.ok) return auth.response;

  if (!isStorageConfigured()) {
    return NextResponse.json({ error: "Storage not configured" }, { status: 503 });
  }

  const { path } = await params;
  const objectPath = path.join("/");

  const supabase = createAdminClient();
  const { data } = supabase.storage.from("wallet-qr").getPublicUrl(objectPath);

  if (!data?.publicUrl) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.redirect(data.publicUrl);
}
