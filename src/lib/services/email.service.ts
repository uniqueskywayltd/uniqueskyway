import type { ReactElement } from "react";
import { render } from "@react-email/components";
import { Resend } from "resend";
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
  financialPlainText,
} from "@/emails/financial";
import LoginAlertEmail from "@/emails/login-alert";
import NewDeviceLoginEmail from "@/emails/new-device-login";
import PasswordChangedEmail from "@/emails/password-changed";
import PasswordResetEmail from "@/emails/password-reset";
import VerifyEmail from "@/emails/verify-email";
import WelcomeEmail from "@/emails/welcome";
import { brand } from "@/emails/components/layout";
import { logger } from "@/lib/logging/logger";

const FROM =
  process.env.EMAIL_FROM ?? `Unique Sky Way <${brand.email}>`;

function getResend(): Resend | null {
  const key = process.env.RESEND_API_KEY;
  if (!key) return null;
  return new Resend(key);
}

type SendResult = { sent: boolean; error?: string };

export class EmailService {
  private async send(
    to: string,
    subject: string,
    html: string,
    text: string,
  ): Promise<SendResult> {
    const resend = getResend();
    if (!resend) {
      logger.warn("email", "RESEND_API_KEY not set — email skipped", { subject, to });
      return { sent: false, error: "EMAIL_NOT_CONFIGURED" };
    }

    const { error } = await resend.emails.send({
      from: FROM,
      to,
      subject,
      html,
      text,
    });

    if (error) {
      logger.error("email", "Send failed", { subject, to, error: error.message });
      return { sent: false, error: error.message };
    }

    logger.info("email", "Email sent", { subject, to });
    return { sent: true };
  }

  private async renderPair(
    component: ReactElement,
    plain: string,
  ): Promise<{ html: string; text: string }> {
    const html = await render(component);
    return { html, text: plain };
  }

  async sendWelcome(params: {
    to: string;
    name: string;
    verifyUrl: string;
  }): Promise<SendResult> {
    const { html, text } = await this.renderPair(
      WelcomeEmail({ name: params.name, verifyUrl: params.verifyUrl }),
      `Welcome to ${brand.name}\n\nHello ${params.name},\n\nVerify your email: ${params.verifyUrl}\n\nSupport: ${brand.email}`,
    );
    return this.send(params.to, `Welcome to ${brand.name}`, html, text);
  }

  async sendVerification(params: {
    to: string;
    name: string;
    verifyUrl: string;
  }): Promise<SendResult> {
    const { html, text } = await this.renderPair(
      VerifyEmail({ name: params.name, verifyUrl: params.verifyUrl }),
      `Verify your ${brand.name} email\n\n${params.verifyUrl}\n\nSupport: ${brand.email}`,
    );
    return this.send(params.to, `Verify your ${brand.name} email`, html, text);
  }

  async sendPasswordReset(params: {
    to: string;
    name: string;
    resetUrl: string;
  }): Promise<SendResult> {
    const { html, text } = await this.renderPair(
      PasswordResetEmail({ name: params.name, resetUrl: params.resetUrl }),
      `Reset your ${brand.name} password\n\n${params.resetUrl}\n\nSupport: ${brand.email}`,
    );
    return this.send(params.to, `Reset your ${brand.name} password`, html, text);
  }

  async sendPasswordChanged(params: {
    to: string;
    name: string;
    changedAt: string;
  }): Promise<SendResult> {
    const { html, text } = await this.renderPair(
      PasswordChangedEmail({ name: params.name, changedAt: params.changedAt }),
      `Your ${brand.name} password was changed at ${params.changedAt}.\n\nSupport: ${brand.email}`,
    );
    return this.send(params.to, `Your ${brand.name} password was changed`, html, text);
  }

