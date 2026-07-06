import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { getDbSafe } from "@/db";
import { adminUsers, profiles } from "@/db/schema";
import { and, eq, isNull } from "drizzle-orm";
import type { AdminRole, UserStatus } from "@/types/domain";

export type SessionUser = {
  authUserId: string;
  email: string;
  emailVerified: boolean;
};

export type CustomerProfile = {
  id: string;
  authUserId: string;
  email: string;
  fullName: string;
  username: string;
  status: UserStatus;
  emailVerified: boolean;
  referralCode: string;
  avatarPath: string | null;
};

export type AdminProfile = {
  id: string;
  authUserId: string;
  email: string;
  fullName: string;
  role: AdminRole;
  isActive: boolean;
};

export async function getSessionUser(): Promise<SessionUser | null> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user?.email) return null;

    return {
      authUserId: data.user.id,
      email: data.user.email,
      emailVerified: Boolean(data.user.email_confirmed_at),
    };
  } catch {
    return null;
  }
}

const profileSelect = {
  id: profiles.id,
  authUserId: profiles.authUserId,
  email: profiles.email,
  fullName: profiles.fullName,
  username: profiles.username,
  status: profiles.status,
  emailVerified: profiles.emailVerified,
  referralCode: profiles.referralCode,
  avatarPath: profiles.avatarPath,
};

export async function getCustomerProfile(
  authUserId: string,
): Promise<CustomerProfile | null> {
  const db = getDbSafe();
  if (!db) return null;

  const [profile] = await db
    .select(profileSelect)
    .from(profiles)
    .where(and(eq(profiles.authUserId, authUserId), isNull(profiles.deletedAt)))
    .limit(1);

  return profile ?? null;
}

export async function getCustomerProfileById(
  profileId: string,
): Promise<CustomerProfile | null> {
  const db = getDbSafe();
  if (!db) return null;

  const [profile] = await db
    .select(profileSelect)
    .from(profiles)
    .where(and(eq(profiles.id, profileId), isNull(profiles.deletedAt)))
    .limit(1);

  return profile ?? null;
}

export async function getAdminProfile(
  authUserId: string,
): Promise<AdminProfile | null> {
  const db = getDbSafe();
  if (!db) return null;

  const [admin] = await db
    .select({
      id: adminUsers.id,
      authUserId: adminUsers.authUserId,
      email: adminUsers.email,
      fullName: adminUsers.fullName,
      role: adminUsers.role,
      isActive: adminUsers.isActive,
    })
    .from(adminUsers)
    .where(
      and(
        eq(adminUsers.authUserId, authUserId),
        eq(adminUsers.isActive, true),
        isNull(adminUsers.deletedAt),
      ),
    )
    .limit(1);

  return admin ?? null;
}

export async function signOutAllSessions(authUserId: string): Promise<void> {
  const admin = createAdminClient();
  await admin.auth.admin.signOut(authUserId, "global");
}
