/**
 * @deprecated Do NOT seed investment plans from this file.
 * Legacy plan definitions are inconsistent between marketing pages,
 * ROI engine, and maturity rules. Plans will be populated only
 * after full legacy business logic validation during migration.
 *
 * This file exists solely as a reference during reconciliation.
 */
export const LEGACY_PLAN_REFERENCE = {
  note: "NOT FOR PRODUCTION SEEDING — pending migration validation",
  plans: [] as const,
} as const;
