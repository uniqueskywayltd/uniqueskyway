import { NextResponse } from "next/server";
import { requireCustomer } from "@/lib/auth/api-guard";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const auth = await requireCustomer();
  if (!auth.ok) return auth.response;

  const { path } = await params;
  const objectPath = path.join("/");

  if (!objectPath.startsWith(`${auth.ctx.authUserId}/`)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase.storage
    .from("avatars")
    .createSignedUrl(objectPath, 3600);

  if (error || !data?.signedUrl) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.redirect(data.signedUrl);
}
