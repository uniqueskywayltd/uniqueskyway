#!/usr/bin/env npx tsx
/**
 * Writes deploy/.env.cpanel.generated for Namecheap cPanel Node.js env vars.
 * Does not print secret values to stdout.
 */
import { execSync } from "node:child_process";
import { randomBytes } from "node:crypto";
import { writeFileSync } from "node:fs";
import path from "node:path";

const PROJECT_REF = "cdgvfhqyctnbvnykodek";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL?.trim() || "https://uniqueskyway.com";

function run(cmd: string): string {
  return execSync(cmd, { encoding: "utf8", stdio: ["pipe", "pipe", "pipe"] }).trim();
}

const keysJson = run(`supabase projects api-keys --project-ref ${PROJECT_REF} -o json`);
const keys = JSON.parse(keysJson) as Array<{ name: string; api_key: string }>;
const anon = keys.find((k) => k.name === "anon")?.api_key;
const service = keys.find((k) => k.name === "service_role")?.api_key;
if (!anon || !service) throw new Error("Missing Supabase API keys");

let databaseUrl = process.env.DATABASE_URL?.trim() ?? "";
if (!databaseUrl) {
  databaseUrl = run("npx tsx scripts/resolve-database-url.ts");
}
if (!databaseUrl.startsWith("postgresql://")) {
  throw new Error(
    "Could not resolve DATABASE_URL. Set DATABASE_URL or SUPABASE_DB_PASSWORD, or run supabase login.",
  );
}

const cronSecret = process.env.CRON_SECRET?.trim() || randomBytes(32).toString("hex");
const resendKey = process.env.RESEND_API_KEY?.trim() ?? "";
const emailFrom =
  process.env.EMAIL_FROM?.trim() || "Unique Sky Way <info@uniqueskyway.com>";

const lines = [
  "NODE_ENV=production",
  "PORT=3000",
  "HOSTNAME=127.0.0.1",
  "",
  `NEXT_PUBLIC_APP_URL=${APP_URL}`,
  'NEXT_PUBLIC_APP_NAME="Unique Sky Way"',
  "",
  `NEXT_PUBLIC_SUPABASE_URL=https://${PROJECT_REF}.supabase.co`,
  `NEXT_PUBLIC_SUPABASE_ANON_KEY=${anon}`,
  `SUPABASE_SERVICE_ROLE_KEY=${service}`,
  `DATABASE_URL=${databaseUrl}`,
  "",
  resendKey ? `RESEND_API_KEY=${resendKey}` : "# RESEND_API_KEY=  ← ADD FROM RESEND DASHBOARD",
  `EMAIL_FROM=${emailFrom}`,
  "",
  `CRON_SECRET=${cronSecret}`,
  "MAINTENANCE_MODE=false",
  "REGISTRATIONS_ENABLED=true",
];

const outPath = path.join(process.cwd(), "deploy", ".env.cpanel.generated");
writeFileSync(outPath, lines.join("\n") + "\n", { mode: 0o600 });
console.log(`Wrote ${outPath}`);
if (!resendKey) console.log("NOTE: Add RESEND_API_KEY to the file before going live.");
