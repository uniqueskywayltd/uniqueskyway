export type LegacyUser = {
  uId: number;
  name: string;
  userName: string;
  pass: string;
  email: string;
  plan: string;
  passport: string;
  registeredAt: string;
  ref: string;
  myRef: string;
  raw: Record<string, unknown>;
};

export type LegacyTransaction = {
  tId: number;
  userId: string;
  email: string;
  plan: string;
  type: string;
  method: string;
  amount: number;
  traId: string;
  createdAt: string;
  interest: number;
  eventDate: string;
  address: string;
  network: string;
  confirm: number;
  complete: number;
  raw: Record<string, unknown>;
};

export type LegacyAdmin = {
  aId: number;
  adminEmail: string;
  adminPass: string;
  raw: Record<string, unknown>;
};

export type LegacyExtract = {
  sourcePath: string;
  extractedAt: string;
  users: LegacyUser[];
  transactions: LegacyTransaction[];
  admins: LegacyAdmin[];
  stats: {
    userCount: number;
    transactionCount: number;
    adminCount: number;
  };
};

export type LegacyBalanceSnapshot = {
  legacyUserId: number;
  email: string;
  totalBalance: number;
  withdrawableBalance: number;
  totalInvested: number;
  totalWithdrawn: number;
  referralEarnings: number;
  roiInterest: number;
  pendingWithdrawals: number;
};

export type TransformedUser = {
  legacyUserId: number;
  email: string;
  fullName: string;
  username: string;
  referralCode: string;
  referredByUsername: string | null;
  registeredAt: Date;
  avatarFilename: string | null;
  status: "active" | "suspended" | "pending_verification";
  legacyPassword: string;
  passwordResetRequired: boolean;
};

export type TransformedLedgerEntry = {
  legacyTransactionId: number;
  email: string;
  accountType: "available" | "invested" | "pending_withdrawal" | "referral";
  direction: "credit" | "debit";
  amount: string;
  entryType:
    | "deposit"
    | "withdrawal"
    | "investment_principal"
    | "investment_interest"
    | "referral_commission"
    | "reinvestment"
    | "admin_adjustment";
  idempotencyKey: string;
  description: string;
  occurredAt: Date;
  metadata: Record<string, unknown>;
};

export type TransformedInvestment = {
  legacyTransactionId: number;
  email: string;
  planSlug: string;
  principalAmount: string;
  accruedInterest: string;
  status: "active" | "matured" | "reinvested";
  startedAt: Date;
  paymentMethod: string;
  externalTransactionRef: string;
};

export type TransformedReferralCommission = {
  legacyTransactionId: number;
  referrerEmail: string;
  referredEmail: string;
  amount: string;
  occurredAt: Date;
};

export type TransformedReferralRelationship = {
  referrerUsername: string;
  referredEmail: string;
  referralCodeUsed: string;
};

export type MigrationTransformResult = {
  users: TransformedUser[];
  referralRelationships: TransformedReferralRelationship[];
  investments: TransformedInvestment[];
  ledgerEntries: TransformedLedgerEntry[];
  referralCommissions: TransformedReferralCommission[];
  archiveRows: Array<Record<string, unknown>>;
};

export type MigrationValidationIssue = {
  severity: "error" | "warning";
  code: string;
  message: string;
  entityType?: string;
  legacyId?: number;
  email?: string;
};

export type MigrationPhase =
  | "extract"
  | "validate"
  | "transform"
  | "load"
  | "verify"
  | "report";

export type MigrationRunOptions = {
  dryRun: boolean;
  sourcePath: string;
  runKey?: string;
  label?: string;
  phases?: MigrationPhase[];
  resumeRunId?: string;
  batchSize?: number;
  skipImages?: boolean;
  adminId?: string;
};

export type MigrationRunStats = {
  usersExtracted: number;
  usersLoaded: number;
  transactionsExtracted: number;
  transactionsLoaded: number;
  investmentsLoaded: number;
  ledgerEntriesLoaded: number;
  referralsLoaded: number;
  imagesLoaded: number;
  imagesFailed: number;
  balanceExceptions: number;
  validationErrors: number;
  validationWarnings: number;
};

export type MigrationReportPayload = {
  generatedAt: string;
  runKey: string;
  dryRun: boolean;
  sections: Array<{
    title: string;
    summary: string;
    items: Array<Record<string, unknown>>;
  }>;
};
