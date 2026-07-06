import { randomBytes } from "node:crypto";
import { and, eq, inArray } from "drizzle-orm";
import { getDb } from "@/db";
import {
  depositRequests,
  investmentPlans,
  investments,
  ledgerAccounts,
  ledgerEntries,
  legacyTransactionsArchive,
  migrationIdempotency,
  migrationRuns,
  notificationPreferences,
  profilePreferences,
  profiles,
  referralCommissions,
  referralRelationships,
  withdrawalRequests,
} from "@/db/schema";
import { MIGRATION_BATCH_SIZE } from "@/lib/migration/constants";
import { migrationIdempotencyKey } from "@/lib/migration/transform-rules";
import type { MigrationTransformResult } from "@/lib/migration/types";
import { createAdminClient } from "@/lib/supabase/admin";
import { migrationImageService } from "./migration-image.service";

type LoadOptions = {
  skipImages?: boolean;
  batchSize?: number;
};

export class MigrationLoadService {
  async loadAll(
    runId: string,
    data: MigrationTransformResult,
    options: LoadOptions = {},
  ): Promise<Record<string, unknown>> {
    const batchSize = options.batchSize ?? MIGRATION_BATCH_SIZE;
    const profileMap = await this.loadUsers(runId, data, batchSize);

    await this.loadArchive(runId, data, batchSize);
    await this.linkReferrals(runId, data, profileMap);
    await this.loadInvestments(runId, data, profileMap, batchSize);
    await this.loadFinancialRecords(runId, data, profileMap, batchSize);

    let imagesLoaded = 0;
    let imagesFailed = 0;
    if (!options.skipImages) {
      const imageResult = await migrationImageService.migrateImages(
        runId,
        data.users,
        profileMap,
      );
      imagesLoaded = imageResult.loaded;
      imagesFailed = imageResult.failed;
    }

    const db = getDb();
    await db
      .update(migrationRuns)
      .set({
        stats: {
          usersLoaded: data.users.length,
          transactionsLoaded: data.ledgerEntries.length,
          investmentsLoaded: data.investments.length,
          referralsLoaded: data.referralRelationships.length,
          ledgerEntriesLoaded: data.ledgerEntries.length,
          imagesLoaded,
          imagesFailed,
        },
      })
      .where(eq(migrationRuns.id, runId));

    return {
      usersLoaded: data.users.length,
      ledgerEntriesLoaded: data.ledgerEntries.length,
      investmentsLoaded: data.investments.length,
      imagesLoaded,
      imagesFailed,
    };
  }

  private async loadUsers(
    runId: string,
    data: MigrationTransformResult,
    batchSize: number,
  ): Promise<Map<string, string>> {
    const profileMap = new Map<string, string>();
    const admin = createAdminClient();
    const db = getDb();

    for (let i = 0; i < data.users.length; i += batchSize) {
      const batch = data.users.slice(i, i + batchSize);
      for (const user of batch) {
        const idemKey = migrationIdempotencyKey("user", user.legacyUserId);
        const existing = await this.getIdempotency(idemKey);
        if (existing?.newEntityId) {
          profileMap.set(user.email, existing.newEntityId);
          continue;
        }

        const [existingProfile] = await db
          .select({ id: profiles.id })
          .from(profiles)
          .where(eq(profiles.legacyUserId, user.legacyUserId))
          .limit(1);

        if (existingProfile) {
          profileMap.set(user.email, existingProfile.id);
          await this.recordIdempotency(runId, "user", user.legacyUserId, existingProfile.id, idemKey);
          continue;
        }

        const tempPassword = randomBytes(24).toString("base64url");
        const { data: authData, error } = await admin.auth.admin.createUser({
          email: user.email,
          password: tempPassword,
          email_confirm: true,
          user_metadata: {
            full_name: user.fullName,
            username: user.username,
            legacy_user_id: user.legacyUserId,
            password_reset_required: true,
            migrated: true,
          },
        });

        if (error || !authData.user) {
          throw new Error(`Auth create failed for ${user.email}: ${error?.message}`);
        }

        const [profile] = await db
          .insert(profiles)
          .values({
            authUserId: authData.user.id,
            legacyUserId: user.legacyUserId,
            email: user.email,
            fullName: user.fullName,
            username: user.username,
            referralCode: user.referralCode,
            status: user.status,
            emailVerified: true,
            createdAt: user.registeredAt,
          })
          .returning({ id: profiles.id });

        await db.insert(profilePreferences).values({
          profileId: profile.id,
        });
        await db.insert(notificationPreferences).values({
          profileId: profile.id,
        });

        for (const accountType of ["available", "invested", "pending_withdrawal"] as const) {
          await db.insert(ledgerAccounts).values({
            profileId: profile.id,
            accountType,
            currency: "USD",
            label: accountType,
          });
        }

        profileMap.set(user.email, profile.id);
        await this.recordIdempotency(runId, "user", user.legacyUserId, profile.id, idemKey);
      }
    }

    return profileMap;
  }

