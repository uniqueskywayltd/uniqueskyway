export type PayoutExecutionInput = {
  payoutId: string;
  withdrawalId: string;
  amount: string;
  currency: string;
  destination: Record<string, unknown>;
};

export type PayoutExecutionResult = {
  success: boolean;
  externalReference?: string;
  failureReason?: string;
};

/**
 * Provider abstraction — future automated payout integrations plug in here.
 */
export interface PayoutProvider {
  readonly slug: string;
  readonly type: "manual" | "api";
  executePayout(input: PayoutExecutionInput): Promise<PayoutExecutionResult>;
}

export class ManualPayoutProvider implements PayoutProvider {
  readonly slug = "manual";
  readonly type = "manual" as const;

  executePayout(input: PayoutExecutionInput): Promise<PayoutExecutionResult> {
    void input;
    return Promise.resolve({ success: true });
  }
}

export const payoutProviders: Record<string, PayoutProvider> = {
  manual: new ManualPayoutProvider(),
};

export function getPayoutProvider(slug: string): PayoutProvider {
  return payoutProviders[slug] ?? payoutProviders.manual;
}
