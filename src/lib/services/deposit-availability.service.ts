import { FEATURE_FLAGS } from "@/lib/constants/feature-flags";
import type { InvestmentPlanView } from "./investment-plan.service";
import { investmentPlanService } from "./investment-plan.service";
import type { PlatformWalletView } from "./platform-wallet.service";
import { platformWalletService } from "./platform-wallet.service";
import { featureFlagService } from "./feature-flags.service";
import { ok } from "./base";
import type { ServiceResult } from "./types";

export type DepositUnavailableReason =
  | "maintenance"
  | "no_plans"
  | "no_wallets"
  | "infrastructure";

export type CustomerDepositAvailability =
  | {
      canDeposit: true;
      plans: InvestmentPlanView[];
      wallets: PlatformWalletView[];
    }
  | {
      canDeposit: false;
      reason: DepositUnavailableReason;
      title: string;
      message: string;
    };

export async function getCustomerDepositAvailability(): Promise<
  ServiceResult<CustomerDepositAvailability>
> {
  if (await featureFlagService.isMaintenanceMode()) {
    return ok({
      canDeposit: false,
      reason: "maintenance",
      title: "Deposits paused",
      message: "The platform is in maintenance mode. Please try again shortly.",
    });
  }

  const [plansResult, walletsResult] = await Promise.all([
    investmentPlanService.listActive(),
    platformWalletService.listActiveForCustomers(),
  ]);

  if (!plansResult.success) {
    return ok({
      canDeposit: false,
      reason: "infrastructure",
      title: "Deposits unavailable",
      message: plansResult.error.message,
    });
  }

  if (!walletsResult.success) {
    return ok({
      canDeposit: false,
      reason: "infrastructure",
      title: "Deposits unavailable",
      message: walletsResult.error.message,
    });
  }

  if (plansResult.data.length === 0) {
    return ok({
      canDeposit: false,
      reason: "no_plans",
      title: "Investment plans coming soon",
      message:
        "New deposit plans are being finalized. Your existing portfolio, wallet, and transaction history remain available.",
    });
  }

  if (walletsResult.data.length === 0) {
    return ok({
      canDeposit: false,
      reason: "no_wallets",
      title: "Deposit wallets being configured",
      message:
        "Our team is setting up secure payment wallets and QR codes. Once live, you can fund investments here. Everything else in your account works as normal.",
    });
  }

  return ok({
    canDeposit: true,
    plans: plansResult.data,
    wallets: walletsResult.data,
  });
}

/** Deposits are allowed when active wallets exist, even if feature flags are still off. */
export async function areDepositsOperational(): Promise<boolean> {
  const wallets = await platformWalletService.listActiveForCustomers();
  if (wallets.success && wallets.data.length > 0) return true;
  return featureFlagService.isEnabled(FEATURE_FLAGS.DEPOSITS_ENABLED);
}