  private async linkReferrals(
    runId: string,
    data: MigrationTransformResult,
    profileMap: Map<string, string>,
  ) {
    const db = getDb();
    const usernameToProfile = new Map<string, string>();

    for (const [email, profileId] of profileMap) {
      const user = data.users.find((u) => u.email === email);
      if (user) usernameToProfile.set(user.username.toLowerCase(), profileId);
    }

    for (const rel of data.referralRelationships) {
      const referredId = profileMap.get(rel.referredEmail);
      const referrerId = usernameToProfile.get(rel.referrerUsername.toLowerCase());
      if (!referredId || !referrerId) continue;

      const idemKey = `legacy-m9:referral-rel:${referredId}`;
      const existing = await this.getIdempotency(idemKey);
      if (existing) continue;

      await db
        .insert(referralRelationships)
        .values({
          referrerProfileId: referrerId,
          referredProfileId: referredId,
          referralCodeUsed: rel.referralCodeUsed,
        })
        .onConflictDoNothing();

      await db
        .update(profiles)
        .set({ referredByProfileId: referrerId })
        .where(eq(profiles.id, referredId));

      await this.recordIdempotency(runId, "referral_rel", 0, referredId, idemKey);
    }
  }

  private async loadArchive(
    runId: string,
    data: MigrationTransformResult,
    batchSize: number,
  ) {
    const db = getDb();
    for (let i = 0; i < data.archiveRows.length; i += batchSize) {
      const batch = data.archiveRows.slice(i, i + batchSize);
      for (const row of batch) {
        const legacyId = row.legacyTransactionId as number;
        const idemKey = migrationIdempotencyKey("archive", legacyId);
        if (await this.getIdempotency(idemKey)) continue;

        await db
          .insert(legacyTransactionsArchive)
          .values({
            legacyTransactionId: legacyId,
            legacyUserId: String(row.legacyUserId ?? ""),
            email: String(row.email ?? ""),
            plan: String(row.plan ?? ""),
            type: String(row.type ?? ""),
            method: String(row.method ?? ""),
            amount: String(row.amount ?? "0"),
            externalRef: String(row.externalRef ?? ""),
            interest: String(row.interest ?? "0"),
            address: String(row.address ?? ""),
            network: String(row.network ?? ""),
            confirm: Number(row.confirm ?? 0),
            complete: Number(row.complete ?? 0),
            legacyCreatedAt: String(row.legacyCreatedAt ?? ""),
            legacyUpdatedAt: String(row.legacyUpdatedAt ?? ""),
            rawPayload: row.rawPayload as Record<string, unknown>,
          })
          .onConflictDoNothing();

        await this.recordIdempotency(runId, "archive", legacyId, null, idemKey);
      }
    }
  }

  private async loadInvestments(
    runId: string,
    data: MigrationTransformResult,
    profileMap: Map<string, string>,
    batchSize: number,
  ) {
    const db = getDb();
    const planRows = await db.select().from(investmentPlans);
    const planBySlug = new Map(planRows.map((p) => [p.slug, p.id]));

    for (let i = 0; i < data.investments.length; i += batchSize) {
      const batch = data.investments.slice(i, i + batchSize);
      for (const inv of batch) {
        const profileId = profileMap.get(inv.email);
        if (!profileId) continue;

        const idemKey = migrationIdempotencyKey("investment", inv.legacyTransactionId);
        if (await this.getIdempotency(idemKey)) continue;

        const planId = planBySlug.get(inv.planSlug);
        if (!planId) continue;

        const [investment] = await db
          .insert(investments)
          .values({
            profileId,
            planId,
            legacyTransactionId: inv.legacyTransactionId,
            principalAmount: inv.principalAmount,
            accruedInterest: inv.accruedInterest,
            status: inv.status,
            paymentMethod: inv.paymentMethod,
            externalTransactionRef: inv.externalTransactionRef,
            startedAt: inv.startedAt,
            activatedAt: inv.startedAt,
            lastAccrualAt: inv.startedAt,
            totalRoiCredited: inv.accruedInterest,
          })
          .returning({ id: investments.id });

        await this.recordIdempotency(
          runId,
          "investment",
          inv.legacyTransactionId,
          investment.id,
          idemKey,
        );
      }
    }
  }

