CREATE TYPE "public"."admin_role" AS ENUM('super_admin', 'administrator', 'finance_manager', 'compliance_officer', 'support_agent', 'auditor');--> statement-breakpoint
CREATE TYPE "public"."audit_action" AS ENUM('create', 'update', 'delete', 'approve', 'reject', 'login', 'logout', 'export', 'adjustment');--> statement-breakpoint
CREATE TYPE "public"."deposit_status" AS ENUM('pending', 'approved', 'rejected', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."investment_status" AS ENUM('pending', 'active', 'matured', 'cancelled', 'reinvested');--> statement-breakpoint
CREATE TYPE "public"."ledger_account_type" AS ENUM('available', 'invested', 'pending_deposit', 'pending_withdrawal', 'referral');--> statement-breakpoint
CREATE TYPE "public"."ledger_entry_type" AS ENUM('deposit', 'withdrawal', 'investment_principal', 'investment_interest', 'referral_commission', 'reinvestment', 'admin_adjustment', 'reversal');--> statement-breakpoint
CREATE TYPE "public"."notification_channel" AS ENUM('in_app', 'email', 'sms', 'push');--> statement-breakpoint
CREATE TYPE "public"."notification_event_status" AS ENUM('pending', 'processing', 'completed', 'failed');--> statement-breakpoint
CREATE TYPE "public"."notification_status" AS ENUM('pending', 'sent', 'failed', 'read');--> statement-breakpoint
CREATE TYPE "public"."permission_category" AS ENUM('users', 'finance', 'investments', 'compliance', 'support', 'system', 'audit');--> statement-breakpoint
CREATE TYPE "public"."transaction_direction" AS ENUM('credit', 'debit');--> statement-breakpoint
CREATE TYPE "public"."user_status" AS ENUM('active', 'suspended', 'pending_verification');--> statement-breakpoint
CREATE TYPE "public"."withdrawal_status" AS ENUM('pending', 'approved', 'rejected', 'processing', 'completed', 'cancelled');--> statement-breakpoint
CREATE TABLE "admin_users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"auth_user_id" uuid NOT NULL,
	"legacy_admin_id" integer,
	"email" text NOT NULL,
	"full_name" text NOT NULL,
	"role" "admin_role" DEFAULT 'super_admin' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"last_login_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "admin_users_auth_user_id_unique" UNIQUE("auth_user_id"),
	CONSTRAINT "admin_users_legacy_admin_id_unique" UNIQUE("legacy_admin_id"),
	CONSTRAINT "admin_users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "login_history" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"profile_id" uuid,
	"admin_user_id" uuid,
	"ip_address" text,
	"user_agent" text,
	"device_fingerprint" text,
	"country" text,
	"city" text,
	"success" boolean NOT NULL,
	"failure_reason" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "profiles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"auth_user_id" uuid NOT NULL,
	"legacy_user_id" integer,
	"email" text NOT NULL,
	"full_name" text NOT NULL,
	"username" text NOT NULL,
	"avatar_path" text,
	"status" "user_status" DEFAULT 'active' NOT NULL,
	"referral_code" text NOT NULL,
	"referred_by_profile_id" uuid,
	"phone" text,
	"country" text,
	"timezone" text DEFAULT 'UTC',
	"email_verified" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "profiles_auth_user_id_unique" UNIQUE("auth_user_id"),
	CONSTRAINT "profiles_legacy_user_id_unique" UNIQUE("legacy_user_id"),
	CONSTRAINT "profiles_email_unique" UNIQUE("email"),
	CONSTRAINT "profiles_username_unique" UNIQUE("username"),
	CONSTRAINT "profiles_referral_code_unique" UNIQUE("referral_code")
);
--> statement-breakpoint
CREATE TABLE "user_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"profile_id" uuid,
	"admin_user_id" uuid,
	"auth_session_id" text,
	"ip_address" text,
	"user_agent" text,
	"device_label" text,
	"last_active_at" timestamp with time zone,
	"revoked_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "investment_plans" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"daily_roi_percent" numeric(8, 4) NOT NULL,
	"max_roi_percent" numeric(8, 4),
	"min_deposit" numeric(18, 2) NOT NULL,
	"max_deposit" numeric(18, 2),
	"duration_days" integer NOT NULL,
	"lock_period_days" integer DEFAULT 5 NOT NULL,
	"referral_commission_percent" numeric(8, 4) DEFAULT '10' NOT NULL,
	"reinvest_enabled" boolean DEFAULT true NOT NULL,
	"max_reinvest_cycles" integer DEFAULT 2 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "investment_plans_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "investments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"profile_id" uuid NOT NULL,
	"plan_id" uuid NOT NULL,
	"legacy_transaction_id" integer,
	"principal_amount" numeric(18, 2) NOT NULL,
	"accrued_interest" numeric(18, 2) DEFAULT '0' NOT NULL,
	"status" "investment_status" DEFAULT 'pending' NOT NULL,
	"payment_method" text,
	"external_transaction_ref" text,
	"started_at" timestamp with time zone,
	"matures_at" timestamp with time zone,
	"matured_at" timestamp with time zone,
	"last_accrual_at" timestamp with time zone,
	"reinvest_cycle" integer DEFAULT 0 NOT NULL,
	"parent_investment_id" uuid,
	"approved_by_admin_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "investments_legacy_transaction_id_unique" UNIQUE("legacy_transaction_id")
);
--> statement-breakpoint
CREATE TABLE "deposit_requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"profile_id" uuid NOT NULL,
	"plan_id" uuid,
	"amount" numeric(18, 2) NOT NULL,
	"payment_method" text NOT NULL,
	"external_transaction_ref" text NOT NULL,
	"status" "deposit_status" DEFAULT 'pending' NOT NULL,
	"legacy_transaction_id" integer,
	"reviewed_by_admin_id" uuid,
	"reviewed_at" timestamp with time zone,
	"rejection_reason" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "deposit_requests_legacy_transaction_id_unique" UNIQUE("legacy_transaction_id")
);
--> statement-breakpoint
CREATE TABLE "ledger_accounts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"profile_id" uuid NOT NULL,
	"account_type" "ledger_account_type" NOT NULL,
	"currency" text DEFAULT 'USD' NOT NULL,
	"label" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ledger_entries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"account_id" uuid NOT NULL,
	"direction" "transaction_direction" NOT NULL,
	"amount" numeric(18, 2) NOT NULL,
	"entry_type" "ledger_entry_type" NOT NULL,
	"idempotency_key" text NOT NULL,
	"reference_type" text,
	"reference_id" uuid,
	"legacy_transaction_id" integer,
	"description" text,
	"metadata" text,
	"created_by_profile_id" uuid,
	"created_by_admin_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "ledger_entries_idempotency_key_unique" UNIQUE("idempotency_key")
);
--> statement-breakpoint
CREATE TABLE "withdrawal_requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"profile_id" uuid NOT NULL,
	"amount" numeric(18, 2) NOT NULL,
	"payment_method" text NOT NULL,
	"wallet_address" text NOT NULL,
	"network" text NOT NULL,
	"status" "withdrawal_status" DEFAULT 'pending' NOT NULL,
	"legacy_transaction_id" integer,
	"reviewed_by_admin_id" uuid,
	"reviewed_at" timestamp with time zone,
	"rejection_reason" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "withdrawal_requests_legacy_transaction_id_unique" UNIQUE("legacy_transaction_id")
);
--> statement-breakpoint
CREATE TABLE "referral_commissions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"referrer_profile_id" uuid NOT NULL,
	"referred_profile_id" uuid NOT NULL,
	"deposit_request_id" uuid,
	"investment_id" uuid,
	"commission_percent" numeric(8, 4) NOT NULL,
	"commission_amount" numeric(18, 2) NOT NULL,
	"legacy_transaction_id" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "referral_commissions_legacy_transaction_id_unique" UNIQUE("legacy_transaction_id")
);
--> statement-breakpoint
CREATE TABLE "referral_relationships" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"referrer_profile_id" uuid NOT NULL,
	"referred_profile_id" uuid NOT NULL,
	"referral_code_used" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "referral_relationships_referred_profile_id_unique" UNIQUE("referred_profile_id")
);
--> statement-breakpoint
CREATE TABLE "feature_flags" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"key" text NOT NULL,
	"enabled" boolean DEFAULT false NOT NULL,
	"description" text,
	"metadata" jsonb,
	"updated_by_admin_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "feature_flags_key_unique" UNIQUE("key")
);
--> statement-breakpoint
CREATE TABLE "system_settings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"key" text NOT NULL,
	"value" jsonb NOT NULL,
	"description" text,
	"is_public" boolean DEFAULT false NOT NULL,
	"updated_by_admin_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "system_settings_key_unique" UNIQUE("key")
);
--> statement-breakpoint
CREATE TABLE "permissions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"category" "permission_category" NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "permissions_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "role_permissions" (
	"role" "admin_role" NOT NULL,
	"permission_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "role_permissions_role_permission_id_pk" PRIMARY KEY("role","permission_id")
);
--> statement-breakpoint
CREATE TABLE "audit_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"action" "audit_action" NOT NULL,
	"entity_type" text NOT NULL,
	"entity_id" text,
	"actor_profile_id" uuid,
	"actor_admin_id" uuid,
	"ip_address" text,
	"user_agent" text,
	"before_state" jsonb,
	"after_state" jsonb,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "legacy_transactions_archive" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"legacy_transaction_id" integer NOT NULL,
	"legacy_user_id" text,
	"email" text,
	"plan" text,
	"type" text,
	"method" text,
	"amount" text,
	"external_ref" text,
	"interest" text,
	"address" text,
	"network" text,
	"confirm" integer,
	"complete" integer,
	"legacy_created_at" text,
	"legacy_updated_at" text,
	"raw_payload" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "legacy_transactions_archive_legacy_transaction_id_unique" UNIQUE("legacy_transaction_id")
);
--> statement-breakpoint
CREATE TABLE "notification_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"event_type" text NOT NULL,
	"payload" jsonb NOT NULL,
	"status" "notification_event_status" DEFAULT 'pending' NOT NULL,
	"processed_at" timestamp with time zone,
	"error_message" text,
	"idempotency_key" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "notification_events_idempotency_key_unique" UNIQUE("idempotency_key")
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"profile_id" uuid,
	"admin_user_id" uuid,
	"channel" "notification_channel" NOT NULL,
	"event_type" text NOT NULL,
	"title" text NOT NULL,
	"body" text NOT NULL,
	"payload" jsonb,
	"status" "notification_status" DEFAULT 'pending' NOT NULL,
	"read_at" timestamp with time zone,
	"sent_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "login_history" ADD CONSTRAINT "login_history_profile_id_profiles_id_fk" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "login_history" ADD CONSTRAINT "login_history_admin_user_id_admin_users_id_fk" FOREIGN KEY ("admin_user_id") REFERENCES "public"."admin_users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_sessions" ADD CONSTRAINT "user_sessions_profile_id_profiles_id_fk" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_sessions" ADD CONSTRAINT "user_sessions_admin_user_id_admin_users_id_fk" FOREIGN KEY ("admin_user_id") REFERENCES "public"."admin_users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "investments" ADD CONSTRAINT "investments_profile_id_profiles_id_fk" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "investments" ADD CONSTRAINT "investments_plan_id_investment_plans_id_fk" FOREIGN KEY ("plan_id") REFERENCES "public"."investment_plans"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "deposit_requests" ADD CONSTRAINT "deposit_requests_profile_id_profiles_id_fk" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ledger_accounts" ADD CONSTRAINT "ledger_accounts_profile_id_profiles_id_fk" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ledger_entries" ADD CONSTRAINT "ledger_entries_account_id_ledger_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."ledger_accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "withdrawal_requests" ADD CONSTRAINT "withdrawal_requests_profile_id_profiles_id_fk" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "referral_commissions" ADD CONSTRAINT "referral_commissions_referrer_profile_id_profiles_id_fk" FOREIGN KEY ("referrer_profile_id") REFERENCES "public"."profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "referral_commissions" ADD CONSTRAINT "referral_commissions_referred_profile_id_profiles_id_fk" FOREIGN KEY ("referred_profile_id") REFERENCES "public"."profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "referral_commissions" ADD CONSTRAINT "referral_commissions_deposit_request_id_deposit_requests_id_fk" FOREIGN KEY ("deposit_request_id") REFERENCES "public"."deposit_requests"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "referral_commissions" ADD CONSTRAINT "referral_commissions_investment_id_investments_id_fk" FOREIGN KEY ("investment_id") REFERENCES "public"."investments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "referral_relationships" ADD CONSTRAINT "referral_relationships_referrer_profile_id_profiles_id_fk" FOREIGN KEY ("referrer_profile_id") REFERENCES "public"."profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "referral_relationships" ADD CONSTRAINT "referral_relationships_referred_profile_id_profiles_id_fk" FOREIGN KEY ("referred_profile_id") REFERENCES "public"."profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "feature_flags" ADD CONSTRAINT "feature_flags_updated_by_admin_id_admin_users_id_fk" FOREIGN KEY ("updated_by_admin_id") REFERENCES "public"."admin_users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "system_settings" ADD CONSTRAINT "system_settings_updated_by_admin_id_admin_users_id_fk" FOREIGN KEY ("updated_by_admin_id") REFERENCES "public"."admin_users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_permission_id_permissions_id_fk" FOREIGN KEY ("permission_id") REFERENCES "public"."permissions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_actor_profile_id_profiles_id_fk" FOREIGN KEY ("actor_profile_id") REFERENCES "public"."profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_actor_admin_id_admin_users_id_fk" FOREIGN KEY ("actor_admin_id") REFERENCES "public"."admin_users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_profile_id_profiles_id_fk" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_admin_user_id_admin_users_id_fk" FOREIGN KEY ("admin_user_id") REFERENCES "public"."admin_users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "admin_users_auth_user_id_idx" ON "admin_users" USING btree ("auth_user_id");--> statement-breakpoint
