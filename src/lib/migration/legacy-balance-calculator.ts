import { LEGACY_LOCK_PERIOD_DAYS } from "./constants";
import { daysBetween, normalizeTxType } from "./legacy-sql-parser";
import type { LegacyBalanceSnapshot, LegacyTransaction } from "./types";

function roundLegacy(value: number): number {
  return Math.round(value);
}

function isConfirmed(tx: LegacyTransaction): boolean {
  return tx.confirm !== 0;
}

function isWithdrawalConfirmed(tx: LegacyTransaction): boolean {
  return tx.confirm === 1;
}

/**
 * Replicates legacy dashboard.php balance formulas (MySQL case-insensitive types).
 * Reference: dashboard/dashboard.php lines 290-400.
 */
export function calculateLegacyBalance(
  email: string,
  legacyUserId: number,
  transactions: LegacyTransaction[],
): LegacyBalanceSnapshot {
  const userTxs = transactions.filter(
    (tx) => tx.email.toLowerCase() === email.toLowerCase(),
  );

  let totalBalance = 0;
  let withdrawablePrincipal = 0;
  let withdrawableInterest = 0;
  let referralEarnings = 0;
  let totalWithdrawn = 0;
  let pendingWithdrawals = 0;
  let totalInvested = 0;
  let roiInterest = 0;

  for (const tx of userTxs) {
    const type = normalizeTxType(tx.type);

    if (!isConfirmed(tx)) {
      if (type === "debit") {
        pendingWithdrawals += tx.amount;
      }
      continue;
    }

    if (type === "credit" || type === "referral" || type === "reinvest") {
      totalBalance += tx.amount + tx.interest;
    }

    if (type === "debit" || type === "reinvest") {
      totalBalance -= tx.amount;
    }

    if (type === "credit") {
      totalInvested += tx.amount;
      roiInterest += tx.interest;

      const lockDays = daysBetween(tx.createdAt, tx.eventDate);
      if (lockDays >= LEGACY_LOCK_PERIOD_DAYS) {
        withdrawablePrincipal += tx.amount;
        withdrawableInterest += tx.interest;
      }
    }

    if (type === "reinvest") {
      roiInterest += tx.interest;
      const lockDays = daysBetween(tx.createdAt, tx.eventDate);
      if (lockDays >= LEGACY_LOCK_PERIOD_DAYS) {
        withdrawableInterest += tx.interest;
      }
    }

    if (type === "referral") {
      referralEarnings += tx.amount;
      withdrawablePrincipal += tx.amount;
    }

    if (type === "debit" && isWithdrawalConfirmed(tx)) {
      totalWithdrawn += tx.amount;
    }
  }

  referralEarnings = roundLegacy(referralEarnings);
  roiInterest = roundLegacy(roiInterest);
  totalWithdrawn = roundLegacy(totalWithdrawn);

  const withdrawableBalance = roundLegacy(
    withdrawablePrincipal + withdrawableInterest + referralEarnings - totalWithdrawn,
  );

  return {
    legacyUserId,
    email,
    totalBalance: roundLegacy(totalBalance),
    withdrawableBalance,
    totalInvested: roundLegacy(totalInvested),
    totalWithdrawn,
    referralEarnings,
    roiInterest,
    pendingWithdrawals: roundLegacy(pendingWithdrawals),
  };
}

export function calculateAllLegacyBalances(
  users: Array<{ uId: number; email: string }>,
  transactions: LegacyTransaction[],
): LegacyBalanceSnapshot[] {
  return users.map((user) =>
    calculateLegacyBalance(user.email, user.uId, transactions),
  );
}
