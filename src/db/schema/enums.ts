import { pgEnum } from "drizzle-orm/pg-core";

/** Customer-facing profile status only */
export const userStatusEnum = pgEnum("user_status", [
  "active",
  "suspended",
  "pending_verification",
]);

/**
 * Administrative roles — expandable RBAC model.
 * Only Super Admin is required at launch; others are reserved for future use.
 */
export const adminRoleEnum = pgEnum("admin_role", [
  "super_admin",
  "administrator",
  "finance_manager",
  "compliance_officer",
  "support_agent",
  "auditor",
]);

export const ledgerAccountTypeEnum = pgEnum("ledger_account_type", [
  "available",
  "invested",
  "pending_deposit",
  "pending_withdrawal",
  "referral",
]);

export const ledgerEntryTypeEnum = pgEnum("ledger_entry_type", [
  "deposit",
  "withdrawal",
  "investment_principal",
  "investment_interest",
  "referral_commission",
  "reinvestment",
  "admin_adjustment",
  "reversal",
]);

export const transactionDirectionEnum = pgEnum("transaction_direction", [
  "credit",
  "debit",
]);

export const depositStatusEnum = pgEnum("deposit_status", [
  "draft",
  "submitted",
  "under_review",
  "processing",
  "pending",
  "approved",
  "rejected",
  "cancelled",
]);

export const withdrawalStatusEnum = pgEnum("withdrawal_status", [
  "draft",
  "submitted",
  "under_review",
  "pending",
  "approved",
  "rejected",
  "processing",
  "completed",
  "cancelled",
]);

export const investmentStatusEnum = pgEnum("investment_status", [
  "pending",
  "active",
  "matured",
  "cancelled",
  "reinvested",
]);

export const notificationChannelEnum = pgEnum("notification_channel", [
  "in_app",
  "email",
  "sms",
  "push",
]);

export const notificationStatusEnum = pgEnum("notification_status", [
  "pending",
  "sent",
  "failed",
  "read",
]);

export const notificationEventStatusEnum = pgEnum("notification_event_status", [
  "pending",
  "processing",
  "completed",
  "failed",
]);

export const auditActionEnum = pgEnum("audit_action", [
  "create",
  "update",
  "delete",
  "approve",
  "reject",
  "login",
  "logout",
  "export",
  "adjustment",
]);

export const permissionCategoryEnum = pgEnum("permission_category", [
  "users",
  "finance",
  "investments",
  "compliance",
  "support",
  "system",
  "audit",
]);
