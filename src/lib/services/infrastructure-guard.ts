import { isDatabaseConfigured } from "@/lib/env";
import { fail } from "./base";
import type { ServiceResult } from "./types";

export function guardDatabase<T>(): ServiceResult<T> | null {
  if (!isDatabaseConfigured()) {
    return fail(
      "INFRASTRUCTURE_NOT_CONFIGURED",
      "Database is not configured. Set DATABASE_URL in your environment.",
    );
  }
  return null;
}
