import { normalizeTxType } from "./legacy-sql-parser";
import {
  extractReferrerUsername,
  mapLegacyPlanToSlug,
  migrationIdempotencyKey,
  money,
  sanitizeAvatarFilename,
} from "./transform-rules";
import type {
  LegacyExtract,
  MigrationTransformResult,
  TransformedLedgerEntry,
  TransformedReferralRelationship,
} from "./types";

export function transformLegacyExtract(
  extract: LegacyExtract,
): MigrationTransformResult {
  const users = extract.users.map((user) => ({
    legacyUserId: user.uId,
    email: user.email,
    fullName: user.name.trim() || user.userName,
    username: user.userName.trim(),
    referralCode: user.userName.trim(),
    referredByUsername: extractReferrerUsername(user.ref),
    registeredAt: new Date(user.registeredAt || Date.now()),
    avatarFilename: sanitizeAvatarFilename(user.passport),
    status: "active" as const,
    passwordResetRequired: true as const,
  }));

  const referralRelationships: TransformedReferralRelationship[] = [];
  for (const user of extract.users) {
    const referrerUsername = extractReferrerUsername(user.ref);
    if (!referrerUsername) continue;
    referralRelationships.push({
      referrerUsername,
      referredEmail: user.email,
      referralCodeUsed: referrerUsername,
    });
  }

  const archiveRows = extract.transactions.map((tx) => ({
    legacyTransactionId: tx.tId,
    legacyUserId: tx.userId,
    email: tx.email,
    plan: tx.plan,
    type: tx.type,
    method: tx.method,
    amount: String(tx.amount),
    externalRef: tx.traId,
    interest: String(tx.interest),
    address: tx.address,
    network: tx.network,
    confirm: tx.confirm,
    complete: tx.complete,
    legacyCreatedAt: tx.createdAt,
    legacyUpdatedAt: tx.eventDate,
    rawPayload: tx.raw,
  }));

  const investments = extract.transactions
    .filter((tx) => normalizeTxType(tx.type) === "credit")
    .map((tx) => ({
      legacyTransactionId: tx.tId,
      email: tx.email,
      planSlug: mapLegacyPlanToSlug(tx.plan) ?? "silver",
      principalAmount: money(tx.amount),
      accruedInterest: money(tx.interest),
      status: "active" as const,
      startedAt: new Date(tx.eventDate || tx.createdAt),
      paymentMethod: tx.method || "legacy",
      externalTransactionRef: tx.traId || `legacy-${tx.tId}`,
    }));

  const referralCommissions = extract.transactions
    .filter((tx) => normalizeTxType(tx.type) === "referral")
    .map((tx) => {
      const referrerEmail = tx.email;
      const referred = referralRelationships.find((rel) => {
        const referrer = extract.users.find((u) => u.email === referrerEmail);
        return (
          referrer &&
          rel.referrerUsername.toLowerCase() === referrer.userName.trim().toLowerCase()
        );
      });

      return {
        legacyTransactionId: tx.tId,
        referrerEmail,
        referredEmail: referred?.referredEmail ?? referrerEmail,
        amount: money(tx.amount),
        occurredAt: new Date(tx.createdAt),
      };
    });

  const ledgerEntries: TransformedLedgerEntry[] = [];

  for (const tx of extract.transactions) {
    const type = normalizeTxType(tx.type);
    const occurredAt = new Date(tx.createdAt || tx.eventDate);
    const base = {
      legacyTransactionId: tx.tId,
      email: tx.email,
      occurredAt,
      metadata: { legacyType: tx.type, confirm: tx.confirm, complete: tx.complete },
    };

    if (type === "credit" && tx.confirm !== 0) {
      ledgerEntries.push({
        ...base,
        accountType: "invested",
        direction: "credit",
        amount: money(tx.amount),
        entryType: "investment_principal",
        idempotencyKey: migrationIdempotencyKey("ledger-principal", tx.tId),
        description: `Legacy investment principal (tx ${tx.tId})`,
      });
      if (tx.interest > 0) {
        ledgerEntries.push({
          ...base,
          accountType: "available",
          direction: "credit",
          amount: money(tx.interest),
          entryType: "investment_interest",
          idempotencyKey: migrationIdempotencyKey("ledger-interest", tx.tId),
          description: `Legacy ROI interest (tx ${tx.tId})`,
        });
      }
    }

    if (type === "referral" && tx.confirm !== 0) {
      ledgerEntries.push({
        ...base,
        accountType: "available",
        direction: "credit",
        amount: money(tx.amount),
        entryType: "referral_commission",
        idempotencyKey: migrationIdempotencyKey("ledger-referral", tx.tId),
        description: `Legacy referral commission (tx ${tx.tId})`,
      });
    }

    if (type === "reinvest" && tx.confirm !== 0) {
      ledgerEntries.push({
        ...base,
        accountType: "available",
        direction: "debit",
        amount: money(tx.amount),
        entryType: "reinvestment",
        idempotencyKey: migrationIdempotencyKey("ledger-reinvest-debit", tx.tId),
        description: `Legacy reinvestment debit (tx ${tx.tId})`,
      });
      ledgerEntries.push({
        ...base,
        accountType: "invested",
        direction: "credit",
        amount: money(tx.amount),
        entryType: "investment_principal",
        idempotencyKey: migrationIdempotencyKey("ledger-reinvest-credit", tx.tId),
        description: `Legacy reinvestment credit (tx ${tx.tId})`,
      });
      if (tx.interest > 0) {
        ledgerEntries.push({
          ...base,
          accountType: "available",
          direction: "credit",
          amount: money(tx.interest),
          entryType: "investment_interest",
          idempotencyKey: migrationIdempotencyKey("ledger-reinvest-interest", tx.tId),
          description: `Legacy reinvestment interest (tx ${tx.tId})`,
        });
      }
    }

    if (type === "debit") {
      if (tx.confirm === 0) {
        ledgerEntries.push({
          ...base,
          accountType: "pending_withdrawal",
          direction: "debit",
          amount: money(tx.amount),
          entryType: "withdrawal",
          idempotencyKey: migrationIdempotencyKey("ledger-withdraw-pending", tx.tId),
          description: `Legacy pending withdrawal (tx ${tx.tId})`,
        });
      } else {
        ledgerEntries.push({
          ...base,
          accountType: "available",
          direction: "debit",
          amount: money(tx.amount),
          entryType: "withdrawal",
          idempotencyKey: migrationIdempotencyKey("ledger-withdraw", tx.tId),
          description: `Legacy withdrawal (tx ${tx.tId})`,
        });
      }
    }
  }

  return {
    users,
    referralRelationships,
    investments,
    ledgerEntries,
    referralCommissions,
    archiveRows,
  };
}
