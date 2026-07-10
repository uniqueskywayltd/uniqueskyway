import {
  TransactionalEmail,
  plainTransactionalEmail,
  type DetailLine,
} from "./components/transactional-email";
import { resolveAppUrl } from "@/lib/env";

type BaseProps = {
  name: string;
  amount?: string;
  referenceId?: string;
  dashboardUrl?: string;
};

const defaultDashboard = () => `${resolveAppUrl()}/dashboard`;

const sampleBase: BaseProps = {
  name: "Alex Morgan",
  amount: "$5,000.00",
  referenceId: "DEP-2026-00482",
  dashboardUrl: "https://uniqueskyway.com/dashboard",
};

function details(props: BaseProps, extra: DetailLine[] = []): DetailLine[] {
  const base: DetailLine[] = [];
  if (props.amount) base.push({ label: "Amount", value: props.amount, highlight: true });
  if (props.referenceId) base.push({ label: "Reference", value: props.referenceId });
  return [...base, ...extra];
}

export function DepositSubmittedEmail(props: BaseProps) {
  return (
    <TransactionalEmail
      preview="Your deposit has been submitted for review"
      heading="Deposit submitted"
      badge={{ label: "Pending review", tone: "warning" }}
      name={props.name}
      intro="We received your deposit request and our finance team is reviewing it. You will be notified once a decision is made."
      details={details(props)}
      cta={{ label: "View deposit", href: props.dashboardUrl ?? defaultDashboard() }}
    />
  );
}

DepositSubmittedEmail.PreviewProps = sampleBase;

export function DepositApprovedEmail(props: BaseProps) {
  return (
    <TransactionalEmail
      preview="Your deposit has been approved"
      heading="Deposit approved"
      badge={{ label: "Approved", tone: "success" }}
      name={props.name}
      intro="Great news — your deposit has been approved and your investment is now active."
      details={details(props)}
      cta={{ label: "View portfolio", href: props.dashboardUrl ?? defaultDashboard() }}
    />
  );
}

DepositApprovedEmail.PreviewProps = sampleBase;

export function DepositRejectedEmail(props: BaseProps & { reason?: string }) {
  return (
    <TransactionalEmail
      preview="Your deposit could not be approved"
      heading="Deposit not approved"
      badge={{ label: "Not approved", tone: "danger" }}
      name={props.name}
      intro="Unfortunately we were unable to approve your deposit at this time."
      details={details(props, props.reason ? [{ label: "Reason", value: props.reason }] : [])}
      footerNote="If you believe this is an error, please contact support with your reference ID."
      cta={{ label: "Contact support", href: `mailto:info@uniqueskyway.com` }}
    />
  );
}

DepositRejectedEmail.PreviewProps = {
  ...sampleBase,
  reason: "Payment proof could not be verified. Please resubmit with a clear screenshot.",
};

export function WithdrawalSubmittedEmail(props: BaseProps) {
  return (
    <TransactionalEmail
      preview="Your withdrawal request has been submitted"
      heading="Withdrawal submitted"
      badge={{ label: "Pending review", tone: "warning" }}
      name={props.name}
      intro="We received your withdrawal request. Our treasury team will review it shortly."
      details={details(props)}
      cta={{ label: "Track withdrawal", href: props.dashboardUrl ?? defaultDashboard() }}
    />
  );
}

WithdrawalSubmittedEmail.PreviewProps = {
  ...sampleBase,
  amount: "$1,250.00",
  referenceId: "WDR-2026-00193",
};

export function WithdrawalApprovedEmail(props: BaseProps) {
  return (
    <TransactionalEmail
      preview="Your withdrawal has been approved"
      heading="Withdrawal approved"
      badge={{ label: "Approved", tone: "success" }}
      name={props.name}
      intro="Your withdrawal request has been approved and is being processed by our treasury team."
      details={details(props)}
      cta={{ label: "View wallet", href: props.dashboardUrl ?? defaultDashboard() }}
    />
  );
}

WithdrawalApprovedEmail.PreviewProps = {
  ...sampleBase,
  amount: "$1,250.00",
  referenceId: "WDR-2026-00193",
};

export function WithdrawalCompletedEmail(props: BaseProps) {
  return (
    <TransactionalEmail
      preview="Your withdrawal has been completed"
      heading="Withdrawal completed"
      badge={{ label: "Completed", tone: "success" }}
      name={props.name}
      intro="Your withdrawal has been processed successfully. Funds should arrive according to your selected payment method."
      details={details(props)}
      cta={{ label: "View wallet", href: props.dashboardUrl ?? defaultDashboard() }}
    />
  );
}

