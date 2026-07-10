import postgres from "postgres";

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL required");
  const sql = postgres(url, { prepare: false, ssl: "require", max: 1 });
  try {
    const keys = [
      "activity_feed_enabled",
      "seed_activity_enabled",
      "market_ticker_enabled",
    ];
    for (const key of keys) {
      await sql`
        INSERT INTO feature_flags (key, enabled, description)
        VALUES (${key}, true, ${key})
        ON CONFLICT (key) DO UPDATE SET enabled = true, updated_at = now()
      `;
    }
    const rows = await sql`SELECT key, enabled FROM feature_flags WHERE key = ANY(${keys})`;
    console.log(rows);
  } finally {
    await sql.end();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
