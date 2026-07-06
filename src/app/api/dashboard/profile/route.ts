import { NextResponse, type NextRequest } from "next/server";
import { requireCustomer } from "@/lib/auth/api-guard";
import { profileService } from "@/lib/services/profile.service";
import { auditService } from "@/lib/services/audit.service";
import { createAdminClient } from "@/lib/supabase/admin";
import { isStorageConfigured } from "@/lib/env";

export async function GET() {
  const auth = await requireCustomer();
  if (!auth.ok) return auth.response;

  const data = await profileService.getFullProfile(auth.ctx.profile.id);
  if (!data) {
    return NextResponse.json({ error: "Profile not found" }, { status: 404 });
  }

  return NextResponse.json(data);
}

export async function PATCH(request: NextRequest) {
  const auth = await requireCustomer();
  if (!auth.ok) return auth.response;

  const body = await request.json();

  if (body.profile) {
    await profileService.updateProfile(auth.ctx.profile.id, body.profile);
  }
  if (body.preferences) {
    await profileService.updatePreferences(auth.ctx.profile.id, body.preferences);
  }
  if (body.notificationPreferences) {
    await profileService.updateNotificationPreferences(
      auth.ctx.profile.id,
      body.notificationPreferences,
    );
  }

  await auditService.log({
    action: "update",
    entityType: "profile",
    entityId: auth.ctx.profile.id,
    actor: { profileId: auth.ctx.profile.id },
    metadata: { fields: Object.keys(body) },
  });

  return NextResponse.json({ success: true });
}

export async function POST(request: NextRequest) {
  const auth = await requireCustomer();
  if (!auth.ok) return auth.response;

  if (!isStorageConfigured()) {
    return NextResponse.json(
      {
        error: "Storage is not configured. Set SUPABASE_SERVICE_ROLE_KEY to enable avatar uploads.",
        code: "INFRASTRUCTURE_NOT_CONFIGURED",
      },
      { status: 503 },
    );
  }

  const formData = await request.formData();
  const file = formData.get("avatar") as File | null;

  if (!file) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  const allowed = ["image/jpeg", "image/png", "image/webp", "image/gif"];
  if (!allowed.includes(file.type)) {
    return NextResponse.json({ error: "Invalid file type" }, { status: 400 });
  }

  if (file.size > 5 * 1024 * 1024) {
    return NextResponse.json({ error: "File too large (max 5MB)" }, { status: 400 });
  }

  const ext = file.name.split(".").pop() ?? "jpg";
  const path = `${auth.ctx.authUserId}/avatar.${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  const supabase = createAdminClient();
  const { error } = await supabase.storage.from("avatars").upload(path, buffer, {
    upsert: true,
    contentType: file.type,
  });

  if (error) {
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }

  await profileService.updateAvatarPath(auth.ctx.profile.id, path);

  return NextResponse.json({ path });
}
