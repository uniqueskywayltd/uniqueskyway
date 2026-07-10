/**
 * Resolve a working Supabase DATABASE_URL (pooler, transaction mode).
 * Uses SUPABASE_ACCESS_TOKEN or SUPABASE_DB_PASSWORD — never prints secrets.
 */
import { randomBytes } from "node:crypto";
import postgres from "postgres";

const PROJECT_REF = "cdgvfhqyctnbvnykodek";
const REGION = "eu-west-1";

function poolerUrl(password: string): string {
  const base = `postgresql://postgres.${PROJECT_REF}:${encodeURIComponent(password)}@aws-0-${REGION}.pooler.supabase.com:6543/postgres`;
  return `${base}?sslmode=require`;
}

async function testUrl(url: string): Promise<boolean> {
  const sql = postgres(url, { prepare: false, max: 1, connect_timeout: 20 });
  try {
    await sql`select 1 as ok`;
    return true;
  } catch {
    return false;
  } finally {
    await sql.end({ timeout: 5 }).catch(() => undefined);
  }
}

async function resetPassword(pat: string): Promise<string> {
  const password = randomBytes(18).toString("base64url");
  const res = await fetch(
    `https://api.supabase.com/v1/projects/${PROJECT_REF}/database/password`,
    {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${pat}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ password }),
    },
  );

  if (!res.ok) {
    throw new Error(`Password reset failed (${res.status}): ${await res.text()}`);
  }

  // Allow SCRAM auth to propagate on pooler.
  for (let attempt = 1; attempt <= 6; attempt++) {
    await new Promise((r) => setTimeout(r, attempt * 2000));
    if (await testUrl(poolerUrl(password))) return password;
  }

  throw new Error("Password reset succeeded but pooler connection still fails after retries");
}

async function main() {
  const existing = process.env.DATABASE_URL?.trim();
  if (existing && (await testUrl(existing))) {
    process.stdout.write(existing);
    return;
  }

  const known = process.env.SUPABASE_DB_PASSWORD?.trim();
  if (known && (await testUrl(poolerUrl(known)))) {
    process.stdout.write(poolerUrl(known));
    return;
  }

  const pat = process.env.SUPABASE_ACCESS_TOKEN?.trim();
  if (!pat?.startsWith("sbp_")) {
    throw new Error("Set SUPABASE_ACCESS_TOKEN (sbp_…) or a working DATABASE_URL / SUPABASE_DB_PASSWORD");
  }

  const password = await resetPassword(pat);
  process.stdout.write(poolerUrl(password));
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
