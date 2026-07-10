import type { InvestmentPlanView } from "@/lib/services/investment-plan.service";
import type { PlanDisplay } from "@/components/marketing/investment-plans-section";

const TIER_SLUGS = ["silver", "gold", "classic", "master"] as const;

export function mapActivePlansToDisplay(
  plans: Array<
    InvestmentPlanView & {
      referralCommissionPercent?: string;
      sortOrder?: number;
    }
  >,
): PlanDisplay[] {
  if (plans.length === 0) return [];

  const featuredIndex = Math.min(1, plans.length - 1);

  return plans.map((plan, index) => ({
    name: plan.name,
    dailyRoiPercent: plan.dailyRoiPercent,
    minDeposit: plan.minDeposit,
    maxDeposit: plan.maxDeposit,
    durationDays: plan.durationDays,
    referralCommissionPercent: plan.referralCommissionPercent ?? "10",
    slug: plan.slug || TIER_SLUGS[index % TIER_SLUGS.length],
    featured: index === featuredIndex,
  }));
}