WithdrawalCompletedEmail.PreviewProps = {
  ...sampleBase,
  amount: "$1,250.00",
  referenceId: "WDR-2026-00193",
};

export function WithdrawalRejectedEmail(props: BaseProps & { reason?: string }) {
  return (
    <TransactionalEmail
      preview="Your withdrawal could not be processed"
      heading="Withdrawal not approved"
      badge={{ label: "Not approved", tone: "danger" }}
      name={props.name}
      intro="We were unable to approve your withdrawal request."
      details={details(props, props.reason ? [{ label: "Reason", value: props.reason }] : [])}
      footerNote="Your available balance has not been affected. Contact support if you need assistance."
      cta={{ label: "Contact support", href: `mailto:info@uniqueskyway.com` }}
    />
  );
}

WithdrawalRejectedEmail.PreviewProps = {
  ...sampleBase,
  amount: "$1,250.00",
  referenceId: "WDR-2026-00193",
  reason: "Withdrawal details did not match the account on file.",
};

export function InvestmentActivatedEmail(
  props: BaseProps & { planName?: string },
) {
  return (
    <TransactionalEmail
      preview="Your investment is now active"
      heading="Investment activated"
      badge={{ label: "Active", tone: "success" }}
      name={props.name}
      intro="Your investment has been activated and is now earning returns according to your plan terms."
      details={details(props, props.planName ? [{ label: "Plan", value: props.planName }] : [])}
      cta={{ label: "View investment", href: props.dashboardUrl ?? defaultDashboard() }}
    />
  );
}

InvestmentActivatedEmail.PreviewProps = {
  ...sampleBase,
  planName: "Growth Portfolio — 12 months",
};

export function DailyRoiEmail(props: BaseProps & { roiAmount?: string }) {
  return (
    <TransactionalEmail
      preview="Daily ROI credited to your account"
      heading="Daily return credited"
      badge={{ label: "ROI credited", tone: "success" }}
      name={props.name}
      intro="Your investment earned a daily return which has been credited to your account and recorded in your ledger."
      details={details(props, props.roiAmount ? [{ label: "ROI credited", value: props.roiAmount, highlight: true }] : [])}
      cta={{ label: "View portfolio", href: props.dashboardUrl ?? defaultDashboard() }}
    />
  );
}

DailyRoiEmail.PreviewProps = {
  ...sampleBase,
  amount: "$5,000.00",
  roiAmount: "+$12.50",
};

export function InvestmentMaturedEmail(props: BaseProps & { planName?: string }) {
  return (
    <TransactionalEmail
      preview="Your investment has reached maturity"
      heading="Investment matured"
      badge={{ label: "Matured", tone: "neutral" }}
      name={props.name}
      intro="Your investment has reached its maturity date. You may reinvest or withdraw your returns from your dashboard."
      details={details(props, props.planName ? [{ label: "Plan", value: props.planName }] : [])}
      cta={{ label: "Manage portfolio", href: props.dashboardUrl ?? defaultDashboard() }}
    />
  );
}

InvestmentMaturedEmail.PreviewProps = {
  ...sampleBase,
  planName: "Growth Portfolio — 12 months",
};

export function ReinvestmentCompletedEmail(props: BaseProps & { planName?: string }) {
  return (
    <TransactionalEmail
      preview="Your reinvestment is complete"
      heading="Reinvestment completed"
      badge={{ label: "Reinvested", tone: "success" }}
      name={props.name}
      intro="Your reinvestment has been processed and your new investment position is now active."
      details={details(props, props.planName ? [{ label: "Plan", value: props.planName }] : [])}
      cta={{ label: "View portfolio", href: props.dashboardUrl ?? defaultDashboard() }}
    />
  );
}

ReinvestmentCompletedEmail.PreviewProps = {
  ...sampleBase,
  planName: "Growth Portfolio — 12 months",
};

export function ReferralCommissionEmail(
  props: BaseProps & { commissionAmount?: string },
) {
  return (
    <TransactionalEmail
      preview="You earned a referral commission"
      heading="Referral commission earned"
      badge={{ label: "Commission", tone: "success" }}
      name={props.name}
      intro="Congratulations! You earned a referral commission from a successful referral deposit."
      details={details(props, props.commissionAmount ? [{ label: "Commission", value: props.commissionAmount, highlight: true }] : [])}
      cta={{ label: "View referrals", href: `${defaultDashboard()}/referrals` }}
    />
  );
}