  private async loadFinancialRecords(
    runId: string,
    data: MigrationTransformResult,
    profileMap: Map<string, string>,
    batchSize: number,
  ) {
    const db = getDb();

    for (let i = 0; i < data.ledgerEntries.length; i += batchSize) {
      const batch = data.ledgerEntries.slice(i, i + batchSize);
      for (const entry of batch) {
        const profileId = profileMap.get(entry.email);
        if (!profileId) continue;

        if (await this.getIdempotency(entry.idempotencyKey)) continue;

        const [account] = await db
          .select({ id: ledgerAccounts.id })
          .from(ledgerAccounts)
          .where(
            and(
              eq(ledgerAccounts.profileId, profileId),
              eq(ledgerAccounts.accountType, entry.accountType),
            ),
          )
          .limit(1);

        if (!account) continue;

        const [ledgerEntry] = await db
          .insert(ledgerEntries)
          .values({
            accountId: account.id,
            direction: entry.direction,
            amount: entry.amount,
            entryType: entry.entryType,
            idempotencyKey: entry.idempotencyKey,
            legacyTransactionId: entry.legacyTransactionId,
            description: entry.description,
            metadata: JSON.stringify(entry.metadata),
            createdAt: entry.occurredAt,
          })
          .returning({ id: ledgerEntries.id });

        await this.recordIdempotency(
          runId,
          "ledger",
          entry.legacyTransactionId,
          ledgerEntry.id,
          entry.idempotencyKey,
        );
      }
    }

    for (const commission of data.referralCommissions) {
      const referrerId = profileMap.get(commission.referrerEmail);
      const referredId = profileMap.get(commission.referredEmail);
      if (!referrerId || !referredId) continue;

      const idemKey = migrationIdempotencyKey("referral-commission", commission.legacyTransactionId);
      if (await this.getIdempotency(idemKey)) continue;

      await db
        .insert(referralCommissions)
        .values({
          referrerProfileId: referrerId,
          referredProfileId: referredId,
          commissionPercent: "10.0000",
          commissionAmount: commission.amount,
          legacyTransactionId: commission.legacyTransactionId,
          idempotencyKey: idemKey,
          status: "paid",
          createdAt: commission.occurredAt,
        })
        .onConflictDoNothing();

      await this.recordIdempotency(
        runId,
        "referral_commission",
        commission.legacyTransactionId,
        referrerId,
        idemKey,
      );
    }
  }

  async rollbackRun(runId: string): Promise<number> {
    const db = getDb();
    const idemRows = await db
      .select()
      .from(migrationIdempotency)
      .where(eq(migrationIdempotency.runId, runId));

    const profileIds = idemRows
      .filter((r) => r.entityType === "user" && r.newEntityId)
      .map((r) => r.newEntityId!);

    if (!profileIds.length) return 0;

    const admin = createAdminClient();

    const accountRows = await db
      .select({ id: ledgerAccounts.id })
      .from(ledgerAccounts)
      .where(inArray(ledgerAccounts.profileId, profileIds));
    const accountIds = accountRows.map((a) => a.id);

    if (accountIds.length) {
      await db
        .delete(ledgerEntries)
        .where(inArray(ledgerEntries.accountId, accountIds));
    }

    await db.delete(referralCommissions).where(
      inArray(referralCommissions.referrerProfileId, profileIds),
    );
    await db.delete(referralRelationships).where(
      inArray(referralRelationships.referredProfileId, profileIds),
    );
    await db.delete(investments).where(inArray(investments.profileId, profileIds));
    await db.delete(depositRequests).where(inArray(depositRequests.profileId, profileIds));
    await db.delete(withdrawalRequests).where(inArray(withdrawalRequests.profileId, profileIds));
    await db.delete(ledgerAccounts).where(inArray(ledgerAccounts.profileId, profileIds));
    await db.delete(notificationPreferences).where(
      inArray(notificationPreferences.profileId, profileIds),
    );
    await db.delete(profilePreferences).where(
      inArray(profilePreferences.profileId, profileIds),
    );

    const authUsers = await db
      .select({ authUserId: profiles.authUserId })
      .from(profiles)
      .where(inArray(profiles.id, profileIds));

    await db.delete(profiles).where(inArray(profiles.id, profileIds));

    for (const { authUserId } of authUsers) {
      await admin.auth.admin.deleteUser(authUserId).catch(() => {});
    }

    await db.delete(migrationIdempotency).where(eq(migrationIdempotency.runId, runId));

    return profileIds.length;
  }

  private async getIdempotency(key: string) {
    const db = getDb();
    const [row] = await db
      .select()
      .from(migrationIdempotency)
      .where(eq(migrationIdempotency.idempotencyKey, key))
      .limit(1);
    return row ?? null;
  }

  private async recordIdempotency(
    runId: string,
    entityType: string,
    legacyId: number,
    newEntityId: string | null,
    idempotencyKey: string,
  ) {
    const db = getDb();
    await db
      .insert(migrationIdempotency)
      .values({
        runId,
        entityType,
        legacyId,
        newEntityId,
        idempotencyKey,
      })
      .onConflictDoNothing();
  }
}

export const migrationLoadService = new MigrationLoadService();
