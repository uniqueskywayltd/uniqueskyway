/**
 * Sync Supabase + database credentials to the uniqueskyway Vercel project.
 * Usage: npx tsx scripts/sync-vercel-env.ts
 */
import { execSync } from "node:child_process";
import { randomBytes } from "node:crypto";

const PROJECT_REF = "cdgvfhqyctnbvnykodek";
const APP_URL = "https://uniqueskyway.com";

function run(cmd: string, input?: string, env?: NodeJS.ProcessEnv) {
  return execSync(cmd, {
    cwd: process.cwd(),
    input,
    env: env ?? process.env,
    stdio: ["pipe", "pipe", "inherit"],
    encoding: "utf8",
  }).trim();
}

function setVercelEnv(name: string, value: string, target: "production" | "preview") {
  try {
    run(`vercel env rm ${name} ${target} --yes`);
  } catch {
    /* missing */
  }
  run(`vercel env add ${name} ${target} --yes --value ${JSON.stringify(value)}`);
  console.log(`  ✓ ${name} (${target})`);
}

async function getPat(): Promise<string | null> {
  const token = process.env.SUPABASE_ACCESS_TOKEN?.trim();
  if (token?.startsWith("sbp_")) return token;

  try {
    const fromCli = run("node scripts/extract-supabase-pat.mjs");
    return fromCli.startsWith("sbp_") ? fromCli : null;
  } catch {
    return null;
  }
}

async function resolveDatabaseUrl(pat: string | null): Promise<string> {
  const env: NodeJS.ProcessEnv = { ...process.env };
  if (pat) env.SUPABASE_ACCESS_TOKEN = pat;
  const url = run("npx tsx scripts/resolve-database-url.ts", undefined, env);
  // Script writes URL to stdout only on success.
  if (!url.startsWith("postgresql://")) {
    throw new Error(url || "Failed to resolve DATABASE_URL");
  }
  return url;
}

async function main() {
  console.log("→ Linking Vercel project uniqueskyway...");
  try {
    run("vercel link --project uniqueskyway --yes");
  } catch {
    /* already linked */
  }

  run("node -e \"const p=require('./.vercel/project.json'); if(p.projectName!=='uniqueskyway'){console.error('Wrong project');process.exit(1)}\"");

  console.log("→ Fetching Supabase API keys...");
  const keysJson = run(
    `supabase projects api-keys --project-ref ${PROJECT_REF} -o json 2>/dev/null`,
  );
  const keys = JSON.parse(keysJson) as Array<{ name: string; api_key: string }>;
  const anon = keys.find((k) => k.name === "anon")?.api_key;
  const service = keys.find((k) => k.name === "service_role")?.api_key;
  if (!anon || !service) throw new Error("Missing Supabase API keys");

  const supabaseUrl = `https://${PROJECT_REF}.supabase.co`;
  const pat = await getPat();
  if (!pat && !process.env.DATABASE_URL?.trim() && !process.env.SUPABASE_DB_PASSWORD?.trim()) {
    throw new Error(
      "Could not resolve database credentials. Run supabase login, or set SUPABASE_ACCESS_TOKEN / DATABASE_URL / SUPABASE_DB_PASSWORD",
    );
  }
  const databaseUrl = await resolveDatabaseUrl(pat);
  console.log("  ✓ Database reachable");

  const cronSecret = process.env.CRON_SECRET?.trim() || randomBytes(32).toString("hex");
  const resendKey = process.env.RESEND_API_KEY?.trim();

  // Only set SITE_ACCESS_KEY when explicitly provided locally (never rotate via pull — secrets are redacted).
  const explicitAccessKey = process.env.SITE_ACCESS_KEY?.trim();

  if (!resendKey) {
    console.log("  ⚠ RESEND_API_KEY not set locally — add to Vercel manually or export before sync");
  }

  console.log("→ Updating Vercel environment...");
  for (const target of ["production", "preview"] as const) {
    setVercelEnv("NEXT_PUBLIC_APP_URL", APP_URL, target);
    setVercelEnv("NEXT_PUBLIC_APP_NAME", "Unique Sky Way", target);
    setVercelEnv("NEXT_PUBLIC_SUPABASE_URL", supabaseUrl, target);
    setVercelEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", anon, target);
    setVercelEnv("SUPABASE_SERVICE_ROLE_KEY", service, target);
    setVercelEnv("DATABASE_URL", databaseUrl, target);
    setVercelEnv("CRON_SECRET", cronSecret, target);
    setVercelEnv("EMAIL_FROM", "Unique Sky Way <info@uniqueskyway.com>", target);
  }

  if (explicitAccessKey) {
    setVercelEnv("SITE_ACCESS_KEY", explicitAccessKey, "production");
  } else {
    console.log("  ⚠ SITE_ACCESS_KEY not updated (set locally to change)");
  }
  setVercelEnv("MAINTENANCE_MODE", "false", "production");

  if (resendKey) {
    setVercelEnv("RESEND_API_KEY", resendKey, "production");
    setVercelEnv("RESEND_API_KEY", resendKey, "preview");
    console.log("  ✓ RESEND_API_KEY synced");
  } else {
    console.log("  ⚠ RESEND_API_KEY not set — emails will queue but not send");
  }

  console.log("→ Done. Run: vercel deploy --prod");
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
