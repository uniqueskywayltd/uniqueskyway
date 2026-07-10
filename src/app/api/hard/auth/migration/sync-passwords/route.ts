import { NextResponse, type NextRequest } from "next/server";
import { requireSuperAdmin } from "@/lib/auth/api-guard";
import { legacyPasswordSyncService } from "@/lib/services/legacy-password-sync.service";

export async function POST(request: NextRequest) {
  const auth = await requireSuperAdmin();
  if (!auth.ok) return auth.response;

  let sourcePath: string | undefined;
  try {
    const body = await request.json().catch(() => ({}));
    if (typeof body.sourcePath === "string" && body.sourcePath.trim()) {
      sourcePath = body.sourcePath.trim();
    }
  } catch {
    // optional body
  }

  const result = await legacyPasswordSyncService.syncFromLegacySql(sourcePath);
  if (!result.success) {
    return NextResponse.json({ error: result.error.message, code: result.error.code }, { status: 400 });
  }

  return NextResponse.json(result.data);
}
