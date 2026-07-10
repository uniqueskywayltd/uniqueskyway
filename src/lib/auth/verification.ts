import { AUTH_ROUTES } from "@/lib/auth/constants";
import { resolveAppUrl } from "@/lib/env";

export type VerificationFlow = "signup" | "verify" | "recovery";

export type VerificationPayload = {
  verifyUrl: string;
  otp: string | null;
};

type GenerateLinkProperties = {
  action_link?: string;
  hashed_token?: string;
  email_otp?: string;
  verification_type?: string;
};

/** Build a branded on-domain verification URL (never expose raw Supabase host in emails). */
export function buildAppVerificationUrl(params: {
  tokenHash: string;
  flow: VerificationFlow;
  email: string;
}): string {
  const url = new URL(`${resolveAppUrl()}${AUTH_ROUTES.verify}`);
  url.searchParams.set("token", params.tokenHash);
  url.searchParams.set("type", params.flow);
  url.searchParams.set("email", params.email);
  return url.toString();
}

export function buildVerificationFromGenerateLink(
  properties: GenerateLinkProperties,
  flow: VerificationFlow,
  email: string,
): VerificationPayload {
  const tokenHash =
    properties.hashed_token ??
    extractTokenFromActionLink(properties.action_link);

  if (!tokenHash) {
    throw new Error("Verification token missing from auth link");
  }

  return {
    verifyUrl: buildAppVerificationUrl({ tokenHash, flow, email }),
    otp: properties.email_otp ?? null,
  };
}

function extractTokenFromActionLink(actionLink?: string): string | null {
  if (!actionLink) return null;
  try {
    return new URL(actionLink).searchParams.get("token");
  } catch {
    return null;
  }
}

export function mapVerifyOtpType(
  flow: VerificationFlow,
): "signup" | "email" | "recovery" {
  if (flow === "recovery") return "recovery";
  if (flow === "signup") return "signup";
  return "email";
}
