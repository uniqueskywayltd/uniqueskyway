import { brand } from "@/emails/components/layout";
import { parseClientEnv, parseServerEnv, type ClientEnv, type ServerEnv } from "./env";

export type AppConfig = {
  client: ClientEnv;
  server: ServerEnv;
  email: {
    from: string;
    hasApiKey: boolean;
    apiKeyPrefix: string | null;
  };
  isProduction: boolean;
  isDevelopment: boolean;
};

let cached: AppConfig | null = null;

function maskKey(key: string | undefined): string | null {
  if (!key) return null;
  if (key.length <= 8) return "****";
  return `${key.slice(0, 6)}…`;
}

export function getAppConfig(source: NodeJS.ProcessEnv = process.env): AppConfig {
  if (cached && source === process.env) return cached;

  const client = parseClientEnv(source);
  const server = parseServerEnv(source);
  const apiKey = server.RESEND_API_KEY;

  const config: AppConfig = {
    client,
    server,
    email: {
      from: server.EMAIL_FROM ?? `Unique Sky Way <${brand.email}>`,
      hasApiKey: Boolean(apiKey),
      apiKeyPrefix: maskKey(apiKey),
    },
    isProduction: server.NODE_ENV === "production",
    isDevelopment: server.NODE_ENV === "development",
  };

  if (source === process.env) cached = config;
  return config;
}
