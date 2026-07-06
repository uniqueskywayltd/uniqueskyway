export * from "./finance";
export * from "./identity";
export * from "./enums";
export * from "./users";
export * from "./investments";
export * from "./ledger";
export * from "./referrals";
export * from "./governance";
export * from "./permissions";
export * from "./platform";
export * from "./treasury";
export * from "./risk";
export * from "./investment-engine";
export * from "./admin";
export * from "./migration";

import {
  profiles,
  adminUsers,
  loginHistory,
  userSessions,
} from "./users";
import { investmentPlans, investments } from "./investments";
import {
  ledgerAccounts,
  ledgerEntries,
  depositRequests,
  withdrawalRequests,
} from "./ledger";
import {
  referralRelationships,
  referralCommissions,
} from "./referrals";
import { featureFlags, systemSettings } from "./governance";
import { permissions, rolePermissions } from "./permissions";
import {
  notifications,
  notificationEvents,
  auditLogs,
  legacyTransactionsArchive,
} from "./platform";
import { paymentMethods, withdrawalMethods } from "./finance";
import {
  profilePreferences,
  notificationPreferences,
  authLockouts,
} from "./identity";
import { treasuryPayouts } from "./treasury";
import { riskEvents } from "./risk";

import { investmentEvents, roiProcessingRuns } from "./investment-engine";
import { customerNotes } from "./admin";
import {
  migrationRuns,
  migrationCheckpoints,
  migrationIdempotency,
  migrationReports,
  migrationBalanceExceptions,
} from "./migration";

export const schema = {
  profiles,
  adminUsers,
  loginHistory,
  userSessions,
  investmentPlans,
  investments,
  ledgerAccounts,
  ledgerEntries,
  depositRequests,
  withdrawalRequests,
  paymentMethods,
  withdrawalMethods,
  referralRelationships,
  referralCommissions,
  featureFlags,
  systemSettings,
  permissions,
  rolePermissions,
  notifications,
  notificationEvents,
  auditLogs,
  legacyTransactionsArchive,
  profilePreferences,
  notificationPreferences,
  authLockouts,
  treasuryPayouts,
  riskEvents,
  roiProcessingRuns,
  investmentEvents,
  customerNotes,
  migrationRuns,
  migrationCheckpoints,
  migrationIdempotency,
  migrationReports,
  migrationBalanceExceptions,
};
