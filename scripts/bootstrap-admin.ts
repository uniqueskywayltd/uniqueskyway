import "dotenv/config";
import { eq } from "drizzle-orm";
import { getDb } from "../src/db";
import { adminUsers, systemSettings } from "../src/db/schema";
import { createAdminClient } from "../src/lib/supabase/admin";
import { SYSTEM_SETTINGS_KEYS } from "../src/lib/auth/constants";

/**
 * One-time Super Admin bootstrap.
 * Usage: npm run bootstrap:admin -- --email=admin@example.com --password=... --name="Admin Name"
 */
async function bootstrap() {
  const args = process.argv.slice(2);
  const email = args.find((a) => a.startsWith("--email="))?.split("=")[1];
  const password = args.find((a) => a.startsWith("--password="))?.split("=")[1];
  const name = args.find((a) => a.startsWith("--name="))?.split("=")[1] ?? "Super Admin";

  if (!email || !password) {
    console.error("Usage: npm run bootstrap:admin -- --email=... --password=... --name=\"Full Name\"");
    process.exit(1);
  }

  const db = getDb();

  const [bootstrapSetting] = await db
    .select()
    .from(systemSettings)
    .where(eq(systemSettings.key, SYSTEM_SETTINGS_KEYS.ADMIN_BOOTSTRAP_COMPLETED))
    .limit(1);

  if (bootstrapSetting?.value === true) {
    console.error("✗ Bootstrap already completed. Cannot create another super admin via bootstrap.");
    process.exit(1);
  }

  const [existingAdmin] = await db
    .select()
    .from(adminUsers)
    .where(eq(adminUsers.role, "super_admin"))
    .limit(1);

  if (existingAdmin) {
    console.error("✗ A super admin already exists. Bootstrap is disabled.");
    await db
      .update(systemSettings)
      .set({ value: true })
      .where(eq(systemSettings.key, SYSTEM_SETTINGS_KEYS.ADMIN_BOOTSTRAP_COMPLETED));
    process.exit(1);
  }

  const admin = createAdminClient();
  const { data: authData, error: authError } = await admin.auth.admin.createUser({
    email: email.toLowerCase(),
    password,
    email_confirm: true,
    user_metadata: { full_name: name, role: "super_admin" },
  });

  if (authError || !authData.user) {
    console.error("✗ Failed to create auth user:", authError?.message);
    process.exit(1);
  }

  await db.insert(adminUsers).values({
    authUserId: authData.user.id,
    email: email.toLowerCase(),
    fullName: name,
    role: "super_admin",
    isActive: true,
  });

  await db
    .update(systemSettings)
    .set({ value: true })
    .where(eq(systemSettings.key, SYSTEM_SETTINGS_KEYS.ADMIN_BOOTSTRAP_COMPLETED));

  console.log("✓ Super Admin created successfully");
  console.log(`  Email: ${email}`);
  console.log("✓ Bootstrap mode disabled permanently");
  process.exit(0);
}

bootstrap().catch((err) => {
  console.error("Bootstrap failed:", err);
  process.exit(1);
});
