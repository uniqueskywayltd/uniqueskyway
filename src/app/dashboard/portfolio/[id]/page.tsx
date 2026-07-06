import Link from "next/link";

import { redirect } from "next/navigation";

import { getCustomerProfile, getSessionUser } from "@/lib/auth/session";

import { portfolioService } from "@/lib/services/portfolio.service";

import { PageHeader } from "@/components/design-system/page-header";

import { StatCard } from "@/components/design-system/stat-card";

import { ServiceErrorState } from "@/components/dashboard/service-error-state";

import { formatMoney } from "@/lib/utils/money";

import { Badge } from "@/components/ui/badge";

import { buttonVariants } from "@/components/ui/button";

export default async function InvestmentDetailPage({

  params,

}: {

  params: Promise<{ id: string }>;

}) {

  const user = await getSessionUser();

  if (!user) redirect("/login");

  const profile = await getCustomerProfile(user.authUserId);

  if (!profile) redirect("/login");



  const { id } = await params;

  const result = await portfolioService.getInvestmentDetail(profile.id, id);



  if (!result.success) {

    return (

      <div className="space-y-6">

        <PageHeader title="Investment" description="Investment position details." />

        <ServiceErrorState code={result.error.code} message={result.error.message} />

      </div>

    );

  }



  const inv = result.data;

  const preview = inv.roiPreview;



  return (

    <div className="space-y-8">

      <PageHeader

        title={inv.planName}

        description="Investment position backed by immutable ledger entries."

        actions={

          <div className="flex gap-2">

            {inv.status === "matured" || inv.status === "active" ? (

              <Link

                href={`/dashboard/portfolio/reinvest?from=${inv.id}`}

                className={buttonVariants({ variant: "default" })}

              >

                Reinvest

              </Link>

            ) : null}

            <Link href="/dashboard/portfolio" className={buttonVariants({ variant: "outline" })}>

              Back to portfolio

            </Link>

          </div>

        }

      />



      <div className="flex items-center gap-2">

        <Badge variant="outline" className="capitalize">{inv.status}</Badge>

        {preview.remainingDays > 0 ? (

          <span className="text-sm text-muted-foreground">{preview.remainingDays} days remaining</span>

        ) : null}

      </div>



      <div className="space-y-2">

        <div className="flex justify-between text-sm">

          <span className="text-muted-foreground">Maturity progress</span>

          <span className="font-medium">{preview.progressPercent}%</span>

        </div>

        <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-primary transition-all"
            style={{ width: `${preview.progressPercent}%` }}
          />
        </div>

      </div>



      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">

        <StatCard title="Principal" value={formatMoney(inv.principalAmount)} />

        <StatCard title="ROI earned" value={formatMoney(preview.currentRoiEarned)} />

        <StatCard title="Daily earnings" value={formatMoney(preview.dailyEarnings)} />

        <StatCard title="Est. maturity value" value={formatMoney(preview.estimatedMaturityValue)} />

      </div>



      <div className="grid gap-6 lg:grid-cols-2">

        <div className="rounded-xl border border-border/60 bg-card p-6 space-y-3 text-sm">

          <h2 className="font-semibold">ROI preview</h2>

          <div className="flex justify-between">

            <span className="text-muted-foreground">Next accrual</span>

            <span>{preview.nextAccrualDate ?? "—"}</span>

          </div>

          <div className="flex justify-between">

            <span className="text-muted-foreground">Daily ROI rate</span>

            <span>{inv.dailyRoiPercent}%</span>

          </div>

          <div className="flex justify-between">

            <span className="text-muted-foreground">Expected total ROI</span>

            <span>{formatMoney(inv.expectedRoi)}</span>

          </div>

          <div className="flex justify-between">

            <span className="text-muted-foreground">Start date</span>

            <span>{inv.startedAt ? new Date(inv.startedAt).toLocaleDateString() : "—"}</span>

          </div>

          <div className="flex justify-between">

            <span className="text-muted-foreground">Maturity date</span>

            <span>{inv.maturesAt ? new Date(inv.maturesAt).toLocaleDateString() : "—"}</span>

          </div>

          <div className="flex justify-between">

            <span className="text-muted-foreground">Linked deposit</span>

            <span className="font-mono text-xs">{inv.depositReference ?? "—"}</span>

          </div>

          <Link href="/dashboard/ledger" className="inline-block text-primary hover:underline">

            View in ledger explorer →

          </Link>

        </div>



        <div className="rounded-xl border border-border/60 bg-card p-6">

          <h2 className="mb-4 font-semibold">Activity timeline</h2>

          {inv.timeline.length ? (

            <ul className="space-y-4">

              {inv.timeline.map((event) => (

                <li key={event.id} className="border-l-2 border-primary/30 pl-4 text-sm">

                  <p className="font-medium capitalize">{event.title}</p>

                  {event.description ? (

                    <p className="text-muted-foreground">{event.description}</p>

                  ) : null}

                  {event.amount ? (

                    <p className="text-emerald-600 font-medium">{formatMoney(event.amount)}</p>

                  ) : null}

                  <p className="text-xs text-muted-foreground">

                    {new Date(event.createdAt).toLocaleString()}

                  </p>

                </li>

              ))}

            </ul>

          ) : (

            <p className="text-sm text-muted-foreground">No activity recorded yet.</p>

          )}

        </div>

      </div>

    </div>

  );

}

