import { Resend } from "resend";
import { getAppConfig } from "@/lib/config";

export type EmailDiagnostics = {
  provider: "resend";
  sdkVersion: string;
  configured: boolean;
  apiKeyPresent: boolean;
  apiKeyPrefix: string | null;
  senderConfigured: boolean;
  senderAddress: string;
  reachable: boolean;
  verifiedDomains: number;
  lastError: string | null;
  latencyMs: number | null;
};

const RESEND_SDK_VERSION = "6.17.1";
const VERIFY_TIMEOUT_MS = 5000;

let resendClient: Resend | null = null;
let diagnosticsCache: { at: number; value: EmailDiagnostics } | null = null;
const DIAGNOSTICS_TTL_MS = 60_000;

function getClient(): Resend | null {
  const { server } = getAppConfig();
  if (!server.RESEND_API_KEY) return null;
  if (!resendClient) {
    resendClient = new Resend(server.RESEND_API_KEY);
  }
  return resendClient;
}

export function resetEmailClient(): void {
  resendClient = null;
  diagnosticsCache = null;
}

async function verifyResendApi(timeoutMs: number): Promise<{
  reachable: boolean;
  verifiedDomains: number;
  error: string | null;
  latencyMs: number;
}> {
  const { server } = getAppConfig();
  const apiKey = server.RESEND_API_KEY;
  if (!apiKey) {
    return { reachable: false, verifiedDomains: 0, error: "RESEND_API_KEY not set", latencyMs: 0 };
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  const started = Date.now();

  try {
    const res = await fetch("https://api.resend.com/domains", {
      method: "GET",
      headers: { Authorization: `Bearer ${apiKey}` },
      signal: controller.signal,
    });
    const latencyMs = Date.now() - started;

    if (!res.ok) {
      const body = await res.text().catch(() => "");
      return {
        reachable: false,
        verifiedDomains: 0,
        error: `Resend API ${res.status}${body ? `: ${body.slice(0, 120)}` : ""}`,
        latencyMs,
      };
    }

    const data = (await res.json()) as { data?: Array<{ status?: string }> };
    const verifiedDomains =
      data.data?.filter((d) => d.status === "verified").length ?? data.data?.length ?? 0;

    return { reachable: true, verifiedDomains, error: null, latencyMs };
  } catch (err) {
    return {
      reachable: false,
      verifiedDomains: 0,
      error: err instanceof Error ? err.message : "Resend verification failed",
      latencyMs: Date.now() - started,
    };
  } finally {
    clearTimeout(timer);
  }
}

export async function getEmailDiagnostics(force = false): Promise<EmailDiagnostics> {
  const now = Date.now();
  if (!force && diagnosticsCache && now - diagnosticsCache.at < DIAGNOSTICS_TTL_MS) {
    return diagnosticsCache.value;
  }

  const config = getAppConfig();
  const apiKeyPresent = config.email.hasApiKey;

  if (!apiKeyPresent) {
    const value: EmailDiagnostics = {
      provider: "resend",
      sdkVersion: RESEND_SDK_VERSION,
      configured: false,
      apiKeyPresent: false,
      apiKeyPrefix: null,
      senderConfigured: Boolean(config.server.EMAIL_FROM),
      senderAddress: config.email.from,
      reachable: false,
      verifiedDomains: 0,
      lastError: "RESEND_API_KEY not present in runtime environment",
      latencyMs: null,
    };
    diagnosticsCache = { at: now, value };
    return value;
  }

  const verification = await verifyResendApi(VERIFY_TIMEOUT_MS);
  const value: EmailDiagnostics = {
    provider: "resend",
    sdkVersion: RESEND_SDK_VERSION,
    configured: verification.reachable,
    apiKeyPresent: true,
    apiKeyPrefix: config.email.apiKeyPrefix,
    senderConfigured: Boolean(config.email.from),
    senderAddress: config.email.from,
    reachable: verification.reachable,
    verifiedDomains: verification.verifiedDomains,
    lastError: verification.error,
    latencyMs: verification.latencyMs,
  };

  diagnosticsCache = { at: now, value };
  return value;
}

export function getResendClient(): Resend | null {
  return getClient();
}

async function sleep(ms: number): Promise<void> {
  await new Promise((r) => setTimeout(r, ms));
}

export async function withRetry<T>(
  fn: () => Promise<T>,
  options: { maxAttempts?: number; baseDelayMs?: number } = {},
): Promise<T> {
  const maxAttempts = options.maxAttempts ?? 3;
  const baseDelayMs = options.baseDelayMs ?? 500;
  let lastError: unknown;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      if (attempt === maxAttempts) break;
      await sleep(baseDelayMs * 2 ** (attempt - 1));
    }
  }

  throw lastError;
}