  async sendLoginAlert(params: {
    to: string;
    name: string;
    ipAddress: string;
    browser: string;
    os: string;
    loginTime: string;
  }): Promise<SendResult> {
    const { html, text } = await this.renderPair(
      LoginAlertEmail(params),
      `New sign-in to ${brand.name}\nTime: ${params.loginTime}\nIP: ${params.ipAddress}\nDevice: ${params.browser} on ${params.os}`,
    );
    return this.send(params.to, `New sign-in to ${brand.name}`, html, text);
  }

  async sendNewDeviceLogin(params: {
    to: string;
    name: string;
    ipAddress: string;
    browser: string;
    os: string;
    loginTime: string;
    sessionsUrl: string;
  }): Promise<SendResult> {
    const { html, text } = await this.renderPair(
      NewDeviceLoginEmail(params),
      `New device sign-in\n${params.sessionsUrl}\n\nSupport: ${brand.email}`,
    );
    return this.send(params.to, `New device sign-in — ${brand.name}`, html, text);
  }

  async sendDepositSubmitted(p: Parameters<typeof DepositSubmittedEmail>[0] & { to: string }) {
    const { to, ...props } = p;
    const { html, text } = await this.renderPair(
      DepositSubmittedEmail(props),
      financialPlainText.depositSubmitted(props),
    );
    return this.send(to, `Deposit submitted — ${brand.name}`, html, text);
  }

  async sendDepositApproved(p: Parameters<typeof DepositApprovedEmail>[0] & { to: string }) {
    const { to, ...props } = p;
    const { html, text } = await this.renderPair(
      DepositApprovedEmail(props),
      financialPlainText.depositApproved(props),
    );
    return this.send(to, `Deposit approved — ${brand.name}`, html, text);
  }

  async sendDepositRejected(p: Parameters<typeof DepositRejectedEmail>[0] & { to: string }) {
    const { to, ...props } = p;
    const { html, text } = await this.renderPair(
      DepositRejectedEmail(props),
      financialPlainText.depositRejected(props),
    );
    return this.send(to, `Deposit update — ${brand.name}`, html, text);
  }

  async sendWithdrawalSubmitted(p: Parameters<typeof WithdrawalSubmittedEmail>[0] & { to: string }) {
    const { to, ...props } = p;
    const { html, text } = await this.renderPair(
      WithdrawalSubmittedEmail(props),
      financialPlainText.withdrawalSubmitted(props),
    );
    return this.send(to, `Withdrawal submitted — ${brand.name}`, html, text);
  }

  async sendWithdrawalApproved(p: Parameters<typeof WithdrawalApprovedEmail>[0] & { to: string }) {
    const { to, ...props } = p;
    const { html, text } = await this.renderPair(
      WithdrawalApprovedEmail(props),
      financialPlainText.withdrawalApproved(props),
    );
    return this.send(to, `Withdrawal approved — ${brand.name}`, html, text);
  }

  async sendWithdrawalCompleted(p: Parameters<typeof WithdrawalCompletedEmail>[0] & { to: string }) {
    const { to, ...props } = p;
    const { html, text } = await this.renderPair(
      WithdrawalCompletedEmail(props),
      financialPlainText.withdrawalCompleted(props),
    );
    return this.send(to, `Withdrawal completed — ${brand.name}`, html, text);
  }

  async sendWithdrawalRejected(p: Parameters<typeof WithdrawalRejectedEmail>[0] & { to: string }) {
    const { to, ...props } = p;
    const { html, text } = await this.renderPair(
      WithdrawalRejectedEmail(props),
      financialPlainText.withdrawalRejected(props),
    );
    return this.send(to, `Withdrawal update — ${brand.name}`, html, text);
  }

  async sendInvestmentActivated(p: Parameters<typeof InvestmentActivatedEmail>[0] & { to: string }) {
    const { to, ...props } = p;
    const { html, text } = await this.renderPair(
      InvestmentActivatedEmail(props),
      financialPlainText.investmentActivated(props),
    );
    return this.send(to, `Investment activated — ${brand.name}`, html, text);
  }

