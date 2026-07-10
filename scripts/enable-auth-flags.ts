import postgres from "postgres";

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL required");

  const sql = postgres(url, { prepare: false, max: 1 });
  try {
    const keys = ["registrations_enabled", "login_enabled"] as const;
    for (const key of keys) {
      const rows = await sql`
        UPDATE feature_flags
        SET enabled = true, updated_at = now()
        WHERE key = ${key}
        RETURNING key, enabled
      `;
      console.log(rows[0] ?? { key, enabled: "not found" });
    }
  } finally {
    await sql.end();
  }
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
