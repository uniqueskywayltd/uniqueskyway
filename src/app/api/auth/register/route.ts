import { type NextRequest } from "next/server";
import {
  getActorFromRequest,
  jsonError,
  jsonSuccess,
  rateLimitedResponse,
} from "@/lib/api/auth-route";
import { registerSchema } from "@/lib/auth/validation";
import { authService } from "@/lib/services/auth.service";
import { isDatabaseConfigured, isSupabaseConfigured } from "@/lib/env";

const AVATAR_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"] as const;
const MAX_AVATAR_BYTES = 5 * 1024 * 1024;

function parseRegisterBody(formData: FormData) {
  return {
    fullName: String(formData.get("name") ?? ""),
    username: String(formData.get("username") ?? ""),
    email: String(formData.get("email") ?? ""),
    password: String(formData.get("password") ?? ""),
    confirmPassword: String(formData.get("confirmPassword") ?? ""),
    referralCode: (() => {
      const ref = formData.get("referral");
      const value = ref ? String(ref).trim() : "";
      return value || undefined;
    })(),
    termsAccepted: formData.get("terms") === "on",
    mathA: Number(formData.get("mathA")),
    mathB: Number(formData.get("mathB")),
    mathAnswer: Number(formData.get("mathAnswer")),
  };
}

async function parseAvatarFile(formData: FormData) {
  const file = formData.get("avatar");
  if (!file || !(file instanceof File) || file.size === 0) return undefined;

  if (!AVATAR_TYPES.includes(file.type as (typeof AVATAR_TYPES)[number])) {
    return { error: "Invalid profile photo type" } as const;
  }
  if (file.size > MAX_AVATAR_BYTES) {
    return { error: "Profile photo is too large (max 5MB)" } as const;
  }

  const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
  const buffer = Buffer.from(await file.arrayBuffer());
  return { buffer, contentType: file.type, ext };
}

export async function POST(request: NextRequest) {
  const limited = rateLimitedResponse(request, "auth", "register");
  if (limited) return limited;

  if (!isSupabaseConfigured() || !isDatabaseConfigured()) {
    return jsonError("Service temporarily unavailable", 503);
  }

  const contentType = request.headers.get("content-type") ?? "";
  let body: unknown;
  let avatar:
    | { buffer: Buffer; contentType: string; ext: string }
    | { error: string }
    | undefined;

  if (contentType.includes("multipart/form-data")) {
    const formData = await request.formData();
    body = parseRegisterBody(formData);
    avatar = await parseAvatarFile(formData);
  } else {
    try {
      body = await request.json();
    } catch {
      return jsonError("Invalid request body");
    }
  }

  if (avatar && "error" in avatar) {
    return jsonError(avatar.error, 400);
  }

  const parsed = registerSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError(parsed.error.issues[0]?.message ?? "Invalid input");
  }

  const result = await authService.register(
    parsed.data,
    getActorFromRequest(request),
    avatar && !("error" in avatar) ? avatar : undefined,
  );

  if (!result.success) {
    return jsonError(result.error.message, 400);
  }

  return jsonSuccess({ redirectTo: "/check-email" });
}
