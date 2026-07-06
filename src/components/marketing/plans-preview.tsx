import { InvestmentPlansSection, type PlanDisplay } from "@/components/marketing/investment-plans-section";
import { investmentPlanService } from "@/lib/services/investment-plan.service";

const FALLBACK_PLANS: PlanDisplay[] = [
  {
    name: "Silver Plan",
    dailyRoiPercent: "4",
    minDeposit: "50",
    maxDeposit: "25000",
    durationDays: 4,
    referralCommissionPercent: "10",
    slug: "silver",
  },
  {
    name: "Gold Plan",
    dailyRoiPercent: "5.5",
    minDeposit: "25000",
    maxDeposit: "50000",
    durationDays: 7,
    referralCommissionPercent: "10",
    slug: "gold",
    featured: true,
  },
  {
    name: "Classic Plan",
    dailyRoiPercent: "6",
    minDeposit: "50000",
    maxDeposit: "100000",
    durationDays: 14,
    referralCommissionPercent: "10",
    slug: "classic",
  },
  {
    name: "Master Plan",
    dailyRoiPercent: "10",
    minDeposit: "100000",
    maxDeposit: null,
    durationDays: 30,
    referralCommissionPercent: "10",
    slug: "master",
  },
];

export async function PlansPreview() {
  const result = await investmentPlanService.listVisible();

  const plans: PlanDisplay[] =
    result.success && result.data.length > 0
      ? result.data.map((p, i) => ({
          name: p.name,
          dailyRoiPercent: p.dailyRoiPercent,
          minDeposit: p.minDeposit,
          maxDeposit: p.maxDeposit,
          durationDays: p.durationDays,
          referralCommissionPercent: p.referralCommissionPercent,
          slug: p.slug,
          featured: p.slug === "gold" || i === 1,
        }))
      : FALLBACK_PLANS;

  return <InvestmentPlansSection plans={plans} />;
}
