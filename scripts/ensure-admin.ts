import { config } from "dotenv";
import { eq } from "drizzle-orm";
import { getDb } from "../src/db";
import { adminUsers } from "../src/db/schema";
import { createAdminClient } from "../src/lib/supabase/admin";

config({ path: ".env.production.local" });
config({ path: ".env.local" });
config();

/**
 * Ensure a super admin exists with the given credentials.
 * Usage: npx tsx scripts/ensure-admin.ts --email=... --password=... --name="..."
 */
async function main() {
  const args = process.argv.slice(2);
  const email = args.find((a) => a.startsWith("--email="))?.split("=")[1]?.toLowerCase();
  const password = args.find((a) => a.startsWith("--password="))?.split("=")[1];
  const name = args.find((a) => a.startsWith("--name="))?.split("=")[1] ?? "Super Admin";

  if (!email || !password) {
    console.error("Usage: npx tsx scripts/ensure-admin.ts --email=... --password=... --name=\"...\"");
    process.exit(1);
  }

  const db = getDb();
  const admin = createAdminClient();

  const { data: listed } = await admin.auth.admin.listUsers({ perPage: 1000 });
  const existing = listed?.users?.find((u) => u.email?.toLowerCase() === email);

  let authUserId: string;

  if (existing) {
    const { data, error } = await admin.auth.admin.updateUserById(existing.id, {
      password,
      email_confirm: true,
      user_metadata: { full_name: name, role: "super_admin" },
    });
    if (error || !data.user) {
      console.error("Failed to update auth user:", error?.message);
      process.exit(1);
    }
    authUserId = data.user.id;
    console.log("✓ Updated existing auth user");
  } else {
    const { data, error } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: name, role: "super_admin" },
    });
    if (error || !data.user) {
      console.error("Failed to create auth user:", error?.message);
      process.exit(1);
    }
    authUserId = data.user.id;
    console.log("✓ Created auth user");
  }

  const [row] = await db
    .select()
    .from(adminUsers)
    .where(eq(adminUsers.authUserId, authUserId))
    .limit(1);

  if (row) {
    await db
      .update(adminUsers)
      .set({ email, fullName: name, role: "super_admin", isActive: true })
      .where(eq(adminUsers.id, row.id));
    console.log("✓ Updated admin_users row");
  } else {
    await db.insert(adminUsers).values({
      authUserId,
      email,
      fullName: name,
      role: "super_admin",
      isActive: true,
    });
    console.log("✓ Created admin_users row");
  }

  console.log(`✓ Super admin ready: ${email}`);
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
