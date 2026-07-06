-- =============================================================================
-- System seed data — infrastructure only, NO business rules
-- Does NOT seed investment_plans (pending legacy validation)
-- =============================================================================

-- Feature flags (all disabled at launch)
INSERT INTO feature_flags (key, enabled, description) VALUES
  ('registrations_enabled', false, 'Allow new customer registrations'),
  ('deposits_enabled', false, 'Allow customer deposit requests'),
  ('withdrawals_enabled', false, 'Allow customer withdrawal requests'),
  ('referrals_enabled', false, 'Enable referral program'),
  ('investments_enabled', false, 'Allow new investments — requires validated plans'),
  ('maintenance_mode', false, 'Put platform in maintenance mode')
ON CONFLICT (key) DO NOTHING;

-- System settings (non-business configuration only)
INSERT INTO system_settings (key, value, description, is_public) VALUES
  ('company_name', '"Unique Sky Way"'::jsonb, 'Official company name', true),
  ('support_email', '"info@uniqueskyway.com"'::jsonb, 'Customer support email', true),
  ('primary_email', '"info@uniqueskyway.com"'::jsonb, 'Primary outbound email', false),
  ('default_currency', '"USD"'::jsonb, 'Default platform currency', true),
  ('minimum_deposit', 'null'::jsonb, 'Set after legacy business rule validation', false),
  ('minimum_withdrawal', 'null'::jsonb, 'Set after legacy business rule validation', false),
  ('maintenance_message', '"Unique Sky Way is currently undergoing scheduled maintenance. Please check back shortly."'::jsonb, 'Maintenance mode message', true),
  ('notification_email_enabled', 'true'::jsonb, 'Enable transactional emails', false),
  ('platform_url', '"https://uniqueskyway.com"'::jsonb, 'Production platform URL', true)
ON CONFLICT (key) DO NOTHING;

-- Permissions catalog
INSERT INTO permissions (slug, name, description, category) VALUES
  ('users.read', 'View Users', 'View customer profiles', 'users'),
  ('users.write', 'Edit Users', 'Modify customer profiles', 'users'),
  ('users.delete', 'Delete Users', 'Delete customer accounts', 'users'),
  ('users.suspend', 'Suspend Users', 'Suspend customer accounts', 'users'),
  ('deposits.read', 'View Deposits', 'View deposit requests', 'finance'),
  ('deposits.approve', 'Approve Deposits', 'Approve deposit requests', 'finance'),
  ('deposits.reject', 'Reject Deposits', 'Reject deposit requests', 'finance'),
  ('withdrawals.read', 'View Withdrawals', 'View withdrawal requests', 'finance'),
  ('withdrawals.approve', 'Approve Withdrawals', 'Approve withdrawal requests', 'finance'),
  ('withdrawals.reject', 'Reject Withdrawals', 'Reject withdrawal requests', 'finance'),
  ('ledger.read', 'View Ledger', 'View ledger entries and balances', 'finance'),
  ('ledger.adjust', 'Adjust Ledger', 'Post admin ledger adjustments', 'finance'),
  ('investments.read', 'View Investments', 'View investment positions', 'investments'),
  ('investments.manage', 'Manage Investments', 'Create and modify investments', 'investments'),
  ('plans.read', 'View Plans', 'View investment plans', 'investments'),
  ('plans.manage', 'Manage Plans', 'Create and modify investment plans', 'investments'),
  ('referrals.read', 'View Referrals', 'View referral data', 'investments'),
  ('referrals.manage', 'Manage Referrals', 'Modify referral relationships', 'investments'),
  ('support.read', 'View Support', 'View support tickets', 'support'),
  ('support.manage', 'Manage Support', 'Respond to support tickets', 'support'),
  ('compliance.read', 'View Compliance', 'View compliance data', 'compliance'),
  ('compliance.manage', 'Manage Compliance', 'Manage compliance reviews', 'compliance'),
  ('settings.read', 'View Settings', 'View system settings', 'system'),
  ('settings.manage', 'Manage Settings', 'Modify system settings', 'system'),
  ('feature_flags.manage', 'Manage Feature Flags', 'Toggle feature flags', 'system'),
  ('email.broadcast', 'Broadcast Email', 'Send broadcast emails', 'system'),
  ('audit.read', 'View Audit Logs', 'View audit trail', 'audit'),
  ('audit.export', 'Export Audit Logs', 'Export audit data', 'audit'),
  ('admins.read', 'View Admins', 'View admin users', 'system'),
  ('admins.manage', 'Manage Admins', 'Create and modify admin users', 'system')
ON CONFLICT (slug) DO NOTHING;

-- Super admin gets all permissions
INSERT INTO role_permissions (role, permission_id)
SELECT 'super_admin'::admin_role, p.id
FROM permissions p
ON CONFLICT DO NOTHING;

-- Administrator role permissions
INSERT INTO role_permissions (role, permission_id)
SELECT 'administrator'::admin_role, p.id
FROM permissions p
WHERE p.slug IN (
  'users.read', 'users.write', 'users.suspend',
  'deposits.read', 'deposits.approve', 'deposits.reject',
  'withdrawals.read', 'withdrawals.approve', 'withdrawals.reject',
  'ledger.read', 'investments.read', 'plans.read',
  'referrals.read', 'support.read', 'support.manage',
  'settings.read', 'audit.read', 'email.broadcast'
)
ON CONFLICT DO NOTHING;

-- Finance manager permissions
INSERT INTO role_permissions (role, permission_id)
SELECT 'finance_manager'::admin_role, p.id
FROM permissions p
WHERE p.slug IN (
  'deposits.read', 'deposits.approve', 'deposits.reject',
  'withdrawals.read', 'withdrawals.approve', 'withdrawals.reject',
  'ledger.read', 'ledger.adjust',
  'investments.read', 'referrals.read', 'audit.read'
)
ON CONFLICT DO NOTHING;

-- Compliance officer permissions
INSERT INTO role_permissions (role, permission_id)
SELECT 'compliance_officer'::admin_role, p.id
FROM permissions p
WHERE p.slug IN (
  'users.read', 'compliance.read', 'compliance.manage',
  'audit.read', 'audit.export', 'ledger.read'
)
ON CONFLICT DO NOTHING;

-- Support agent permissions
INSERT INTO role_permissions (role, permission_id)
SELECT 'support_agent'::admin_role, p.id
FROM permissions p
WHERE p.slug IN (
  'users.read', 'support.read', 'support.manage',
  'deposits.read', 'withdrawals.read'
)
ON CONFLICT DO NOTHING;

-- Auditor permissions (read-only)
INSERT INTO role_permissions (role, permission_id)
SELECT 'auditor'::admin_role, p.id
FROM permissions p
WHERE p.slug IN (
  'audit.read', 'audit.export', 'ledger.read',
  'users.read', 'investments.read', 'deposits.read', 'withdrawals.read'
)
ON CONFLICT DO NOTHING;

-- investment_plans intentionally left EMPTY
-- Plans will be populated after legacy business logic validation
