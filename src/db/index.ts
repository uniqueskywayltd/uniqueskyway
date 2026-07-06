import { isDatabaseConfigured } from "@/lib/env";
import { drizzle, type PostgresJsDatabase } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { schema } from "./schema";

export type Database = PostgresJsDatabase<typeof schema>;

let client: ReturnType<typeof postgres> | null = null;
let database: Database | null = null;

/**
 * Returns a singleton Drizzle client for server-side use.
 * Lazily initialized so builds succeed without DATABASE_URL.
 */
export function getDb(): Database {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error(
      "DATABASE_URL is not configured. Set it in your environment to use the database.",
    );
  }

  if (!database) {
    client = postgres(connectionString, { prepare: false });
    database = drizzle(client, { schema });
  }

  return database;
}

/** Returns null when DATABASE_URL is not set — safe for optional reads. */
export function getDbSafe(): Database | null {
  if (!isDatabaseConfigured()) return null;
  return getDb();
}
