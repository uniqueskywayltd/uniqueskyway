import type { AdminRole } from "@/types/domain";

/**
 * All granular permissions in the system.
 * Mapped to roles via role_permissions table.
 */
export const PERMISSIONS = {
  // Users
  USERS_READ: "users.read",
  USERS_WRITE: "users.write",
  USERS_DELETE: "users.delete",
  USERS_SUSPEND: "users.suspend",

  // Finance
  DEPOSITS_READ: "deposits.read",
  DEPOSITS_APPROVE: "deposits.approve",
  DEPOSITS_REJECT: "deposits.reject",
  WITHDRAWALS_READ: "withdrawals.read",
  WITHDRAWALS_APPROVE: "withdrawals.approve",
  WITHDRAWALS_REJECT: "withdrawals.reject",
  LEDGER_READ: "ledger.read",
  LEDGER_ADJUST: "ledger.adjust",

  // Investments
  INVESTMENTS_READ: "investments.read",
  INVESTMENTS_MANAGE: "investments.manage",
  PLANS_READ: "plans.read",
  PLANS_MANAGE: "plans.manage",

  // Referrals
  REFERRALS_READ: "referrals.read",
  REFERRALS_MANAGE: "referrals.manage",

  // Support & compliance
  SUPPORT_READ: "support.read",
  SUPPORT_MANAGE: "support.manage",
  COMPLIANCE_READ: "compliance.read",
  COMPLIANCE_MANAGE: "compliance.manage",

  // System
  SETTINGS_READ: "settings.read",
  SETTINGS_MANAGE: "settings.manage",
  FEATURE_FLAGS_MANAGE: "feature_flags.manage",
  EMAIL_BROADCAST: "email.broadcast",

  // Audit
  AUDIT_READ: "audit.read",
  AUDIT_EXPORT: "audit.export",

  // Migration
  MIGRATION_RUN: "migration.run",

  // Admin
  ADMINS_READ: "admins.read",
  ADMINS_MANAGE: "admins.manage",
} as const;

export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

/** Default role → permission mappings seeded at infrastructure setup */
export const DEFAULT_ROLE_PERMISSIONS: Record<AdminRole, Permission[]> = {
  super_admin: Object.values(PERMISSIONS),
  administrator: [
    PERMISSIONS.USERS_READ,
    PERMISSIONS.USERS_WRITE,
    PERMISSIONS.USERS_SUSPEND,
    PERMISSIONS.DEPOSITS_READ,
    PERMISSIONS.DEPOSITS_APPROVE,
    PERMISSIONS.DEPOSITS_REJECT,
    PERMISSIONS.WITHDRAWALS_READ,
    PERMISSIONS.WITHDRAWALS_APPROVE,
    PERMISSIONS.WITHDRAWALS_REJECT,
    PERMISSIONS.LEDGER_READ,
    PERMISSIONS.INVESTMENTS_READ,
    PERMISSIONS.INVESTMENTS_MANAGE,
    PERMISSIONS.PLANS_READ,
    PERMISSIONS.PLANS_MANAGE,
    PERMISSIONS.REFERRALS_READ,
    PERMISSIONS.SUPPORT_READ,
    PERMISSIONS.SUPPORT_MANAGE,
    PERMISSIONS.SETTINGS_READ,
    PERMISSIONS.AUDIT_READ,
    PERMISSIONS.EMAIL_BROADCAST,
  ],
  finance_manager: [
    PERMISSIONS.DEPOSITS_READ,
    PERMISSIONS.DEPOSITS_APPROVE,
    PERMISSIONS.DEPOSITS_REJECT,
    PERMISSIONS.WITHDRAWALS_READ,
    PERMISSIONS.WITHDRAWALS_APPROVE,
    PERMISSIONS.WITHDRAWALS_REJECT,
    PERMISSIONS.LEDGER_READ,
    PERMISSIONS.LEDGER_ADJUST,
    PERMISSIONS.INVESTMENTS_READ,
    PERMISSIONS.INVESTMENTS_MANAGE,
    PERMISSIONS.REFERRALS_READ,
    PERMISSIONS.AUDIT_READ,
  ],
  compliance_officer: [
    PERMISSIONS.USERS_READ,
    PERMISSIONS.COMPLIANCE_READ,
    PERMISSIONS.COMPLIANCE_MANAGE,
    PERMISSIONS.AUDIT_READ,
    PERMISSIONS.AUDIT_EXPORT,
    PERMISSIONS.LEDGER_READ,
  ],
  support_agent: [
    PERMISSIONS.USERS_READ,
    PERMISSIONS.SUPPORT_READ,
    PERMISSIONS.SUPPORT_MANAGE,
    PERMISSIONS.DEPOSITS_READ,
    PERMISSIONS.WITHDRAWALS_READ,
  ],
  auditor: [
    PERMISSIONS.AUDIT_READ,
    PERMISSIONS.AUDIT_EXPORT,
    PERMISSIONS.LEDGER_READ,
    PERMISSIONS.USERS_READ,
    PERMISSIONS.INVESTMENTS_READ,
    PERMISSIONS.DEPOSITS_READ,
    PERMISSIONS.WITHDRAWALS_READ,
  ],
};