CREATE INDEX "admin_users_role_idx" ON "admin_users" USING btree ("role");--> statement-breakpoint
CREATE UNIQUE INDEX "admin_users_email_idx" ON "admin_users" USING btree ("email");--> statement-breakpoint
CREATE INDEX "login_history_profile_id_idx" ON "login_history" USING btree ("profile_id");--> statement-breakpoint
CREATE INDEX "login_history_admin_user_id_idx" ON "login_history" USING btree ("admin_user_id");--> statement-breakpoint
CREATE INDEX "login_history_created_at_idx" ON "login_history" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "profiles_auth_user_id_idx" ON "profiles" USING btree ("auth_user_id");--> statement-breakpoint
CREATE INDEX "profiles_legacy_user_id_idx" ON "profiles" USING btree ("legacy_user_id");--> statement-breakpoint
CREATE INDEX "profiles_referred_by_idx" ON "profiles" USING btree ("referred_by_profile_id");--> statement-breakpoint
CREATE INDEX "profiles_status_idx" ON "profiles" USING btree ("status");--> statement-breakpoint
CREATE INDEX "profiles_email_idx" ON "profiles" USING btree ("email");--> statement-breakpoint
CREATE INDEX "user_sessions_profile_id_idx" ON "user_sessions" USING btree ("profile_id");--> statement-breakpoint
CREATE INDEX "user_sessions_admin_user_id_idx" ON "user_sessions" USING btree ("admin_user_id");--> statement-breakpoint
CREATE INDEX "user_sessions_auth_session_id_idx" ON "user_sessions" USING btree ("auth_session_id");--> statement-breakpoint
CREATE INDEX "investment_plans_slug_idx" ON "investment_plans" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "investment_plans_active_idx" ON "investment_plans" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "investments_profile_id_idx" ON "investments" USING btree ("profile_id");--> statement-breakpoint
CREATE INDEX "investments_plan_id_idx" ON "investments" USING btree ("plan_id");--> statement-breakpoint
CREATE INDEX "investments_status_idx" ON "investments" USING btree ("status");--> statement-breakpoint
CREATE INDEX "investments_legacy_tx_idx" ON "investments" USING btree ("legacy_transaction_id");--> statement-breakpoint
CREATE INDEX "deposit_requests_profile_id_idx" ON "deposit_requests" USING btree ("profile_id");--> statement-breakpoint
CREATE INDEX "deposit_requests_status_idx" ON "deposit_requests" USING btree ("status");--> statement-breakpoint
CREATE UNIQUE INDEX "ledger_accounts_profile_type_currency_idx" ON "ledger_accounts" USING btree ("profile_id","account_type","currency");--> statement-breakpoint
CREATE INDEX "ledger_accounts_profile_id_idx" ON "ledger_accounts" USING btree ("profile_id");--> statement-breakpoint
CREATE INDEX "ledger_entries_account_id_idx" ON "ledger_entries" USING btree ("account_id");--> statement-breakpoint
CREATE INDEX "ledger_entries_entry_type_idx" ON "ledger_entries" USING btree ("entry_type");--> statement-breakpoint
CREATE INDEX "ledger_entries_reference_idx" ON "ledger_entries" USING btree ("reference_type","reference_id");--> statement-breakpoint
CREATE INDEX "ledger_entries_legacy_tx_idx" ON "ledger_entries" USING btree ("legacy_transaction_id");--> statement-breakpoint
CREATE INDEX "ledger_entries_created_at_idx" ON "ledger_entries" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "withdrawal_requests_profile_id_idx" ON "withdrawal_requests" USING btree ("profile_id");--> statement-breakpoint
CREATE INDEX "withdrawal_requests_status_idx" ON "withdrawal_requests" USING btree ("status");--> statement-breakpoint
CREATE INDEX "referral_commissions_referrer_idx" ON "referral_commissions" USING btree ("referrer_profile_id");--> statement-breakpoint
CREATE INDEX "referral_commissions_referred_idx" ON "referral_commissions" USING btree ("referred_profile_id");--> statement-breakpoint
CREATE INDEX "referral_relationships_referrer_idx" ON "referral_relationships" USING btree ("referrer_profile_id");--> statement-breakpoint
CREATE INDEX "feature_flags_key_idx" ON "feature_flags" USING btree ("key");--> statement-breakpoint
CREATE INDEX "system_settings_key_idx" ON "system_settings" USING btree ("key");--> statement-breakpoint
CREATE INDEX "permissions_slug_idx" ON "permissions" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "permissions_category_idx" ON "permissions" USING btree ("category");--> statement-breakpoint
CREATE INDEX "role_permissions_role_idx" ON "role_permissions" USING btree ("role");--> statement-breakpoint
CREATE INDEX "audit_logs_entity_idx" ON "audit_logs" USING btree ("entity_type","entity_id");--> statement-breakpoint
CREATE INDEX "audit_logs_actor_profile_idx" ON "audit_logs" USING btree ("actor_profile_id");--> statement-breakpoint
CREATE INDEX "audit_logs_actor_admin_idx" ON "audit_logs" USING btree ("actor_admin_id");--> statement-breakpoint
CREATE INDEX "audit_logs_action_idx" ON "audit_logs" USING btree ("action");--> statement-breakpoint
CREATE INDEX "audit_logs_created_at_idx" ON "audit_logs" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "legacy_tx_archive_email_idx" ON "legacy_transactions_archive" USING btree ("email");--> statement-breakpoint
CREATE INDEX "legacy_tx_archive_type_idx" ON "legacy_transactions_archive" USING btree ("type");--> statement-breakpoint
CREATE INDEX "legacy_tx_archive_legacy_id_idx" ON "legacy_transactions_archive" USING btree ("legacy_transaction_id");--> statement-breakpoint
CREATE INDEX "notification_events_status_idx" ON "notification_events" USING btree ("status");--> statement-breakpoint
CREATE INDEX "notification_events_event_type_idx" ON "notification_events" USING btree ("event_type");--> statement-breakpoint
CREATE INDEX "notification_events_created_at_idx" ON "notification_events" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "notifications_profile_id_idx" ON "notifications" USING btree ("profile_id");--> statement-breakpoint
CREATE INDEX "notifications_status_idx" ON "notifications" USING btree ("status");--> statement-breakpoint
CREATE INDEX "notifications_event_type_idx" ON "notifications" USING btree ("event_type");--> statement-breakpoint
CREATE INDEX "notifications_created_at_idx" ON "notifications" USING btree ("created_at");