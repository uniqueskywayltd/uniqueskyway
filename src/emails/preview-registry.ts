import type { ReactElement } from "react";
import WelcomeEmail from "@/emails/welcome";
import VerifyEmail from "@/emails/verify-email";
import PasswordResetEmail from "@/emails/password-reset";
import PasswordChangedEmail from "@/emails/password-changed";
import LoginAlertEmail from "@/emails/login-alert";
import NewDeviceLoginEmail from "@/emails/new-device-login";
import {
  BroadcastAnnouncementEmail,
  DailyRoiEmail,
  DepositApprovedEmail,
  DepositRejectedEmail,
  DepositSubmittedEmail,
  InvestmentActivatedEmail,
  InvestmentMaturedEmail,
  ReferralCommissionEmail,
  ReinvestmentCompletedEmail,
  WithdrawalApprovedEmail,
  WithdrawalCompletedEmail,
  WithdrawalRejectedEmail,
  WithdrawalSubmittedEmail,
} from "@/emails/financial";

export type EmailPreviewEntry = {
  id: string;
  label: string;
  category: "Account" | "Security" | "Financial" | "Platform";
  element: ReactElement;
};

export const emailPreviewRegistry: EmailPreviewEntry[] = [
  {
    id: "welcome",
    label: "Welcome",
    category: "Account",
    element: WelcomeEmail(WelcomeEmail.PreviewProps),
  },
  {
    id: "verify-email",
    label: "Verify email",
    category: "Account",
    element: VerifyEmail(VerifyEmail.PreviewProps),
  },
  {
    id: "password-reset",
    label: "Password reset",
    category: "Security",
    element: PasswordResetEmail(PasswordResetEmail.PreviewProps),
  },
  {
    id: "password-changed",
    label: "Password changed",
    category: "Security",
    element: PasswordChangedEmail(PasswordChangedEmail.PreviewProps),
  },
  {
    id: "login-alert",
    label: "Login alert",
    category: "Security",
    element: LoginAlertEmail(LoginAlertEmail.PreviewProps),
  },
  {
    id: "new-device-login",
    label: "New device login",
    category: "Security",
    element: NewDeviceLoginEmail(NewDeviceLoginEmail.PreviewProps),
  },
  {
    id: "deposit-submitted",
    label: "Deposit submitted",
    category: "Financial",
    element: DepositSubmittedEmail(DepositSubmittedEmail.PreviewProps),
  },
  {
    id: "deposit-approved",
    label: "Deposit approved",
    category: "Financial",
    element: DepositApprovedEmail(DepositApprovedEmail.PreviewProps),
  },
  {
    id: "deposit-rejected",
    label: "Deposit rejected",
    category: "Financial",
    element: DepositRejectedEmail(DepositRejectedEmail.PreviewProps),
  },
  {
    id: "withdrawal-submitted",
    label: "Withdrawal submitted",
    category: "Financial",
    element: WithdrawalSubmittedEmail(WithdrawalSubmittedEmail.PreviewProps),
  },
  {
    id: "withdrawal-approved",
    label: "Withdrawal approved",
    category: "Financial",
    element: WithdrawalApprovedEmail(WithdrawalApprovedEmail.PreviewProps),
  },
  {
    id: "withdrawal-completed",
    label: "Withdrawal completed",
    category: "Financial",
    element: WithdrawalCompletedEmail(WithdrawalCompletedEmail.PreviewProps),
  },
  {
    id: "withdrawal-rejected",
    label: "Withdrawal rejected",
    category: "Financial",
    element: WithdrawalRejectedEmail(WithdrawalRejectedEmail.PreviewProps),
  },
  {
    id: "investment-activated",
    label: "Investment activated",
    category: "Financial",
    element: InvestmentActivatedEmail(InvestmentActivatedEmail.PreviewProps),
  },
  {
    id: "daily-roi",
    label: "Daily ROI",
    category: "Financial",
    element: DailyRoiEmail(DailyRoiEmail.PreviewProps),
  },
  {
    id: "investment-matured",
    label: "Investment matured",
    category: "Financial",
    element: InvestmentMaturedEmail(InvestmentMaturedEmail.PreviewProps),
  },
  {
    id: "reinvestment-completed",
    label: "Reinvestment completed",
    category: "Financial",
    element: ReinvestmentCompletedEmail(ReinvestmentCompletedEmail.PreviewProps),
  },
  {
    id: "referral-commission",
    label: "Referral commission",
    category: "Financial",
    element: ReferralCommissionEmail(ReferralCommissionEmail.PreviewProps),
  },
  {
    id: "broadcast",
    label: "Broadcast announcement",
    category: "Platform",
    element: BroadcastAnnouncementEmail(BroadcastAnnouncementEmail.PreviewProps),
  },
];
