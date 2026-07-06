-- =============================================================================
-- M3: Identity tables — preferences, notification settings, auth lockouts
-- =============================================================================

CREATE TABLE "profile_preferences" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "profile_id" uuid NOT NULL,
  "locale" text DEFAULT 'en' NOT NULL,
  "theme" text DEFAULT 'system' NOT NULL,
  "timezone" text DEFAULT 'America/Chicago',
  "marketing_emails" boolean DEFAULT false NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "profile_preferences_profile_id_unique" UNIQUE("profile_id")
);

CREATE TABLE "notification_preferences" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "profile_id" uuid NOT NULL,
  "email_enabled" boolean DEFAULT true NOT NULL,
  "in_app_enabled" boolean DEFAULT true NOT NULL,
  "login_alerts" boolean DEFAULT true NOT NULL,
  "security_alerts" boolean DEFAULT true NOT NULL,
  "investment_updates" boolean DEFAULT true NOT NULL,
  "referral_updates" boolean DEFAULT true NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "notification_preferences_profile_id_unique" UNIQUE("profile_id")
);

CREATE TABLE "auth_lockouts" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "identifier" text NOT NULL,
  "attempt_count" integer DEFAULT 0 NOT NULL,
  "locked_until" timestamp with time zone,
  "last_attempt_at" timestamp with time zone,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "auth_lockouts_identifier_unique" UNIQUE("identifier")
);

ALTER TABLE "profile_preferences"
  ADD CONSTRAINT "profile_preferences_profile_id_profiles_id_fk"
  FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("id") ON DELETE no action ON UPDATE no action;

ALTER TABLE "notification_preferences"
  ADD CONSTRAINT "notification_preferences_profile_id_profiles_id_fk"
  FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("id") ON DELETE no action ON UPDATE no action;

CREATE INDEX "profile_preferences_profile_id_idx" ON "profile_preferences" ("profile_id");
CREATE INDEX "notification_preferences_profile_id_idx" ON "notification_preferences" ("profile_id");
CREATE INDEX "auth_lockouts_identifier_idx" ON "auth_lockouts" ("identifier");

-- user_sessions: richer device metadata
ALTER TABLE "user_sessions" ADD COLUMN IF NOT EXISTS "browser" text;
ALTER TABLE "user_sessions" ADD COLUMN IF NOT EXISTS "os" text;
ALTER TABLE "user_sessions" ADD COLUMN IF NOT EXISTS "is_current" boolean DEFAULT false NOT NULL;
ALTER TABLE "user_sessions" ADD COLUMN IF NOT EXISTS "device_fingerprint" text;

-- Bootstrap flag
INSERT INTO system_settings (key, value, description, is_public) VALUES
  ('admin_bootstrap_completed', 'false'::jsonb, 'Whether super admin bootstrap has run', false)
ON CONFLICT (key) DO NOTHING;

-- RLS
ALTER TABLE profile_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE auth_lockouts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profile_preferences_select_own"
  ON profile_preferences FOR SELECT TO authenticated
  USING (profile_id = public.current_profile_id() OR public.is_admin());

CREATE POLICY "profile_preferences_update_own"
  ON profile_preferences FOR UPDATE TO authenticated
  USING (profile_id = public.current_profile_id())
  WITH CHECK (profile_id = public.current_profile_id());

CREATE POLICY "notification_preferences_select_own"
  ON notification_preferences FOR SELECT TO authenticated
  USING (profile_id = public.current_profile_id() OR public.is_admin());

CREATE POLICY "notification_preferences_update_own"
  ON notification_preferences FOR UPDATE TO authenticated
  USING (profile_id = public.current_profile_id())
  WITH CHECK (profile_id = public.current_profile_id());

-- Lockouts: service/admin only (no direct client access)
CREATE POLICY "auth_lockouts_admin_only"
  ON auth_lockouts FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- updated_at triggers
CREATE TRIGGER set_profile_preferences_updated_at
  BEFORE UPDATE ON profile_preferences
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER set_notification_preferences_updated_at
  BEFORE UPDATE ON notification_preferences
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER set_auth_lockouts_updated_at
  BEFORE UPDATE ON auth_lockouts
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
