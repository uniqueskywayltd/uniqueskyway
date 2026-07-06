import { desc, eq } from "drizzle-orm";
import type { InvestmentEventType } from "@/types/domain";
import { getDb } from "@/db";
import { investmentEvents } from "@/db/schema";
import { fail, ok } from "./base";
import type { ServiceResult } from "./types";

export type InvestmentEventView = {
  id: string;
  investmentId: string;
  eventType: InvestmentEventType;
  title: string;
  description: string | null;
  amount: string | null;
  metadata: Record<string, unknown>;
  createdAt: Date;
};

export class InvestmentEventService {
  async record(input: {
    investmentId: string;
    profileId: string;
    eventType: InvestmentEventType;
    title: string;
    description?: string;
    amount?: string;
    metadata?: Record<string, unknown>;
  }): Promise<ServiceResult<{ id: string }>> {
    try {
      const db = getDb();
      const [event] = await db
        .insert(investmentEvents)
        .values({
          investmentId: input.investmentId,
          profileId: input.profileId,
          eventType: input.eventType,
          title: input.title,
          description: input.description,
          amount: input.amount,
          metadata: input.metadata ?? {},
        })
        .returning({ id: investmentEvents.id });
      return ok({ id: event.id });
    } catch (error) {
      return fail("INVESTMENT_EVENT_ERROR", "Failed to record investment event", error);
    }
  }

  async listForInvestment(investmentId: string): Promise<ServiceResult<InvestmentEventView[]>> {
    try {
      const db = getDb();
      const rows = await db
        .select()
        .from(investmentEvents)
        .where(eq(investmentEvents.investmentId, investmentId))
        .orderBy(desc(investmentEvents.createdAt));

      return ok(
        rows.map((r) => ({
          id: r.id,
          investmentId: r.investmentId,
          eventType: r.eventType as InvestmentEventType,
          title: r.title,
          description: r.description,
          amount: r.amount,
          metadata: (r.metadata as Record<string, unknown>) ?? {},
          createdAt: r.createdAt,
        })),
      );
    } catch (error) {
      return fail("INVESTMENT_EVENT_LIST_ERROR", "Failed to load timeline", error);
    }
  }
}

export const investmentEventService = new InvestmentEventService();
