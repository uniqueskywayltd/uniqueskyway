-- Ensure customer auth flows are enabled in production.
UPDATE feature_flags
SET enabled = true, updated_at = now()
WHERE key IN ('registrations_enabled');
