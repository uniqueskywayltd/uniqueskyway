import { calculateAllLegacyBalances } from "./legacy-balance-calculator";
import { normalizeTxType } from "./legacy-sql-parser";
import { mapLegacyPlanToSlug, sanitizeAvatarFilename } from "./transform-rules";
import type {
  LegacyExtract,
  MigrationTransformResult,
  MigrationValidationIssue,
} from "./types";

export function validateLegacyExtract(
  extract: LegacyExtract,
): MigrationValidationIssue[] {
  const issues: MigrationValidationIssue[] = [];
  const emails = new Set<string>();
  const usernames = new Set<string>();

  for (const user of extract.users) {
    if (!user.email) {
      issues.push({
        severity: "error",
        code: "USER_MISSING_EMAIL",
        message: "User missing email",
        entityType: "user",
        legacyId: user.uId,
      });
    } else if (emails.has(user.email)) {
      issues.push({
        severity: "error",
        code: "USER_DUPLICATE_EMAIL",
        message: `Duplicate email: ${user.email}`,
        entityType: "user",
        legacyId: user.uId,
        email: user.email,
      });
    } else {
      emails.add(user.email);
    }

    const username = user.userName.trim().toLowerCase();
    if (!username) {
      issues.push({
        severity: "error",
        code: "USER_MISSING_USERNAME",
        message: "User missing username",
        entityType: "user",
        legacyId: user.uId,
      });
    } else if (usernames.has(username)) {
      issues.push({
        severity: "error",
        code: "USER_DUPLICATE_USERNAME",
        message: `Duplicate username: ${user.userName}`,
        entityType: "user",
        legacyId: user.uId,
      });
    } else {
      usernames.add(username);
    }

    if (user.passport && !sanitizeAvatarFilename(user.passport)) {
      issues.push({
        severity: "warning",
        code: "USER_INVALID_AVATAR",
        message: `Invalid avatar filename: ${user.passport}`,
        entityType: "user",
        legacyId: user.uId,
        email: user.email,
      });
    }
  }

  const userEmails = new Set(extract.users.map((u) => u.email.toLowerCase()));
  const usernameMap = new Map(
    extract.users.map((u) => [u.userName.trim().toLowerCase(), u.email]),
  );

  for (const user of extract.users) {
    const refMatch = user.ref.match(/ref=([^&]+)/i);
    const referrerUsername = refMatch?.[1]?.trim().toLowerCase();
    if (referrerUsername && !usernameMap.has(referrerUsername)) {
      issues.push({
        severity: "warning",
        code: "REFERRAL_MISSING_REFERRER",
        message: `Referrer "${referrerUsername}" not found for ${user.email}`,
        entityType: "referral",
        legacyId: user.uId,
        email: user.email,
      });
    }
  }

  for (const tx of extract.transactions) {
    if (!userEmails.has(tx.email.toLowerCase())) {
      issues.push({
        severity: "warning",
        code: "TX_ORPHAN_EMAIL",
        message: `Transaction ${tx.tId} references unknown email ${tx.email}`,
        entityType: "transaction",
        legacyId: tx.tId,
        email: tx.email,
      });
    }

    const type = normalizeTxType(tx.type);
    if (!["credit", "debit", "referral", "reinvest"].includes(type)) {
      issues.push({
        severity: "warning",
        code: "TX_UNKNOWN_TYPE",
        message: `Unknown transaction type "${tx.type}" on tx ${tx.tId}`,
        entityType: "transaction",
        legacyId: tx.tId,
        email: tx.email,
      });
    }

    if (type === "credit" && tx.plan && !mapLegacyPlanToSlug(tx.plan)) {
      issues.push({
        severity: "warning",
        code: "TX_UNKNOWN_PLAN",
        message: `Unknown plan "${tx.plan}" on tx ${tx.tId}`,
        entityType: "transaction",
        legacyId: tx.tId,
        email: tx.email,
      });
    }

    if (tx.amount < 0) {
      issues.push({
        severity: "error",
        code: "TX_NEGATIVE_AMOUNT",
        message: `Negative amount on tx ${tx.tId}`,
        entityType: "transaction",
        legacyId: tx.tId,
      });
    }
  }

  return issues;
}

export function validateReferralGraph(
  extract: LegacyExtract,
): MigrationValidationIssue[] {
  const issues: MigrationValidationIssue[] = [];
  const usernameMap = new Map(
    extract.users.map((u) => [u.userName.trim().toLowerCase(), u.uId]),
  );
  const referredBy = new Map<number, number>();

  for (const user of extract.users) {
    const refMatch = user.ref.match(/ref=([^&]+)/i);
    const referrerUsername = refMatch?.[1]?.trim().toLowerCase();
    if (!referrerUsername) continue;

    const referrerId = usernameMap.get(referrerUsername);
    if (!referrerId) continue;

    if (referrerId === user.uId) {
      issues.push({
        severity: "error",
        code: "REFERRAL_SELF",
        message: `Self-referral detected for user ${user.uId}`,
        entityType: "referral",
        legacyId: user.uId,
        email: user.email,
      });
      continue;
    }

    referredBy.set(user.uId, referrerId);
  }

  for (const [referredId, referrerId] of referredBy) {
    const visited = new Set<number>();
    let current: number | undefined = referredId;
    while (current !== undefined) {
      if (visited.has(current)) {
        issues.push({
          severity: "error",
          code: "REFERRAL_CIRCULAR",
          message: `Circular referral chain involving user ${current}`,
          entityType: "referral",
          legacyId: current,
        });
        break;
      }
      visited.add(current);
      current = referredBy.get(current);
      if (current === referrerId && visited.size > 1) {
        issues.push({
          severity: "error",
          code: "REFERRAL_CIRCULAR",
          message: `Circular referral chain involving user ${referredId}`,
          entityType: "referral",
          legacyId: referredId,
        });
        break;
      }
    }
  }

  return issues;
}

export function validateTransformedBalances(
  extract: LegacyExtract,
  transformed: MigrationTransformResult,
): MigrationValidationIssue[] {
  const issues: MigrationValidationIssue[] = [];
  const legacyBalances = calculateAllLegacyBalances(extract.users, extract.transactions);

  for (const legacy of legacyBalances) {
    const entries = transformed.ledgerEntries.filter(
      (e) => e.email === legacy.email,
    );

    let available = 0;
    let invested = 0;
    let pending = 0;

    for (const entry of entries) {
      const sign = entry.direction === "credit" ? 1 : -1;
      const amount = sign * parseFloat(entry.amount);
      if (entry.accountType === "available") available += amount;
      if (entry.accountType === "invested") invested += amount;
      if (entry.accountType === "pending_withdrawal") pending += amount;
    }

    const newTotal = Math.round(available + invested + pending);
    const diff = Math.abs(newTotal - legacy.totalBalance);

    if (diff > 0.01) {
      issues.push({
        severity: "error",
        code: "BALANCE_MISMATCH",
        message: `Balance mismatch for ${legacy.email}: legacy=${legacy.totalBalance} new=${newTotal} diff=${diff}`,
        entityType: "balance",
        email: legacy.email,
        legacyId: legacy.legacyUserId,
      });
    }
  }

  return issues;
}

export function validateMigration(
  extract: LegacyExtract,
  transformed?: MigrationTransformResult,
): MigrationValidationIssue[] {
  const issues = [
    ...validateLegacyExtract(extract),
    ...validateReferralGraph(extract),
  ];

  if (transformed) {
    issues.push(...validateTransformedBalances(extract, transformed));
  }

  return issues;
}
