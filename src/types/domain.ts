export type UserStatus = "active" | "suspended" | "pending_verification";

export type AdminRole =
  | "super_admin"
  | "administrator"
  | "finance_manager"
  | "compliance_officer"
  | "support_agent"
  | "auditor";

export type LedgerAccountType =
  | "available"
  | "invested"
  | "pending_deposit"
  | "pending_withdrawal"
  | "referral";

export type LedgerEntryType =
  | "deposit"
  | "withdrawal"
  | "investment_principal"
  | "investment_interest"
  | "referral_commission"
  | "reinvestment"
  | "admin_adjustment"
  | "reversal";

export type DepositStatus =
  | "draft"
  | "submitted"
  | "under_review"
  | "processing"
  | "pending"
  | "approved"
  | "rejected"
  | "cancelled";
export type WithdrawalStatus =
  | "draft"
  | "submitted"
  | "under_review"
  | "pending"
  | "approved"
  | "rejected"
  | "processing"
  | "completed"
  | "cancelled";

export type PayoutStatus = "pending" | "processing" | "completed" | "failed";

export type RiskEventType =
  | "large_withdrawal"
  | "multiple_withdrawals"
  | "device_change"
  | "new_login_location"
  | "high_risk_pattern";

export type RiskSeverity = "low" | "medium" | "high";

export type InvestmentStatus =
  | "pending"
  | "active"
  | "matured"
  | "cancelled"
  | "reinvested";

export type InvestmentEventType =
  | "created"
  | "activated"
  | "roi_accrued"
  | "reinvested"
  | "matured"
  | "closed"
  | "paused"
  | "resumed"
  | "force_matured";

export type RoiRunMode = "daily" | "single" | "recovery" | "dry_run";
export type RoiRunStatus = "running" | "completed" | "failed" | "dry_run";

export type AuditAction =
  | "create"
  | "update"
  | "delete"
  | "approve"
  | "reject"
  | "login"
  | "logout"
  | "export"
  | "adjustment";

export type NotificationChannel = "in_app" | "email" | "sms" | "push";
export type NotificationEventStatus =
  | "pending"
  | "processing"
  | "completed"
  | "failed";

export type PermissionCategory =
  | "users"
  | "finance"
  | "investments"
  | "compliance"
  | "support"
  | "system"
  | "audit";
