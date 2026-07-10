import { InvestmentPlansSection } from "@/components/marketing/investment-plans-section";
import { investmentPlanService } from "@/lib/services/investment-plan.service";
import { mapActivePlansToDisplay } from "@/lib/marketing/plans";

export async function PlansPreview() {
  const result = await investmentPlanService.listActive();
  const plans = result.success ? mapActivePlansToDisplay(result.data) : [];

  if (plans.length === 0) {
    return (
      <section className="border-y border-border bg-muted/20 py-16">
        <div className="mx-auto max-w-2xl px-4 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            Investment plans
          </p>
          <h2 className="mt-2 text-2xl font-semibold text-foreground">Plans coming soon</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Active investment plans configured in the admin portal will appear here automatically.
          </p>
        </div>
      </section>
    );
  }

  return <InvestmentPlansSection plans={plans} />;
}
