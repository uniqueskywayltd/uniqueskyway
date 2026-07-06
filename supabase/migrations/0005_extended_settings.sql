-- =============================================================================
-- Extended system settings — infrastructure configuration only
-- Business values (referral %, deposit limits) left null until legacy validation
-- =============================================================================

INSERT INTO system_settings (key, value, description, is_public) VALUES
  ('company_phone', 'null'::jsonb, 'Company contact phone — set when available', true),
  ('company_address', '"Fayetteville, Arkansas, United States"'::jsonb, 'Company physical address', true),
  ('timezone', '"America/Chicago"'::jsonb, 'Default platform timezone', false),
  ('referral_percentage', 'null'::jsonb, 'Referral commission % — set after legacy validation', false),
  ('maximum_deposit', 'null'::jsonb, 'Maximum deposit amount — set after legacy validation', false),
  ('notifications_enabled', 'true'::jsonb, 'Master switch for platform notifications', false),
  ('default_investment_status', '"pending"'::jsonb, 'Default status for new investments', false)
ON CONFLICT (key) DO NOTHING;