  async sendDailyRoi(p: Parameters<typeof DailyRoiEmail>[0] & { to: string }) {
    const { to, ...props } = p;
    const { html, text } = await this.renderPair(
      DailyRoiEmail(props),
      financialPlainText.dailyRoi(props),
    );
    return this.send(to, `Daily return credited — ${brand.name}`, html, text);
  }

  async sendInvestmentMatured(p: Parameters<typeof InvestmentMaturedEmail>[0] & { to: string }) {
    const { to, ...props } = p;
    const { html, text } = await this.renderPair(
      InvestmentMaturedEmail(props),
      financialPlainText.investmentMatured(props),
    );
    return this.send(to, `Investment matured — ${brand.name}`, html, text);
  }

  async sendReinvestmentCompleted(p: Parameters<typeof ReinvestmentCompletedEmail>[0] & { to: string }) {
    const { to, ...props } = p;
    const { html, text } = await this.renderPair(
      ReinvestmentCompletedEmail(props),
      financialPlainText.reinvestmentCompleted(props),
    );
    return this.send(to, `Reinvestment completed — ${brand.name}`, html, text);
  }

  async sendReferralCommission(p: Parameters<typeof ReferralCommissionEmail>[0] & { to: string }) {
    const { to, ...props } = p;
    const { html, text } = await this.renderPair(
      ReferralCommissionEmail(props),
      financialPlainText.referralCommission(props),
    );
    return this.send(to, `Referral commission earned — ${brand.name}`, html, text);
  }

  async sendBroadcast(p: { to: string; name: string; title: string; body: string }) {
    const { to, ...props } = p;
    const { html, text } = await this.renderPair(
      BroadcastAnnouncementEmail(props),
      financialPlainText.broadcast(props),
    );
    return this.send(to, props.title, html, text);
  }

  async sendForEventType(
    eventType: string,
    to: string,
    payload: Record<string, unknown>,
  ): Promise<SendResult> {
    const name = String(payload.name ?? payload.fullName ?? "Investor");
    const amount = payload.amount ? String(payload.amount) : undefined;
    const referenceId = payload.referenceId ? String(payload.referenceId) : undefined;
    const reason = payload.reason ? String(payload.reason) : undefined;
    const planName = payload.planName ? String(payload.planName) : undefined;
    const base = { name, amount, referenceId };

    switch (eventType) {
      case "deposit.submitted":
        return this.sendDepositSubmitted({ to, ...base });
      case "deposit.approved":
        return this.sendDepositApproved({ to, ...base });
      case "deposit.rejected":
        return this.sendDepositRejected({ to, ...base, reason });
      case "withdrawal.submitted":
        return this.sendWithdrawalSubmitted({ to, ...base });
      case "withdrawal.approved":
        return this.sendWithdrawalApproved({ to, ...base });
      case "withdrawal.completed":
        return this.sendWithdrawalCompleted({ to, ...base });
      case "withdrawal.rejected":
        return this.sendWithdrawalRejected({ to, ...base, reason });
      case "investment.activated":
        return this.sendInvestmentActivated({ to, ...base, planName });
      case "investment.roi_accrued":
        return this.sendDailyRoi({
          to,
          ...base,
          roiAmount: payload.roiAmount ? String(payload.roiAmount) : amount,
        });
      case "investment.matured":
        return this.sendInvestmentMatured({ to, ...base, planName });
      case "investment.reinvested":
        return this.sendReinvestmentCompleted({ to, ...base, planName });
      case "referral.commission":
        return this.sendReferralCommission({
          to,
          ...base,
          commissionAmount: payload.commissionAmount ? String(payload.commissionAmount) : amount,
        });
      case "admin.broadcast":
        return this.sendBroadcast({
          to,
          name,
          title: String(payload.title ?? "Announcement"),
          body: String(payload.body ?? ""),
        });
      default:
        return { sent: false, error: "UNKNOWN_EVENT_TYPE" };
    }
  }
}

export const emailService = new EmailService();