ReferralCommissionEmail.PreviewProps = {
  ...sampleBase,
  commissionAmount: "$50.00",
  referenceId: "REF-2026-00821",
};

export function BroadcastAnnouncementEmail(props: {
  name: string;
  title: string;
  body: string;
}) {
  return (
    <TransactionalEmail
      preview={props.title}
      heading={props.title}
      badge={{ label: "Announcement", tone: "neutral" }}
      name={props.name}
      intro={props.body}
      cta={{ label: "Open dashboard", href: defaultDashboard() }}
    />
  );
}

BroadcastAnnouncementEmail.PreviewProps = {
  name: "Alex Morgan",
  title: "Scheduled maintenance — July 8",
  body: "We will perform scheduled platform maintenance on July 8 from 2:00–4:00 AM UTC. Your funds remain secure and all balances are unaffected. The investor dashboard may be briefly unavailable during this window.",
};

export const financialPlainText = {
  depositSubmitted: (p: BaseProps) =>
    plainTransactionalEmail({
      heading: "Deposit submitted",
      name: p.name,
      intro: "We received your deposit request and our team is reviewing it.",
      details: details(p),
    }),
  depositApproved: (p: BaseProps) =>
    plainTransactionalEmail({
      heading: "Deposit approved",
      name: p.name,
      intro: "Your deposit has been approved and your investment is now active.",
      details: details(p),
    }),
  depositRejected: (p: BaseProps & { reason?: string }) =>
    plainTransactionalEmail({
      heading: "Deposit not approved",
      name: p.name,
      intro: "Unfortunately we were unable to approve your deposit.",
      details: details(p, p.reason ? [{ label: "Reason", value: p.reason }] : []),
    }),
  withdrawalSubmitted: (p: BaseProps) =>
    plainTransactionalEmail({
      heading: "Withdrawal submitted",
      name: p.name,
      intro: "We received your withdrawal request.",
      details: details(p),
    }),
  withdrawalApproved: (p: BaseProps) =>
    plainTransactionalEmail({
      heading: "Withdrawal approved",
      name: p.name,
      intro: "Your withdrawal request has been approved.",
      details: details(p),
    }),
  withdrawalCompleted: (p: BaseProps) =>
    plainTransactionalEmail({
      heading: "Withdrawal completed",
      name: p.name,
      intro: "Your withdrawal has been processed successfully.",
      details: details(p),
    }),
  withdrawalRejected: (p: BaseProps & { reason?: string }) =>
    plainTransactionalEmail({
      heading: "Withdrawal not approved",
      name: p.name,
      intro: "We were unable to approve your withdrawal request.",
      details: details(p, p.reason ? [{ label: "Reason", value: p.reason }] : []),
    }),
  investmentActivated: (p: BaseProps & { planName?: string }) =>
    plainTransactionalEmail({
      heading: "Investment activated",
      name: p.name,
      intro: "Your investment has been activated.",
      details: details(p, p.planName ? [{ label: "Plan", value: p.planName }] : []),
    }),
  dailyRoi: (p: BaseProps & { roiAmount?: string }) =>
    plainTransactionalEmail({
      heading: "Daily return credited",
      name: p.name,
      intro: "Your investment earned a daily return.",
      details: details(p, p.roiAmount ? [{ label: "ROI credited", value: p.roiAmount }] : []),
    }),
  investmentMatured: (p: BaseProps & { planName?: string }) =>
    plainTransactionalEmail({
      heading: "Investment matured",
      name: p.name,
      intro: "Your investment has reached maturity.",
      details: details(p, p.planName ? [{ label: "Plan", value: p.planName }] : []),
    }),
  reinvestmentCompleted: (p: BaseProps & { planName?: string }) =>
    plainTransactionalEmail({
      heading: "Reinvestment completed",
      name: p.name,
      intro: "Your reinvestment has been processed.",
      details: details(p, p.planName ? [{ label: "Plan", value: p.planName }] : []),
    }),
  referralCommission: (p: BaseProps & { commissionAmount?: string }) =>
    plainTransactionalEmail({
      heading: "Referral commission earned",
      name: p.name,
      intro: "You earned a referral commission.",
      details: details(p, p.commissionAmount ? [{ label: "Commission", value: p.commissionAmount }] : []),
    }),
  broadcast: (p: { name: string; title: string; body: string }) =>
    plainTransactionalEmail({
      heading: p.title,
      name: p.name,
      intro: p.body,
    }),
};
